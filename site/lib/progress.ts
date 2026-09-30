export type LearnerLevel = "A0" | "A1" | "A2" | "B1";
export type PracticeSkill = "listening" | "speaking" | "reading" | "writing";
export type ReviewRating = "again" | "hard" | "good" | "easy";
export type ReviewState = { interval: number; ease: number; due: number; repetitions: number };
export type ProgressData = {
  profile: { name: string; dailyGoal: 15 | 30 | 45; level: LearnerLevel };
  completed: string[];
  reviews: Record<string, ReviewState>;
  activity: Record<string, { minutes: number; xp: number }>;
  attempts: { id: string; skill: PracticeSkill; score: number | null; date: string }[];
};

export function defaultProgress(): ProgressData {
  return { profile: { name: "Learner", dailyGoal: 15, level: "A0" }, completed: [], reviews: {}, activity: {}, attempts: [] };
}

const DAY = 86_400_000;

/** SM-2-inspired intervals in days; due timestamps are Unix milliseconds. */
export function scheduleReview(previous: ReviewState | undefined, rating: ReviewRating, now = Date.now()): ReviewState {
  const current = previous ?? { interval: 0, ease: 2.5, due: now, repetitions: 0 };
  let interval: number;
  let repetitions = current.repetitions + 1;
  let ease = current.ease;
  if (rating === "again") {
    interval = 10 / (24 * 60);
    repetitions = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else if (rating === "hard") {
    interval = Math.max(1, Math.round(current.interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === "easy") {
    interval = current.repetitions === 0 ? 4 : Math.max(4, Math.round(current.interval * ease * 1.3));
    ease = Math.min(3.5, ease + 0.15);
  } else {
    interval = current.repetitions === 0 ? 1 : current.repetitions === 1 ? 6 : Math.max(1, Math.round(current.interval * ease));
  }
  interval = Math.min(365, interval);
  return { interval, ease: Math.round(ease * 100) / 100, due: now + Math.round(interval * DAY), repetitions };
}

/** Learning days consistently follow Finland, including daylight-saving changes. */
export function learningDay(now: number | Date = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function computeStreak(activity: ProgressData["activity"], now: number | Date = Date.now()): number {
  let cursor = Date.parse(`${learningDay(now)}T12:00:00Z`);
  const active = (date: number) => {
    const value = activity[new Date(date).toISOString().slice(0, 10)];
    return !!value && (value.minutes > 0 || value.xp > 0);
  };
  // Yesterday's streak remains available until the end of today.
  if (!active(cursor)) cursor -= DAY;
  let count = 0;
  while (active(cursor)) { count += 1; cursor -= DAY; }
  return count;
}

export type ProgressAction =
  | { action: "profile"; profile: Partial<ProgressData["profile"]> }
  | { action: "complete"; lessonId: string; minutes: number }
  | { action: "review"; id: string; wordId: string; rating: ReviewRating }
  | { action: "practice"; id: string; skill: PracticeSkill; score: number | null; minutes: number };

export class ProgressError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "ProgressError"; }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProgressError(400, "Send a JSON object.");
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw new ProgressError(400, "The request contains unsupported fields.");
}
function identifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value)) throw new ProgressError(400, `${label} must be a valid identifier of at most 100 characters.`);
  return value;
}
function minutes(value: unknown, maximum: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maximum) throw new ProgressError(400, `Study minutes must be a whole number from 1 to ${maximum}.`);
  return value;
}
export function parseProgressAction(value: unknown): ProgressAction {
  const input = record(value);
  switch (input.action) {
    case "profile": {
      keys(input, ["action", "profile"]);
      const profile = record(input.profile);
      keys(profile, ["name", "dailyGoal", "level"]);
      if (!Object.keys(profile).length) throw new ProgressError(400, "Choose at least one profile field to update.");
      const result: Partial<ProgressData["profile"]> = {};
      if (profile.name !== undefined) {
        if (typeof profile.name !== "string" || !profile.name.trim() || profile.name.trim().length > 60 || /[\u0000-\u001f\u007f]/.test(profile.name)) throw new ProgressError(400, "Your name must contain 1–60 printable characters.");
        result.name = profile.name.trim();
      }
      if (profile.dailyGoal !== undefined) {
        if (![15, 30, 45].includes(profile.dailyGoal as number)) throw new ProgressError(400, "Choose a daily goal of 15, 30, or 45 minutes.");
        result.dailyGoal = profile.dailyGoal as 15 | 30 | 45;
      }
      if (profile.level !== undefined) {
        if (!["A0", "A1", "A2", "B1"].includes(profile.level as string)) throw new ProgressError(400, "Choose a learning level from A0 to B1.");
        result.level = profile.level as LearnerLevel;
      }
      return { action: "profile", profile: result };
    }
    case "complete":
      keys(input, ["action", "lessonId", "minutes"]);
      return { action: "complete", lessonId: identifier(input.lessonId, "Lesson ID"), minutes: minutes(input.minutes, 30) };
    case "review":
      keys(input, ["action", "id", "wordId", "rating"]);
      if (!["again", "hard", "good", "easy"].includes(input.rating as string)) throw new ProgressError(400, "Choose a review rating: again, hard, good, or easy.");
      return { action: "review", id: identifier(input.id, "Review ID"), wordId: identifier(input.wordId, "Word ID"), rating: input.rating as ReviewRating };
    case "practice":
      keys(input, ["action", "id", "skill", "score", "minutes"]);
      if (!["listening", "speaking", "reading", "writing"].includes(input.skill as string)) throw new ProgressError(400, "Choose one of the four language skills.");
      if (input.score !== null && (typeof input.score !== "number" || !Number.isFinite(input.score) || input.score < 0 || input.score > 100)) throw new ProgressError(400, "A practice score must be 0–100, or null for unscored practice.");
      return { action: "practice", id: identifier(input.id, "Attempt ID"), skill: input.skill as PracticeSkill, score: input.score as number | null, minutes: minutes(input.minutes, 60) };
    default: throw new ProgressError(400, "Unknown progress action.");
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  // This endpoint is used by the app's own browser. Missing or opaque origins
  // are rejected as well, so cookie-authenticated form posts cannot mutate it.
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  // Compare with the host the browser actually addressed. request.url alone is
  // not enough: the local server binds to 0.0.0.0, so it reports
  // http://0.0.0.0:3000 while the browser's origin is http://localhost:3000,
  // and a hosting proxy can rewrite it the same way.
  const allowedHosts = [
    new URL(request.url).host,
    request.headers.get("host"),
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
  ].filter(Boolean);
  if (!originHost || !allowedHosts.includes(originHost) || request.headers.get("sec-fetch-site") === "cross-site") throw new ProgressError(403, "This request must come from the app's own page.");
}
