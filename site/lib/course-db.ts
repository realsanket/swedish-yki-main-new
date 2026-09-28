import { getDb } from "./db";
import type { CourseLecture } from "./course-types.ts";
import { CourseError, defaultCourseLectureState, defaultCourseProgress, updateCourseState, type CourseAction, type CourseLectureState, type CourseProgressData } from "./course-progress.ts";
import { learningDay } from "./progress.ts";

type StateRow = { lecture_id: string; state: string; revision: number };
type MutationRow = { request_hash: string };

export async function readCourseProgress(userId: string): Promise<CourseProgressData> {
  const db = getDb();
  const rows = db.prepare("SELECT lecture_id, state, revision FROM lecture_state WHERE user_id = ? ORDER BY lecture_id").all(userId) as StateRow[];
  const result = defaultCourseProgress();
  for (const row of rows) result.lectures[row.lecture_id] = { ...JSON.parse(row.state) as CourseLectureState, revision: row.revision };
  return result;
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
}
async function requestHash(action: CourseAction): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(action)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
function assertRetry(existing: MutationRow, hash: string): void {
  if (existing.request_hash !== hash) throw new CourseError(409, "This save ID was already used for different work. Keep your draft and reload the latest saved version.", "mutation_conflict");
}

export async function applyCourseAction(userId: string, action: CourseAction, lecture: CourseLecture, now = Date.now()): Promise<void> {
  const db = getDb();
  const hash = await requestHash(action);
  const findMutation = () => db.prepare("SELECT request_hash FROM course_mutations WHERE user_id = ? AND mutation_id = ?").get(userId, action.mutationId) as MutationRow | undefined;
  const existing = findMutation();
  if (existing) { assertRetry(existing, hash); return; }
  const row = db.prepare("SELECT lecture_id, state, revision FROM lecture_state WHERE user_id = ? AND lecture_id = ?").get(userId, action.lectureId) as StateRow | undefined;
  const current = row ? { ...JSON.parse(row.state) as CourseLectureState, revision: row.revision } : defaultCourseLectureState();
  if (current.revision !== action.revision) {
    const retried = findMutation();
    if (retried) { assertRetry(retried, hash); return; }
    throw new CourseError(409, "This lecture was changed in another tab. Your unsaved work is still here; reload the saved version before trying again.", "revision_conflict");
  }
  const attemptId = action.action === "completePractice" ? action.attemptId : null;
  if (attemptId) {
    const attempt = db.prepare("SELECT mutation_id FROM course_mutations WHERE user_id = ? AND attempt_id = ?").get(userId, attemptId);
    if (attempt) throw new CourseError(409, "This practice attempt has already been saved. Start a new attempt to save different work.", "attempt_conflict");
  }
  const next = updateCourseState(current, action, lecture, now);
  const eventId = attemptId ? `practice:course-${attemptId}` : "";

  const result = db.transaction(() => {
    const r1 = db.prepare(`INSERT INTO lecture_state (user_id, lecture_id, state, revision, last_mutation_id, updated_at)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM course_mutations WHERE user_id = ? AND (mutation_id = ? OR (? IS NOT NULL AND attempt_id = ?)))
        AND NOT EXISTS (SELECT 1 FROM study_events WHERE user_id = ? AND id = ?)
        AND (? = 0 OR EXISTS (SELECT 1 FROM lecture_state WHERE user_id = ? AND lecture_id = ?))
      ON CONFLICT(user_id, lecture_id) DO UPDATE SET state = excluded.state, revision = excluded.revision,
        last_mutation_id = excluded.last_mutation_id, updated_at = excluded.updated_at
      WHERE lecture_state.revision = ?`)
      .run(userId, action.lectureId, JSON.stringify(next), next.revision, action.mutationId, now,
        userId, action.mutationId, attemptId, attemptId, userId, eventId, action.revision, userId, action.lectureId, action.revision);
    db.prepare(`INSERT INTO course_mutations (user_id, mutation_id, lecture_id, request_hash, attempt_id, created_at)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE EXISTS (SELECT 1 FROM lecture_state WHERE user_id = ? AND lecture_id = ? AND revision = ? AND last_mutation_id = ?)
      ON CONFLICT(user_id, mutation_id) DO NOTHING`)
      .run(userId, action.mutationId, action.lectureId, hash, attemptId, now, userId, action.lectureId, next.revision, action.mutationId);
    if (action.action === "completePractice") {
      db.prepare(`INSERT INTO study_events (user_id, id, kind, subject, score, day, created_at, minutes, xp)
        SELECT ?, ?, 'practice', ?, ?, ?, ?, ?, 20
        WHERE EXISTS (SELECT 1 FROM lecture_state WHERE user_id = ? AND lecture_id = ? AND revision = ? AND last_mutation_id = ?)
        ON CONFLICT(user_id, id) DO NOTHING`)
        .run(userId, eventId, action.skill, action.score, learningDay(now), now, action.minutes, userId, action.lectureId, next.revision, action.mutationId);
    }
    return r1;
  })();

  if (result.changes > 0) return;
  const retried = findMutation();
  if (retried) { assertRetry(retried, hash); return; }
  throw new CourseError(409, "This lecture or practice attempt was just saved elsewhere. Keep your draft and reload the latest version.", "revision_conflict");
}
