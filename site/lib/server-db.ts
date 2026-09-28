import { getDb } from "./db";
import { defaultProgress, learningDay, ProgressError, scheduleReview, type PracticeSkill, type ProgressAction, type ProgressData, type ReviewState } from "./progress";

type ProfileRow = { name: string; daily_goal: 15 | 30 | 45; level: ProgressData["profile"]["level"] };
type ReviewRow = ReviewState & { word_id: string; revision: number };

export async function readProgress(userId: string): Promise<ProgressData> {
  const db = getDb();
  const profiles = db.prepare("SELECT name, daily_goal, level FROM learner_profiles WHERE user_id = ? LIMIT 1").all(userId) as ProfileRow[];
  const completed = db.prepare("SELECT subject FROM study_events WHERE user_id = ? AND kind = 'complete' ORDER BY created_at, id").all(userId) as { subject: string }[];
  const reviews = db.prepare("SELECT word_id, interval, ease, due, repetitions FROM learner_reviews WHERE user_id = ?").all(userId) as ReviewRow[];
  const activity = db.prepare("SELECT day, SUM(minutes) AS minutes, SUM(xp) AS xp FROM study_events WHERE user_id = ? GROUP BY day ORDER BY day").all(userId) as { day: string; minutes: number; xp: number }[];
  const attempts = db.prepare("SELECT id, subject, score, created_at FROM study_events WHERE user_id = ? AND kind = 'practice' ORDER BY created_at DESC, id DESC LIMIT 200").all(userId) as { id: string; subject: PracticeSkill; score: number | null; created_at: number }[];

  const result = defaultProgress();
  const profile = profiles[0];
  if (profile) result.profile = { name: profile.name, dailyGoal: profile.daily_goal, level: profile.level };
  result.completed = completed.map(row => row.subject);
  for (const row of reviews) result.reviews[row.word_id] = { interval: row.interval, ease: row.ease, due: row.due, repetitions: row.repetitions };
  for (const row of activity) result.activity[row.day] = { minutes: row.minutes, xp: row.xp };
  result.attempts = attempts.map(row => ({ id: row.id.slice("practice:".length), skill: row.subject, score: row.score, date: new Date(row.created_at).toISOString() }));
  return result;
}

export async function applyProgress(userId: string, action: ProgressAction, now = Date.now()): Promise<void> {
  const db = getDb();
  const day = learningDay(now);

  if (action.action === "profile") {
    const { name, dailyGoal, level } = action.profile;
    db.prepare(`INSERT INTO learner_profiles (user_id, name, daily_goal, level, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        name = COALESCE(?, learner_profiles.name),
        daily_goal = COALESCE(?, learner_profiles.daily_goal),
        level = COALESCE(?, learner_profiles.level), updated_at = excluded.updated_at`)
      .run(userId, name ?? "Learner", dailyGoal ?? 15, level ?? "A0", now, name ?? null, dailyGoal ?? null, level ?? null);
    return;
  }

  if (action.action === "complete" || action.action === "practice") {
    const complete = action.action === "complete";
    const id = complete ? `lesson:${action.lessonId}` : `practice:${action.id}`;
    const subject = complete ? action.lessonId : action.skill;
    const score = complete ? null : action.score;
    db.prepare(`INSERT INTO study_events (user_id, id, kind, subject, score, day, created_at, minutes, xp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, id) DO NOTHING`)
      .run(userId, id, action.action, subject, score, day, now, action.minutes, complete ? 60 : 20);
    return;
  }

  const eventId = `review:${action.id}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = db.prepare("SELECT subject FROM study_events WHERE user_id = ? AND id = ? AND kind = 'review'").get(userId, eventId) as { subject: string } | undefined;
    if (existing) {
      if (existing.subject !== action.wordId) throw new ProgressError(409, "This review ID was already used for a different word.");
      return;
    }
    const current = db.prepare("SELECT word_id, interval, ease, due, repetitions, revision FROM learner_reviews WHERE user_id = ? AND word_id = ?")
      .get(userId, action.wordId) as ReviewRow | undefined;
    const next = scheduleReview(current ?? undefined, action.rating, now);
    const revision = current ? current.revision + 1 : 0;

    const result = db.transaction(() => {
      const r1 = db.prepare(`INSERT INTO learner_reviews (user_id, word_id, interval, ease, due, repetitions, revision, last_event_id)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM study_events WHERE user_id = ? AND id = ?)
        ON CONFLICT(user_id, word_id) DO UPDATE SET interval = excluded.interval,
          ease = excluded.ease, due = excluded.due, repetitions = excluded.repetitions,
          revision = excluded.revision, last_event_id = excluded.last_event_id
        WHERE learner_reviews.revision = ?`)
        .run(userId, action.wordId, next.interval, next.ease, next.due, next.repetitions, revision, eventId, userId, eventId, current?.revision ?? -1);
      db.prepare(`INSERT INTO study_events (user_id, id, kind, subject, score, day, created_at, minutes, xp)
        SELECT ?, ?, 'review', ?, NULL, ?, ?, 0, 5
        WHERE EXISTS (SELECT 1 FROM learner_reviews WHERE user_id = ? AND word_id = ? AND revision = ? AND last_event_id = ?)
        ON CONFLICT(user_id, id) DO NOTHING`)
        .run(userId, eventId, action.wordId, day, now, userId, action.wordId, revision, eventId);
      return r1;
    })();

    if (result.changes > 0) return;
  }
  throw new ProgressError(409, "This word was just reviewed on another device. Refresh and try again.");
}
