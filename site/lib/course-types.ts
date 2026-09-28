import type { Level, Skill, Word, Lesson } from "./curriculum.ts";

export type ReadingPassage = {
  text: string;
  gist: {
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
  };
  detail: {
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
  };
};

export const COURSE_PARTS = [
  "recall",
  "teach",
  "guided",
  "practice",
  "check",
  "assignment",
] as const;
export type CoursePart = (typeof COURSE_PARTS)[number];
export type CourseQuestion = {
  id: string;
  prompt: string;
  answers: string[];
  options?: string[];
  hint: string;
  explanation: string;
};
/**
 * The learner-facing task contract for one episode. It intentionally lives
 * alongside the curriculum content, rather than in the progress record, so a
 * revised route can still read old saved six-step progress safely.
 */
export type EpisodeRoute = {
  /** The one productive task that makes a normal episode complete. */
  primarySkill: Skill;
  /** Skills that must have an attempted task in this episode. */
  requiredSkills: Skill[];
  /** A concrete, visible description of what the learner will produce. */
  expectedOutput: string;
  /** A small changed condition for the second, transferable attempt. */
  transferPrompt: string;
  /** A deliberately short prompt used when this language returns later. */
  returnPrompt: string;
  /** Observable, task-first checks for useful feedback. */
  successChecks: string[];
};
export type TeachingSection = {
  title: string;
  /** `rule` = grammar/sound rule (formal card). `scene` = story/context. `register` = usage split. Optional; renderer defaults to `scene`. */
  kind?: "scene" | "rule" | "register";
  body: string[];
  examples: { fi: string; en: string; note?: string }[];
  table?: { headings: string[]; rows: string[][] };
};
export type BookConnection = {
  chapter: string;
  title: string;
  story: string;
  sourceUrl: string;
  image?: { src: string; alt: string; caption?: string };
  gallery?: { src: string; alt: string; caption?: string }[];
  audio?: { src: string; label: string; description?: string }[];
  activities: string[];
  answerSupport?: string;
};
export type LecturePractice = Pick<
  Lesson,
  "words" | "pronunciation" | "listening" | "reading" | "speaking" | "writing"
> & {
  reading_passage?: ReadingPassage;
};
export type LectureContent = {
  number: number;
  legacyLessonId?: string;
  objectives: string[];
  focusSkills: Skill[];
  /** Optional for legacy JSON; course.ts supplies a safe runtime fallback. */
  route?: EpisodeRoute;
  recall: CourseQuestion[];
  sections: TeachingSection[];
  guided: CourseQuestion[];
  checkpoint: CourseQuestion[];
  assignment: { title: string; instructions: string; model: string };
  takeaways: string[];
  dialogue?: { speaker: string; fi: string; en: string }[];
  bookConnection?: BookConnection;
  bookConnections?: BookConnection[];
  practice: LecturePractice;
};
export type CourseLecture = Omit<LectureContent, "practice" | "route"> &
  LecturePractice & {
    /** Normalized route metadata, always available to the learning player. */
    route: EpisodeRoute;
    id: string;
    module: number;
    level: Level;
    kind: "lesson" | "clinic";
    title: string;
    summary: string;
    previous: string[];
    minutes: number;
  };
export type CourseModule = {
  number: number;
  level: Level;
  title: string;
  outcome: string;
  description: string;
  vocabularyTargets?: {
    active: string;
    recognition: string;
    functional: string;
    recycled: string;
  };
  first: number;
  last: number;
};
export type { Word, Level, Skill };
