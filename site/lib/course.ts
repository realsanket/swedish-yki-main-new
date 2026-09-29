import { words } from "./curriculum.ts";
import type {
  CourseLecture,
  CourseModule,
  CoursePart,
  EpisodeRoute,
  LectureContent,
  Skill,
} from "./course-types.ts";
export { COURSE_PARTS } from "./course-types.ts";
export type {
  CourseLecture,
  CourseQuestion,
  CoursePart,
  EpisodeRoute,
} from "./course-types.ts";

import lectureData from "../content/lectures/index.json";
import modulesData from "../content/modules.json";

const courseModules = modulesData.modules as CourseModule[];
const lectureTitles = modulesData.titles as string[];
export { courseModules };

export type EpisodeRouteProfile =
  | "standard"
  | "clinic"
  | "checkpoint"
  | "yki-workshop"
  | "yki-mock";

export type RouteStepProfile = {
  part: CoursePart;
  label: string;
  description: string;
  minutes: number;
};

export type RouteProfile = {
  id: EpisodeRouteProfile;
  label: string;
  steps: RouteStepProfile[];
};

/**
 * The six stored CoursePart values remain stable. Only their learner-facing
 * labels and pacing change by episode type.
 */
export const routeProfiles: Record<EpisodeRouteProfile, RouteProfile> = {
  standard: {
    id: "standard",
    label: "Lesson route",
    steps: [
      { part: "recall", label: "Warm up", description: "A short preview or a return to last lesson.", minutes: 5 },
      { part: "teach", label: "Learn the rules", description: "Meet today's rules one at a time.", minutes: 10 },
      { part: "guided", label: "Try the phrases", description: "Recognise, produce, improve one thing.", minutes: 8 },
      { part: "practice", label: "Do the task", description: "Use Swedish for one real purpose, with Stigen alongside.", minutes: 12 },
      { part: "check", label: "Check yourself", description: "Show what you can now do.", minutes: 6 },
      { part: "assignment", label: "Take it forward", description: "Save the rule, the phrase, and the next return.", minutes: 4 },
    ],
  },
  clinic: {
    id: "clinic",
    label: "Clinic route",
    steps: [
      { part: "recall", label: "First attempt", description: "Try the new situation before using a model.", minutes: 12 },
      { part: "teach", label: "Notice what happened", description: "Find the detail that helped or blocked you.", minutes: 8 },
      { part: "guided", label: "Fix one thing", description: "Use focused support, not a full restart.", minutes: 8 },
      { part: "practice", label: "Second attempt", description: "Complete the task again with clearer Swedish.", minutes: 14 },
      { part: "check", label: "Change the scene", description: "Adapt the task to one new condition.", minutes: 10 },
      { part: "assignment", label: "Save evidence", description: "Keep a useful phrase and your next focus.", minutes: 8 },
    ],
  },
  checkpoint: {
    id: "checkpoint",
    label: "Checkpoint route",
    steps: [
      { part: "recall", label: "Start independently", description: "Show what you can already do without a model.", minutes: 10 },
      { part: "teach", label: "Understand input", description: "Work for gist, detail and required action.", minutes: 12 },
      { part: "guided", label: "Produce language", description: "Respond to the unfamiliar situation.", minutes: 16 },
      { part: "practice", label: "See skill evidence", description: "Keep listening, reading, speaking and writing separate.", minutes: 8 },
      { part: "check", label: "Repair one skill", description: "Choose one high-value change for a retry.", minutes: 8 },
      { part: "assignment", label: "Choose next practice", description: "Set one realistic return task.", minutes: 6 },
    ],
  },
  "yki-workshop": {
    id: "yki-workshop",
    label: "YKI workshop route",
    steps: [
      { part: "recall", label: "Know the task", description: "Read the Swedish instruction and set the conditions.", minutes: 7 },
      { part: "teach", label: "Timed first attempt", description: "Work independently before looking at support.", minutes: 20 },
      { part: "guided", label: "Notice the strategy", description: "Identify one strategy that helps the task.", minutes: 7 },
      { part: "practice", label: "Timed retry", description: "Transfer the strategy to fresh material.", minutes: 15 },
      { part: "check", label: "Review by skill", description: "Keep evidence for each skill separate.", minutes: 6 },
      { part: "assignment", label: "Set next drill", description: "Choose one small targeted return.", minutes: 5 },
    ],
  },
  "yki-mock": {
    id: "yki-mock",
    label: "YKI mock route",
    steps: [
      { part: "recall", label: "Set conditions", description: "Prepare a quiet, timed first attempt.", minutes: 3 },
      { part: "teach", label: "Timed listening", description: "Listen for meaning before transcript support.", minutes: 10 },
      { part: "guided", label: "Timed reading", description: "Read for purpose, detail and action.", minutes: 10 },
      { part: "practice", label: "Timed production", description: "Speak and write independently from keywords.", minutes: 30 },
      { part: "check", label: "Diagnose by skill", description: "Find one pattern in each skill result.", minutes: 5 },
      { part: "assignment", label: "Targeted return", description: "Save a short evidence-based next step.", minutes: 2 },
    ],
  },
};

