import type { CourseLecture, CourseQuestion, CoursePart, LectureExtraStep } from "./course-types.ts";
import type { Skill } from "./curriculum.ts";
import { COURSE_PARTS } from "./course.ts";
import { getYkiMock, parseYkiTargetedReturn } from "./yki-mocks.ts";

export type CourseLectureState = {
  contentVersion: 1;
  revision: number;
  part: CoursePart;
  completedParts: CoursePart[];
  /** Ids of the lecture's own extra steps that are done. Absent in older records. */
  completedExtraSteps?: string[];
  answers: Record<string, string>;
  drafts: Partial<Record<Skill, string>>;
  notes: string;
  assignment: string;
  practice: Partial<Record<Skill, { attemptId: string; score: number | null }>>;
  completedAt: string | null;
  updatedAt: string | null;
};
export type CourseProgressData = { lectures: Record<string, CourseLectureState> };
export type CourseDraftPatch = Partial<Pick<CourseLectureState, "part" | "answers" | "drafts" | "notes" | "assignment">>;
type Mutation = { lectureId: string; revision: number; mutationId: string };
export type CourseAction = Mutation & (
  | { action: "saveDraft"; patch: CourseDraftPatch }
  | { action: "completePart"; part: CoursePart; acknowledged?: true }
  | { action: "completeExtraStep"; stepId: string }
  | { action: "completePractice"; skill: Skill; attemptId: string; score: number | null; minutes: number }
);

export function defaultCourseLectureState(): CourseLectureState {
  return { contentVersion: 1, revision: 0, part: "recall", completedParts: [], completedExtraSteps: [], answers: {}, drafts: {}, notes: "", assignment: "", practice: {}, completedAt: null, updatedAt: null };
}
export function defaultCourseProgress(): CourseProgressData { return { lectures: {} }; }

/** Ignore presentation differences, but never collapse Swedish vowel distinctions. */
export function normalizeCourseAnswer(answer: string): string {
  return answer.normalize("NFC").toLocaleLowerCase("sv").replace(/[\p{P}\p{S}]/gu, " ").replace(/\s+/g, " ").trim();
}
export function questionIsCorrect(question: CourseQuestion, answer: string | undefined): boolean {
  const normalized = normalizeCourseAnswer(answer ?? "");
  return !!normalized && question.answers.some(value => normalizeCourseAnswer(value) === normalized);
}
export function checkpointResult(questions: CourseQuestion[], answers: Record<string, string>) {
  const correct = questions.filter(question => questionIsCorrect(question, answers[question.id])).length;
  const total = questions.length;
  const score = total ? Math.round(correct / total * 100) : 100;
  return { correct, total, score, passed: total === 0 || correct / total >= 0.8 };
}

/** A learning route records an honest attempt, not a score threshold. */
export function questionsAttempted(
  questions: CourseQuestion[],
  answers: Record<string, string>,
) {
  return questions.every((question) =>
    normalizeCourseAnswer(answers[question.id] ?? "").length > 0,
  );
}
export class CourseError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, message: string, code = "invalid_request") {
    super(message); this.name = "CourseError"; this.status = status; this.code = code;
  }
}
const skills: Skill[] = ["listening", "speaking", "reading", "writing"];
const isPart = (value: unknown): value is CoursePart => typeof value === "string" && (COURSE_PARTS as readonly string[]).includes(value);

/**
 * Progress is a prefix, never a set of independently client-selectable steps.
 * Keeping this calculation on the server also repairs an older state whose
 * `part` was saved by a previous client version.
 */
function completedPartPrefix(value: unknown): CoursePart[] {
  const completed = new Set(
    Array.isArray(value) ? value.filter(isPart) : [],
  );
  const prefix: CoursePart[] = [];
  for (const part of COURSE_PARTS) {
    if (!completed.has(part)) break;
    prefix.push(part);
  }
  return prefix;
}

function resumePart(completedParts: readonly CoursePart[]): CoursePart {
  return (
    COURSE_PARTS.find((part) => !completedParts.includes(part)) ??
    COURSE_PARTS[COURSE_PARTS.length - 1]
  );
}

