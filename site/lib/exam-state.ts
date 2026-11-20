import { learningDay, scheduleReview } from "./progress.ts";
// P0 shim: package C replaces this. The first-slice reducer still runs on the v1 shapes.
import type { ExamActionV1 as ExamAction, ExamCardStateV1 as ExamCardState, ExamDayLogV1 as ExamDayLog, ExamGar, ExamSkill, ExamStateV1 as ExamState } from "./exam-types.ts";

/** Pure progress logic for the exam course track: no database, no content imports. */

export class ExamError extends Error {
  constructor(public status: number, message: string, public code = "invalid") {
    super(message);
    this.name = "ExamError";
  }
}

export type ExamContext = {
  unitKeys: ReadonlySet<string>;
  /** unit key -> content card ids made on that day (Days 1-14). */
  cardsByUnit: ReadonlyMap<string, readonly string[]>;
  contentCardIds: ReadonlySet<string>;
};

const DAY_MS = 86_400_000;
const GAR: readonly ExamGar[] = ["green", "amber", "red"];
const SKILLS: readonly ExamSkill[] = ["listening", "speaking", "reading", "writing"];
const MOCKS = ["28", "56", "84"] as const;
export const EXAM_LIMITS = { errors: 500, customCards: 300, text: 300, note: 600 } as const;

export function defaultExamState(now = Date.now()): ExamState {
  return { version: 1, steps: {}, days: {}, errors: [], cards: {}, signals: {}, updatedAt: now };
}

/** Accepts stored JSON of any age and returns a complete state (never throws). */
export function normalizeExamState(raw: unknown, now = Date.now()): ExamState {
  const base = defaultExamState(now);
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<ExamState>;
  return {
    version: 1,
    steps: value.steps && typeof value.steps === "object" ? value.steps : base.steps,
    days: value.days && typeof value.days === "object" ? value.days : base.days,
    errors: Array.isArray(value.errors) ? value.errors : base.errors,
    cards: value.cards && typeof value.cards === "object" ? value.cards : base.cards,
    signals: value.signals && typeof value.signals === "object" ? value.signals : base.signals,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : now,
  };
}