export function routeProfileForLecture(
  lecture: Pick<LectureContent | CourseLecture, "number">,
): RouteProfile {
  if (lecture.number >= 59) return routeProfiles["yki-mock"];
  if (lecture.number >= 56) return routeProfiles["yki-workshop"];
  if (lecture.number === 25 || lecture.number === 45 || lecture.number === 55) return routeProfiles.checkpoint;
  if (lecture.number % 5 === 0) return routeProfiles.clinic;
  return routeProfiles.standard;
}

const allSkills: Skill[] = ["listening", "speaking", "reading", "writing"];
const legacyPrimarySkills: Record<number, "speaking" | "writing"> = {
  1: "speaking", 2: "speaking", 3: "speaking", 4: "speaking",
  6: "speaking", 7: "speaking", 8: "speaking", 9: "speaking",
  11: "speaking", 12: "speaking", 13: "writing", 14: "speaking",
  16: "speaking", 17: "writing", 18: "speaking", 19: "speaking",
  21: "writing", 22: "speaking", 23: "speaking", 24: "writing",
  26: "speaking", 27: "writing", 28: "speaking", 29: "speaking",
  31: "speaking", 32: "speaking", 33: "writing", 34: "writing",
  36: "speaking", 37: "writing", 38: "writing", 39: "speaking",
  41: "writing", 42: "speaking", 43: "writing", 44: "writing",
  46: "speaking", 47: "speaking", 48: "writing", 49: "speaking",
  51: "speaking", 52: "writing", 53: "speaking", 54: "writing",
};

function fallbackPrimarySkill(number: number): "speaking" | "writing" {
  return legacyPrimarySkills[number] ?? "speaking";
}

function fallbackTransfer(instructions: string): string {
  const match = instructions.match(/TRANSFER:\s*([^\n]+)/i);
  return match?.[1]?.trim() || "Change one important detail and respond again.";
}

function fallbackExpectedOutput(
  lecture: LectureContent | CourseLecture,
  primarySkill: Skill,
): string {
  const practice = "practice" in lecture ? lecture.practice : lecture;
  if (primarySkill === "writing") return practice.writing.prompt;
  if (primarySkill === "speaking") return practice.speaking.prompt;
  return lecture.objectives[0];
}

/**
 * Lets old or externally-authored content participate in the route before it
 * has been regenerated. The live Lesson 1 provides authored route data, so
 * this only protects existing saved/course content.
 */
export function routeForLecture(lecture: LectureContent | CourseLecture): EpisodeRoute {
  if (lecture.route) return lecture.route;
  const profile = routeProfileForLecture(lecture).id;
  const primarySkill = fallbackPrimarySkill(lecture.number);
  const requiredSkills = profile === "standard" ? [primarySkill] : allSkills;
  return {
    primarySkill,
    requiredSkills,
    expectedOutput: fallbackExpectedOutput(lecture, primarySkill),
    transferPrompt: fallbackTransfer(lecture.assignment.instructions),
    returnPrompt: lecture.takeaways.at(-1) || "Bring one useful phrase back in a later task.",
    successChecks: [
      "You complete the real-life purpose.",
      "The essential information is understandable.",
      "You adapt one important detail on the retry.",
    ],
  };
}

export const lectures: CourseLecture[] = (lectureData as LectureContent[])
  .sort((a, b) => a.number - b.number)
  .map((content) => {
    const courseModule = courseModules.find(
      (item) => content.number >= item.first && content.number <= item.last,
    );
    if (!courseModule) throw new Error(`Lecture ${content.number} has no module`);
    const { practice, ...teaching } = content;
    const route = routeForLecture(content);
    const routeProfile = routeProfileForLecture(content);
    return {
      ...teaching,
      ...practice,
      route,
      id: `lecture-${String(content.number).padStart(2, "0")}`,
      module: courseModule.number,
      level: courseModule.level,
      kind: content.number % 5 === 0 ? "clinic" : "lesson",
      title: lectureTitles[content.number - 1],
      summary: content.objectives[0],
      previous: content.number > 1 ? [`lecture-${String(content.number - 1).padStart(2, "0")}`] : [],
      minutes: routeProfile.steps.reduce((total, step) => total + step.minutes, 0),
    };
  });

export function getLecture(id: string): CourseLecture | undefined {
  return lectures.find((lecture) => lecture.id === id);
}

export const courseWords = [
  ...new Map(
    [...words, ...lectures.flatMap((l) => l.words)].map((w) => [w.id, w]),
  ).values(),
];
