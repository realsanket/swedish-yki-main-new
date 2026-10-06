// Server progress rules for lecture-owned extra steps. Run: npm run test:progress
import assert from "node:assert/strict";
import { getLecture } from "../lib/course.ts";
import {
  defaultCourseLectureState, parseCourseAction, resumeEntry, routeSequence, updateCourseState, CourseError,
} from "../lib/course-progress.ts";

const lecture = getLecture("lecture-01")!;
const seq = routeSequence(lecture).map((e) => e.key);
assert.deepEqual(seq, ["recall", "teach", "extra:textbook-page", "guided", "practice", "check", "assignment"]);
let m = 0;
const act = (a: object) => ({ lectureId: lecture.id, revision: 0, mutationId: `m${++m}`, ...a });
const answersFor = (qs: { id: string; answers: string[] }[]) => Object.fromEntries(qs.map((q) => [q.id, q.answers[0]]));

let s = defaultCourseLectureState();
s = { ...s, answers: { ...answersFor(lecture.recall), ...answersFor(lecture.guided), ...answersFor(lecture.checkpoint) } };
const err = (fn: () => unknown, code: string) => assert.throws(fn, (e: unknown) => e instanceof CourseError && e.code === code);

// The extra step cannot be saved before the part it follows.
err(() => updateCourseState(s, parseCourseAction(act({ action: "completeExtraStep", stepId: "textbook-page" })) , lecture), "part_incomplete");
// Unknown step ids are rejected.
assert.throws(() => updateCourseState(s, parseCourseAction(act({ action: "completeExtraStep", stepId: "nope" })), lecture), CourseError);

s = updateCourseState(s, parseCourseAction(act({ action: "completePart", part: "recall", acknowledged: true })), lecture);
assert.equal(resumeEntry(lecture, s).key, "teach");
// The textbook step follows the teaching, so it cannot be saved before it.
err(() => updateCourseState(s, parseCourseAction(act({ action: "completeExtraStep", stepId: "textbook-page" })) , lecture), "part_incomplete");
s = updateCourseState(s, parseCourseAction(act({ action: "completePart", part: "teach", acknowledged: true })), lecture);
assert.equal(resumeEntry(lecture, s).key, "extra:textbook-page");
// Guided is blocked until the textbook step is done, with the step named.
assert.throws(() => updateCourseState(s, parseCourseAction(act({ action: "completePart", part: "guided", acknowledged: true })), lecture), /Textbook page 4/);
s = updateCourseState(s, parseCourseAction(act({ action: "completeExtraStep", stepId: "textbook-page" })), lecture);
assert.deepEqual(s.completedExtraSteps, ["textbook-page"]);
assert.equal(resumeEntry(lecture, s).key, "guided");
// Saving it again is harmless.
s = updateCourseState(s, parseCourseAction(act({ action: "completeExtraStep", stepId: "textbook-page" })), lecture);
assert.deepEqual(s.completedExtraSteps, ["textbook-page"]);
assert.equal(s.part, "guided");
// A record saved under the old order (textbook page done, teaching not yet) resumes at the teaching.
const oldOrder = { ...defaultCourseLectureState(), completedParts: ["recall"] as const, completedExtraSteps: ["textbook-page"] } as ReturnType<typeof defaultCourseLectureState>;
assert.equal(resumeEntry(lecture, oldOrder).key, "teach");

// An older record without the field still reads and resumes correctly.
const legacy = { ...defaultCourseLectureState(), completedParts: ["recall", "teach"] as const } as ReturnType<typeof defaultCourseLectureState>;
delete (legacy as { completedExtraSteps?: string[] }).completedExtraSteps;
assert.equal(resumeEntry(lecture, legacy).key, "extra:textbook-page");
// A lecture with no extra steps keeps the plain six-part route.
const plain = { ...lecture, extraSteps: undefined };
assert.equal(routeSequence(plain).length, 6);
// Ids of removed steps are dropped on the next save.
const stale = updateCourseState({ ...legacy, completedExtraSteps: ["gone"] }, parseCourseAction(act({ action: "saveDraft", patch: { notes: "x" } })), lecture);
assert.deepEqual(stale.completedExtraSteps, []);
// Lecture 2 has its own step id.
assert.deepEqual(routeSequence(getLecture("lecture-02")!).map((e) => e.key)[2], "extra:textbook-pages");
console.log("extra-step progress: all checks passed");