/**
 * One lecture's full route: the six stable parts in order, each followed by
 * the lecture's own extra steps that name it in `after`. The server and the
 * player both walk this list, so a new step kind never needs its own ordering.
 */
export type RouteEntry =
  | { kind: "part"; key: CoursePart; part: CoursePart }
  | { kind: "extra"; key: `extra:${string}`; step: LectureExtraStep };

export function routeSequence(lecture: Pick<CourseLecture, "extraSteps">): RouteEntry[] {
  const extras = lecture.extraSteps ?? [];
  return COURSE_PARTS.flatMap((part): RouteEntry[] => [
    { kind: "part", key: part, part },
    ...extras
      .filter((step) => step.after === part)
      .map((step): RouteEntry => ({ kind: "extra", key: `extra:${step.id}`, step })),
  ]);
}

export function routeEntryDone(
  entry: RouteEntry,
  state: Pick<CourseLectureState, "completedParts" | "completedExtraSteps">,
): boolean {
  return entry.kind === "part"
    ? state.completedParts.includes(entry.part)
    : (state.completedExtraSteps ?? []).includes(entry.step.id);
}

/** Where to resume: the first unfinished step, or the last step when all are done. */
export function resumeEntry(
  lecture: Pick<CourseLecture, "extraSteps">,
  state: Pick<CourseLectureState, "completedParts" | "completedExtraSteps">,
): RouteEntry {
  const sequence = routeSequence(lecture);
  return sequence.find((entry) => !routeEntryDone(entry, state)) ?? sequence[sequence.length - 1];
}

function routeComplete(
  lecture: Pick<CourseLecture, "extraSteps">,
  state: Pick<CourseLectureState, "completedParts" | "completedExtraSteps">,
): boolean {
  return routeSequence(lecture).every((entry) => routeEntryDone(entry, state));
}

/** The first unfinished step before `key`, so a step is never saved out of order. */
function unfinishedBefore(
  lecture: Pick<CourseLecture, "extraSteps">,
  state: Pick<CourseLectureState, "completedParts" | "completedExtraSteps">,
  key: RouteEntry["key"],
): RouteEntry | undefined {
  const sequence = routeSequence(lecture);
  const index = sequence.findIndex((entry) => entry.key === key);
  return sequence.slice(0, index).find((entry) => !routeEntryDone(entry, state));
}

function practiceIsReached(completedParts: readonly CoursePart[]): boolean {
  const practiceIndex = COURSE_PARTS.indexOf("practice");
  return COURSE_PARTS.slice(0, practiceIndex).every((part) =>
    completedParts.includes(part),
  );
}

function isProductiveSkill(
  skill: Skill,
): skill is Extract<Skill, "speaking" | "writing"> {
  return skill === "speaking" || skill === "writing";
}

function hasProductiveAttempt(
  lecture: CourseLecture,
  state: CourseLectureState,
  skill: Extract<Skill, "speaking" | "writing">,
): boolean {
  // A recording is deliberately not stored in the progress record. A short
  // typed version is therefore the durable, privacy-safe evidence we can
  // validate without changing the stored-state schema.
  const mock = getYkiMock(lecture.ykiMockId);
  if (mock) {
    const tasks = skill === "speaking" ? mock.speaking : mock.writing;
    return mockProductionStageComplete(state.drafts?.[skill], tasks);
  }
  return normalizeCourseAnswer(state.drafts?.[skill] ?? "").length > 0;
}

function requiredPracticeSkills(lecture: CourseLecture): Skill[] {
  const routeSkills = Array.isArray(lecture.route?.requiredSkills)
    ? lecture.route.requiredSkills.filter((skill): skill is Skill =>
        skills.includes(skill),
      )
    : [];
  const source = routeSkills.length ? routeSkills : lecture.focusSkills;
  return [...new Set(source.filter((skill): skill is Skill => skills.includes(skill)))];
}

/**
 * Mock receptive evidence is intentionally stored in the existing draft field
 * so older progress records remain readable. The server still checks the
 * actual mock task IDs before it unlocks the next timed stage.
 */