/** About the start of the next learning day in Finland (DST drift of one hour is acceptable here). */
export function nextLearningDayStart(now: number): number {
  const day = learningDay(now);
  const next = new Date(Date.parse(`${day}T12:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
  return Date.parse(`${next}T00:00:00+02:00`);
}

function text(value: unknown, label: string, max: number, required = true): string {
  if (typeof value !== "string") {
    if (required) throw new ExamError(400, `${label} must be text.`);
    return "";
  }
  const trimmed = value.trim();
  if (required && !trimmed) throw new ExamError(400, `${label} cannot be empty.`);
  if (trimmed.length > max) throw new ExamError(400, `${label} is too long (at most ${max} characters).`);
  return trimmed;
}

function count(value: unknown, label: string, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) throw new ExamError(400, `${label} must be a number from 0 to ${max}.`);
  return Math.round(value);
}

function ratio(value: unknown, label: string): { got: number; of: number } | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object") throw new ExamError(400, `${label} must be like 4 of 5.`);
  const v = value as { got?: unknown; of?: unknown };
  const of = count(v.of, `${label} total`, 99);
  const got = count(v.got, `${label} correct`, 99);
  if (got > of) throw new ExamError(400, `${label}: correct cannot be more than the total.`);
  return { got, of };
}

function gar(value: unknown): ExamGar {
  if (typeof value !== "string" || !GAR.includes(value as ExamGar)) throw new ExamError(400, "Choose Green, Amber or Red.");
  return value as ExamGar;
}

/** A unit is done when it has been logged and was not marked Red (Red means repeat). */
export function isUnitDone(state: ExamState, unitKey: string): boolean {
  const log = state.days[unitKey];
  return !!log && log.gar !== "red";
}

export function applyExamAction(previous: ExamState, action: ExamAction, ctx: ExamContext, now = Date.now()): ExamState {
  const state = structuredClone(previous);
  state.updatedAt = now;
  const requireUnit = (key: unknown): string => {
    if (typeof key !== "string" || !ctx.unitKeys.has(key)) throw new ExamError(404, "This day was not found in the exam course.", "unknown_unit");
    return key;
  };
  switch (action.type) {
    case "tickStep": {
      const key = requireUnit(action.unitKey);
      const stepId = text(action.stepId, "Step", 20);
      const set = new Set(state.steps[key] ?? []);
      if (action.done) set.add(stepId); else set.delete(stepId);
      if (set.size) state.steps[key] = [...set].sort(); else delete state.steps[key];
      return state;
    }
    case "logDay": {
      const key = requireUnit(action.unitKey);
      const l = action.log;
      const log: ExamDayLog = {
        gar: gar(l.gar),
        minutes: count(l.minutes, "Minutes", 600),
        date: typeof l.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(l.date) ? l.date : learningDay(now),
        loggedAt: now,
      };
      const note = text(l.note, "Note", EXAM_LIMITS.note, false);
      if (note) log.note = note;
      if (l.newPatterns != null) log.newPatterns = count(l.newPatterns, "New patterns", 30);
      for (const field of ["recalled", "understood", "changed", "typed"] as const) {
        const r = ratio(l[field], field);
        if (r) log[field] = r;
      }
      const tooMuch = text(l.tooMuch, "What was too much", EXAM_LIMITS.note, false);
      if (tooMuch) log.tooMuch = tooMuch;
      state.days[key] = log;
      if (log.gar !== "red") {
        // Cards made today join the review queue from the next learning day.
        for (const id of ctx.cardsByUnit.get(key) ?? []) {
          if (!state.cards[id]) state.cards[id] = { interval: 0, ease: 2.5, due: nextLearningDayStart(now), repetitions: 0 };
        }
      }
      return state;
    }
    case "resetDay": {
      const key = requireUnit(action.unitKey);
      delete state.days[key];
      return state;
    }
    case "addError": {
      const id = text(action.id, "Error id", 60);
      if (state.errors.some((e) => e.id === id)) return state;
      if (state.errors.length >= EXAM_LIMITS.errors) throw new ExamError(409, "The error list is full. Resolve or delete some entries first.", "full");
      const entry = { id, text: text(action.text, "Error", EXAM_LIMITS.text), createdAt: now } as ExamState["errors"][number];
      const right = text(action.right, "Correct form", EXAM_LIMITS.text, false);
      if (right) entry.right = right;
      if (action.unitKey) entry.unitKey = requireUnit(action.unitKey);
      state.errors.push(entry);
      return state;
    }
    case "resolveError": {
      const e = state.errors.find((x) => x.id === action.id);
      if (!e) throw new ExamError(404, "This error was not found.", "unknown_error");
      if (action.resolved) e.resolvedAt = e.resolvedAt ?? now; else delete e.resolvedAt;
      return state;
    }
    case "deleteError": {
      state.errors = state.errors.filter((e) => e.id !== action.id);
      return state;
    }
    case "addCard": {
      const id = text(action.id, "Card id", 60);
      if (!id.startsWith("c-")) throw new ExamError(400, "A learner card id must start with c-.");
      if (state.cards[id]) return state;
      if (Object.values(state.cards).filter((c) => c.custom).length >= EXAM_LIMITS.customCards) throw new ExamError(409, "You have 300 own cards. Delete some first.", "full");
      const custom: NonNullable<ExamCardState["custom"]> = { front: text(action.front, "Front", EXAM_LIMITS.text), back: text(action.back, "Back", EXAM_LIMITS.text) };
      if (action.unitKey) custom.unitKey = requireUnit(action.unitKey);
      // A card made on a day joins the review the next learning day, like the day's own cards; a card with no day is due at once.
      state.cards[id] = { custom, interval: 0, ease: 2.5, due: action.unitKey ? nextLearningDayStart(now) : now, repetitions: 0 };
      return state;
    }
    case "deleteCard": {
      const card = state.cards[action.id];
      if (!card?.custom) throw new ExamError(400, "Only your own cards can be deleted.", "not_custom");
      delete state.cards[action.id];
      return state;
    }
    case "reviewCard": {
      const card = state.cards[action.cardId];
      if (!card) {
        if (ctx.contentCardIds.has(action.cardId)) throw new ExamError(409, "Log that day first; its cards join the review the next day.", "not_started");
        throw new ExamError(404, "This card was not found.", "unknown_card");
      }
      const eventId = text(action.eventId, "Event id", 80);
      if (card.lastEventId === eventId) return previous;
      const next = scheduleReview({ interval: card.interval, ease: card.ease, due: card.due, repetitions: card.repetitions }, action.rating, now);
      state.cards[action.cardId] = { ...card, ...next, lastEventId: eventId };
      return state;
    }
    case "setSignal": {
      if (!MOCKS.includes(action.mock)) throw new ExamError(400, "Signals belong to Mock 1, 2 or 3 (days 28, 56, 84).");
      if (!SKILLS.includes(action.skill)) throw new ExamError(400, "Unknown subtest.");
      const row = { ...(state.signals[action.mock] ?? {}) };
      if (action.gar === null) delete row[action.skill]; else row[action.skill] = gar(action.gar);
      if (Object.keys(row).length) state.signals[action.mock] = row; else delete state.signals[action.mock];
      return state;
    }
    default:
      throw new ExamError(400, "Unknown exam action.");
  }
}

/* ------------------------------ selectors ------------------------------ */

export type ExamCardView = { id: string; front: string; back: string; unitKey?: string; custom: boolean; due: number; repetitions: number };

export function dueCards(state: ExamState, lookup: (id: string) => { front: string; back: string; unitKey?: string } | undefined, now = Date.now()): ExamCardView[] {
  const out: ExamCardView[] = [];
  for (const [id, s] of Object.entries(state.cards)) {
    if (s.due > now) continue;
    const content = s.custom ? { front: s.custom.front, back: s.custom.back, unitKey: s.custom.unitKey } : lookup(id);
    if (!content) continue;
    out.push({ id, front: content.front, back: content.back, unitKey: content.unitKey, custom: !!s.custom, due: s.due, repetitions: s.repetitions });
  }
  return out.sort((a, b) => a.due - b.due);
}

/** The first unit that is not done (a Red unit stays "today" until it is logged Green or Amber). */
export function todayUnitKey(unitKeys: readonly string[], state: ExamState): string | null {
  return unitKeys.find((key) => !isUnitDone(state, key)) ?? null;
}

export function summarise(unitKeys: readonly string[], state: ExamState) {
  const done = unitKeys.filter((k) => isUnitDone(state, k)).length;
  const counts = { green: 0, amber: 0, red: 0 };
  let minutes = 0;
  for (const log of Object.values(state.days)) {
    counts[log.gar] += 1;
    minutes += log.minutes;
  }
  return { done, total: unitKeys.length, counts, minutes, openErrors: state.errors.filter((e) => !e.resolvedAt).length };
}
