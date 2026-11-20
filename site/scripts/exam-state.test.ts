// Exam-course progress rules. Run: npm run test:exam
import assert from "node:assert/strict";
import { applyExamAction, defaultExamState, dueCards, ExamError, isUnitDone, nextLearningDayStart, normalizeExamState, summarise, todayUnitKey, type ExamContext } from "../lib/exam-state.ts";
// P0 shim: package C replaces this. These tests still cover the v1 reducer.
import type { ExamActionV1 as ExamAction } from "../lib/exam-types.ts";

const ctx: ExamContext = {
  unitKeys: new Set(["1", "2", "3a", "7", "83"]),
  cardsByUnit: new Map([["1", ["d1-p1", "d1-p2"]], ["2", ["d2-p1"]]]),
  contentCardIds: new Set(["d1-p1", "d1-p2", "d2-p1"]),
};
const order = ["1", "2", "3a", "7", "83"];
const T0 = Date.parse("2026-11-16T10:00:00Z");
const log = (unitKey: string, gar: "green" | "amber" | "red", minutes = 60): ExamAction => ({ type: "logDay", unitKey, log: { gar, minutes } });
const fails = (fn: () => unknown, code: string) => assert.throws(fn, (e: unknown) => e instanceof ExamError && e.code === code, code);

// today = first unit that is not done; Red keeps the same day as "today"
let s = defaultExamState(T0);
assert.equal(todayUnitKey(order, s), "1");
s = applyExamAction(s, log("1", "red"), ctx, T0);
assert.equal(isUnitDone(s, "1"), false);
assert.equal(todayUnitKey(order, s), "1");
assert.deepEqual(Object.keys(s.cards), [], "a Red day seeds no cards");
s = applyExamAction(s, log("1", "amber"), ctx, T0 + 1000);
assert.equal(isUnitDone(s, "1"), true);
assert.equal(todayUnitKey(order, s), "2");
assert.deepEqual(Object.keys(s.cards).sort(), ["d1-p1", "d1-p2"]);

// cards logged today are not due today, but are due from the next learning day
const lookup = (id: string) => ({ front: `front ${id}`, back: `back ${id}` });
assert.equal(dueCards(s, lookup, T0 + 2000).length, 0);
const tomorrow = nextLearningDayStart(T0);
assert.ok(tomorrow > T0 && tomorrow - T0 <= 2 * 86_400_000);
assert.equal(dueCards(s, lookup, tomorrow + 1).length, 2);

// reviewing: idempotent by eventId, schedules forward, 'again' comes back within the day
const due = tomorrow + 5000;
const r1 = applyExamAction(s, { type: "reviewCard", cardId: "d1-p1", rating: "good", eventId: "e1" }, ctx, due);
assert.ok(r1.cards["d1-p1"].due > due + 80_000_000);
const r1again = applyExamAction(r1, { type: "reviewCard", cardId: "d1-p1", rating: "good", eventId: "e1" }, ctx, due + 10);
assert.deepEqual(r1again.cards["d1-p1"], r1.cards["d1-p1"], "same eventId must not apply twice");
const r2 = applyExamAction(r1, { type: "reviewCard", cardId: "d1-p2", rating: "again", eventId: "e2" }, ctx, due);
assert.ok(r2.cards["d1-p2"].due - due < 3_600_000);
fails(() => applyExamAction(defaultExamState(T0), { type: "reviewCard", cardId: "d1-p1", rating: "good", eventId: "e" }, ctx, due), "not_started");
fails(() => applyExamAction(s, { type: "reviewCard", cardId: "nope", rating: "good", eventId: "e" }, ctx, due), "unknown_card");

// validation
fails(() => applyExamAction(s, log("99", "green"), ctx, T0), "unknown_unit");
assert.throws(() => applyExamAction(s, { type: "logDay", unitKey: "2", log: { gar: "blue" as never, minutes: 5 } }, ctx, T0), ExamError);
assert.throws(() => applyExamAction(s, { type: "logDay", unitKey: "2", log: { gar: "green", minutes: -1 } }, ctx, T0), ExamError);
assert.throws(() => applyExamAction(s, { type: "logDay", unitKey: "2", log: { gar: "green", minutes: 5, recalled: { got: 6, of: 5 } } }, ctx, T0), ExamError);
const piloted = applyExamAction(s, { type: "logDay", unitKey: "2", log: { gar: "green", minutes: 72, newPatterns: 5, recalled: { got: 4, of: 5 }, tooMuch: "typing" } }, ctx, T0);
assert.deepEqual(piloted.days["2"].recalled, { got: 4, of: 5 });
assert.equal(piloted.days["2"].tooMuch, "typing");