function mockReceptiveStageComplete(
  draft: string | undefined,
  tasks: ReadonlyArray<{ id: string; questions: ReadonlyArray<{ id: string }> }>,
): boolean {
  try {
    const value = JSON.parse(draft ?? "") as {
      kind?: unknown;
      checked?: unknown;
      answers?: unknown;
    };
    const checked = Array.isArray(value.checked) ? value.checked : null;
    const answers =
      value.answers &&
      typeof value.answers === "object" &&
      !Array.isArray(value.answers)
        ? (value.answers as Record<string, unknown>)
        : null;
    return (
      value.kind === "yki-receptive" &&
      !!checked &&
      !!answers &&
      tasks.every(
        (task) =>
          checked.includes(task.id) &&
          task.questions.every(
            (question) =>
              typeof answers[question.id] === "string" &&
              normalizeCourseAnswer(
                answers[question.id] as string,
              ).length > 0,
          ),
      )
    );
  } catch {
    return false;
  }
}

function mockProductionStageComplete(
  draft: string | undefined,
  tasks: ReadonlyArray<{ id: string }>,
): boolean {
  try {
    const value = JSON.parse(draft ?? "") as {
      kind?: unknown;
      responses?: unknown;
    };
    return (
      value.kind === "yki-production" &&
      !!value.responses &&
      typeof value.responses === "object" &&
      !Array.isArray(value.responses) &&
      tasks.every(
        (task) =>
          typeof (value.responses as Record<string, unknown>)[task.id] === "string" &&
          normalizeCourseAnswer(
            (value.responses as Record<string, string>)[task.id],
          ).length >= 10,
      )
    );
  } catch {
    return false;
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CourseError(400, "Send a JSON object.");
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new CourseError(400, "The course request contains unsupported fields.");
}
function identifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value)) throw new CourseError(400, `${label} must be a valid identifier of at most 100 characters.`);
  return value;
}
function text(value: unknown, max: number, label: string): string {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new CourseError(400, `${label} must be text of at most ${max.toLocaleString("en")} characters.`);
  return value;
}
export function parseCourseAction(value: unknown): CourseAction {
  const input = object(value);
  const lectureId = identifier(input.lectureId, "Lecture ID");
  const mutationId = identifier(input.mutationId, "Save ID");
  if (!Number.isSafeInteger(input.revision) || (input.revision as number) < 0) throw new CourseError(400, "Send the lecture's current revision.");
  const common = { lectureId, mutationId, revision: input.revision as number };
  const shared = ["action", "lectureId", "revision", "mutationId"];
  if (input.action === "saveDraft") {
    keys(input, [...shared, "patch"]);
    const patch = object(input.patch);
    keys(patch, ["part", "answers", "drafts", "notes", "assignment"]);
    if (!Object.keys(patch).length) throw new CourseError(400, "Choose something to save.");
    const result: CourseDraftPatch = {};
    if (patch.part !== undefined) {
      if (!isPart(patch.part)) throw new CourseError(400, "Choose a valid lecture part.");
      result.part = patch.part;
    }
    if (patch.answers !== undefined) {
      const answers = object(patch.answers);
      if (Object.keys(answers).length > 100) throw new CourseError(400, "Too many answers were sent.");
      result.answers = {};
      for (const [id, value] of Object.entries(answers)) result.answers[identifier(id, "Question ID")] = text(value, 2000, "An answer");
    }
    if (patch.drafts !== undefined) {
      const drafts = object(patch.drafts); keys(drafts, skills); result.drafts = {};
      for (const [skill, value] of Object.entries(drafts)) result.drafts[skill as Skill] = text(value, 5000, "A practice draft");
    }
    if (patch.notes !== undefined) result.notes = text(patch.notes, 5000, "Lecture notes");
    if (patch.assignment !== undefined) result.assignment = text(patch.assignment, 5000, "The assignment");
    return { ...common, action: "saveDraft", patch: result };
  }
  if (input.action === "completePart") {
    keys(input, [...shared, "part", "acknowledged"]);
    if (!isPart(input.part)) throw new CourseError(400, "Choose a valid lecture part.");
    if (input.acknowledged !== undefined && input.acknowledged !== true) throw new CourseError(400, "Review the lecture part before continuing.");
    return { ...common, action: "completePart", part: input.part, ...(input.acknowledged === true ? { acknowledged: true as const } : {}) };
  }
  if (input.action === "completeExtraStep") {
    keys(input, [...shared, "stepId"]);
    return { ...common, action: "completeExtraStep", stepId: identifier(input.stepId, "Step ID") };
  }
  if (input.action === "completePractice") {
    keys(input, [...shared, "skill", "attemptId", "score", "minutes"]);
    if (!skills.includes(input.skill as Skill)) throw new CourseError(400, "Choose one of the four language skills.");
    if (input.score !== null && (typeof input.score !== "number" || !Number.isFinite(input.score) || input.score < 0 || input.score > 100)) throw new CourseError(400, "A practice score must be 0–100, or null for unscored practice.");
    if (!Number.isInteger(input.minutes) || (input.minutes as number) < 1 || (input.minutes as number) > 60) throw new CourseError(400, "Practice minutes must be a whole number from 1 to 60.");
    if (["speaking", "writing"].includes(input.skill as string) && input.score !== null) throw new CourseError(400, "Speaking and writing practice remain unscored; feedback is not an exam grade.");
    if (["listening", "reading"].includes(input.skill as string) && input.score === null) throw new CourseError(400, "Listening and reading practice need a completed response score, including 0 when no item was correct.");
    return { ...common, action: "completePractice", skill: input.skill as Skill, attemptId: identifier(input.attemptId, "Attempt ID"), score: input.score as number | null, minutes: input.minutes as number };
  }
  throw new CourseError(400, "Unknown course action.");
}

export function updateCourseState(current: CourseLectureState, action: CourseAction, lecture: CourseLecture, now = Date.now()): CourseLectureState {
  if (current.contentVersion !== 1) throw new CourseError(409, "This lecture uses an updated course format. Reload before saving.", "content_version_conflict");
  const completedParts = completedPartPrefix(current.completedParts);
  const mock = getYkiMock(lecture.ykiMockId);
  const next = structuredClone(current);
  // `part` is server-owned: it is derived from the completed prefix, rather
  // than from a draft patch or a client-side preview of a completed step.
  next.completedParts = completedParts;
  next.part = resumePart(completedParts);
  const extraIds = new Set((lecture.extraSteps ?? []).map((step) => step.id));
  next.completedExtraSteps = (current.completedExtraSteps ?? []).filter((id) => extraIds.has(id));
  next.practice = { ...(current.practice ?? {}) };
  if (action.action === "saveDraft") {
    const questionIds = new Set([...lecture.recall, ...lecture.guided, ...lecture.checkpoint].map(question => question.id));
    if (action.patch.answers && Object.keys(action.patch.answers).some(id => !questionIds.has(id))) throw new CourseError(400, "An answer does not belong to this lecture.");
    // `patch.part` is accepted as a harmless legacy field, but is never
    // applied. Completing a part is the only way to advance the route.
    const { part: legacyPart, answers, drafts, ...rest } = action.patch;
    void legacyPart;
    Object.assign(next, rest);
    if (answers) next.answers = { ...(current.answers ?? {}), ...answers };
    if (drafts) next.drafts = { ...(current.drafts ?? {}), ...drafts };
  } else if (action.action === "completePractice") {
    if (!practiceIsReached(completedParts)) {
      throw new CourseError(422, "Reach the episode's Do the task step before saving practice.", "practice_unavailable");
    }
    if (
      isProductiveSkill(action.skill) &&
      !hasProductiveAttempt(lecture, current, action.skill)
    ) {
      throw new CourseError(422, "Write a short version of your response before saving this speaking or writing attempt.", "practice_evidence_missing");
    }
    // `parseCourseAction` enforces this too. Keep the state transition safe
    // when it is called directly by a test or a future server entry point.
    if (!isProductiveSkill(action.skill) && action.score === null) {
      throw new CourseError(422, "Complete the listening or reading response before saving this attempt.", "practice_evidence_missing");
    }
    if (
      mock &&
      !isProductiveSkill(action.skill) &&
      !mockReceptiveStageComplete(
        current.drafts?.[action.skill],
        action.skill === "listening" ? mock.listening : mock.reading,
      )
    ) {
      throw new CourseError(422, "Complete every timed question before saving this mock evidence.", "practice_evidence_missing");
    }
    // Keep the first durable completion evidence for this episode/skill.
    // A later retry still receives its own immutable study event, but cannot
    // erase the attempt that already unlocked the next route step.
    if (!next.practice[action.skill]) {
      next.practice[action.skill] = {
        attemptId: action.attemptId,
        score: action.score,
      };
    }
  } else if (action.action === "completeExtraStep") {
    const step = lecture.extraSteps?.find((item) => item.id === action.stepId);
    if (!step) throw new CourseError(400, "This step does not belong to this lecture.");
    if (!next.completedExtraSteps.includes(step.id)) {
      if (unfinishedBefore(lecture, next, `extra:${step.id}`)) throw new CourseError(422, "Finish the earlier lecture steps before marking this one complete.", "part_incomplete");
      next.completedExtraSteps = [...next.completedExtraSteps, step.id];
      if (!next.completedAt && routeComplete(lecture, next)) next.completedAt = new Date(now).toISOString();
    }
  } else if (!completedParts.includes(action.part)) {
    const blocker = unfinishedBefore(lecture, next, action.part);
    if (blocker) {
      throw new CourseError(
        422,
        blocker.kind === "extra"
          ? `Finish the step “${blocker.step.label}” before marking this one complete.`
          : "Finish the earlier lecture parts before marking this one complete.",
        "part_incomplete",
      );
    }
    if (["recall", "teach", "guided", "check", "assignment"].includes(action.part) && !action.acknowledged) {
      throw new CourseError(422, "Review this step before continuing.", "part_incomplete");
    }
    if (mock && action.part === "teach") {
      if (
        !mockReceptiveStageComplete(
          current.drafts?.listening,
          mock.listening,
        )
      ) {
        throw new CourseError(422, "Complete and check both timed listening tasks before continuing.", "mock_listening_incomplete");
      }
    } else if (mock && action.part === "guided") {
      if (
        !mockReceptiveStageComplete(
          current.drafts?.reading,
          mock.reading,
        )
      ) {
        throw new CourseError(422, "Complete and check both timed reading tasks before continuing.", "mock_reading_incomplete");
      }
    } else if (mock && action.part === "check") {
      // The diagnosis is useful only when it leads to a concrete return.
      // New flows save a skill-tagged plan; a meaningful older free-text
      // reminder remains valid so learners do not lose earlier progress.
      if (!parseYkiTargetedReturn(current.assignment)) {
        throw new CourseError(
          422,
          "Choose and save one specific next drill before leaving this mock diagnosis.",
          "mock_targeted_return_missing",
        );
      }
    } else if (
      action.part === "recall" ||
      (!mock && ["guided", "check"].includes(action.part))
    ) {
      const questions = action.part === "recall"
        ? lecture.recall
        : action.part === "guided"
          ? lecture.guided
          : lecture.checkpoint;
      if (!questionsAttempted(questions, current.answers ?? {})) {
        throw new CourseError(422, "Try each item, then review the feedback before continuing.", "checkpoint_incomplete");
      }
    }
    // Older lesson records did not carry a narrower core task. Their existing
    // focus skill list remains the conservative completion requirement.
    const requiredSkills = requiredPracticeSkills(lecture);
    if (action.part === "practice" && requiredSkills.some(skill => !next.practice[skill])) {
      throw new CourseError(422, "Save the required episode task before continuing. Extra skill practice remains optional.", "practice_incomplete");
    }
    next.completedParts = COURSE_PARTS.filter(part => part === action.part || completedParts.includes(part));
    next.part = resumePart(next.completedParts);
    if (routeComplete(lecture, next)) next.completedAt = new Date(now).toISOString();
  }
  next.updatedAt = new Date(now).toISOString();
  next.revision = current.revision + 1;
  if (new TextEncoder().encode(JSON.stringify(next)).byteLength > 100_000) throw new CourseError(413, "This lecture's saved work is too large. Shorten your notes or drafts.");
  return next;
}