// light and rest days can be marked done without a pilot record
s = applyExamAction(s, log("83", "green", 20), ctx, T0);
assert.equal(isUnitDone(s, "83"), true);

// resetting a day
const reset = applyExamAction(s, { type: "resetDay", unitKey: "1" }, ctx, T0);
assert.equal(isUnitDone(reset, "1"), false);

// steps toggle idempotently
let t = applyExamAction(defaultExamState(T0), { type: "tickStep", unitKey: "2", stepId: "s2", done: true }, ctx, T0);
t = applyExamAction(t, { type: "tickStep", unitKey: "2", stepId: "s2", done: true }, ctx, T0);
t = applyExamAction(t, { type: "tickStep", unitKey: "2", stepId: "s1", done: true }, ctx, T0);
assert.deepEqual(t.steps["2"], ["s1", "s2"]);
t = applyExamAction(t, { type: "tickStep", unitKey: "2", stepId: "s1", done: false }, ctx, T0);
t = applyExamAction(t, { type: "tickStep", unitKey: "2", stepId: "s2", done: false }, ctx, T0);
assert.equal(t.steps["2"], undefined);

// errors: add is idempotent by id, resolve and delete
let e = applyExamAction(defaultExamState(T0), { type: "addError", id: "x1", text: "Jag är bor", right: "Jag bor", unitKey: "1" }, ctx, T0);
e = applyExamAction(e, { type: "addError", id: "x1", text: "other", unitKey: "1" }, ctx, T0);
assert.equal(e.errors.length, 1);
assert.equal(e.errors[0].text, "Jag är bor");
fails(() => applyExamAction(e, { type: "resolveError", id: "zz", resolved: true }, ctx, T0), "unknown_error");
e = applyExamAction(e, { type: "resolveError", id: "x1", resolved: true }, ctx, T0 + 5);
assert.equal(summarise(order, e).openErrors, 0);
e = applyExamAction(e, { type: "deleteError", id: "x1" }, ctx, T0);
assert.equal(e.errors.length, 0);
assert.throws(() => applyExamAction(e, { type: "addError", id: "x2", text: "x".repeat(301) }, ctx, T0), ExamError);

// own cards: must use the c- prefix, are due at once, and can be deleted; content cards cannot
assert.throws(() => applyExamAction(e, { type: "addCard", id: "d1-p9", front: "a", back: "b" }, ctx, T0), ExamError);
let c = applyExamAction(e, { type: "addCard", id: "c-1", front: "tomorrow", back: "i morgon" }, ctx, T0);
assert.equal(dueCards(c, () => undefined, T0).length, 1);
assert.equal(dueCards(c, () => undefined, T0)[0].custom, true);
fails(() => applyExamAction(s, { type: "deleteCard", id: "d1-p1" }, ctx, T0), "not_custom");
// a card made on a day waits for the next learning day; one with no day is due at once
const dayCard = applyExamAction(e, { type: "addCard", id: "c-d1-l1", front: "Vad heter du?", back: "What is your name?", unitKey: "1" }, ctx, T0);
assert.equal(dueCards(dayCard, () => undefined, T0).length, 0, "a day's own card is not due today");
assert.equal(dueCards(dayCard, () => undefined, nextLearningDayStart(T0) + 1).length, 1, "and is due the next learning day");
c = applyExamAction(c, { type: "deleteCard", id: "c-1" }, ctx, T0);
assert.deepEqual(c.cards, {});

// mock skill signals (they decide nothing)
let g = applyExamAction(defaultExamState(T0), { type: "setSignal", mock: "28", skill: "speaking", gar: "amber" }, ctx, T0);
g = applyExamAction(g, { type: "setSignal", mock: "28", skill: "writing", gar: "green" }, ctx, T0);
assert.deepEqual(g.signals["28"], { speaking: "amber", writing: "green" });
g = applyExamAction(g, { type: "setSignal", mock: "28", skill: "speaking", gar: null }, ctx, T0);
assert.deepEqual(g.signals["28"], { writing: "green" });
assert.throws(() => applyExamAction(g, { type: "setSignal", mock: "40" as never, skill: "speaking", gar: "green" }, ctx, T0), ExamError);

// stored JSON of any shape normalises to a complete state
assert.deepEqual(Object.keys(normalizeExamState(null)).sort(), ["cards", "days", "errors", "signals", "steps", "updatedAt", "version"]);
assert.equal(normalizeExamState({ days: { "1": { gar: "green", minutes: 5, date: "2026-11-16", loggedAt: 1 } } }).errors.length, 0);

// the input state is never mutated
const frozen = defaultExamState(T0);
const before = JSON.stringify(frozen);
applyExamAction(frozen, log("1", "green"), ctx, T0);
assert.equal(JSON.stringify(frozen), before);

console.log("exam state: all checks passed");
