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
export type LectureRouteProfileId =
  | "standard"
  | "clinic"
  | "checkpoint"
  | "yki-workshop"
  | "yki-mock";
export type CourseQuestion = {
  id: string;
  prompt: string;
  answers: string[];
  options?: string[];
  hint: string;
  explanation: string;
};
export type SourcePagePractice = {
  title: string;
  /** Short label for a page switcher when a lecture has several pages. */
  tabLabel?: string;
  /** Why this page follows the lecture's own story. Defaults to neutral guidance. */
  intro?: string;
  /** A narrator line that sets the scene before the first turn. */
  setting?: { fi: string; en: string };
  image: string;
  imageAlt: string;
  /** Where the dialogue text sits on the image, in percent, so gist listening can hide it. */
  textRegion?: { top: number; height: number };
  /** Physical page reference shown under the image. */
  pageLabel?: string;
  note?: string;
  focus: string[];
  /** One meaning cue per line, used when the dialogue has fully vanished. */
  recallCues: string[];
  lines: Array<{
    speaker: string;
    voice: string;
    fi: string;
    en: string;
    /** New words in this line, revealed on demand while reading. */
    glossary?: { fi: string; en: string }[];
  }>;
  /** Gist questions answered after the first listen. */
  listenQuestions?: {
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
  }[];
  /** Source wording the learner should recognise, and what to produce instead. */
  naturalNotes?: { source: string; natural: string; note: string }[];
  /** A long line rebuilt from its end, chunk by chunk (backchaining). */
  backchain?: { line: number; chunks: string[] };
  /**
   * Words the page itself marks (in colour), each tied to the rule it shows.
   * The labels are content-owned: one page marks sounds, another pronouns.
   */
  hunt?: {
    label: string;
    title: string;
    instructions: string;
    /** Shown when the learner taps a word the page does not mark. */
    missHint: string;
    spots: { word: string; mark: string; rule: string }[];
  };
};

/**
 * A step one lecture adds to its route. The six stored CourseParts never
 * change: an extra step sits after one of them, is saved under its own `id`,
 * and is drawn by the renderer registered for its `kind` (see
 * components/learning/ExtraStep.tsx). A new kind of step is a new member of
 * this union plus one renderer; lectures that do not need it are unaffected.
 */
export type LectureExtraStep = {
  /** Stable save key. Renaming it resets this step's saved completion. */
  id: string;
  /** The core step this one follows. */
  after: CoursePart;
  label: string;
  description: string;
  minutes: number;
  /** The "Your action" line under the step heading. */
  action: string;
} & (
  | {
      /** Verified textbook pages, practised one at a time behind a page switcher. */
      kind: "source-practice";
      pages: SourcePagePractice[];
    }
  | {
      /** Original YKI speaking tasks: timed dialogues and timed prompt sets. */
      kind: "yki-speaking";
      parts: YkiSpeakingPart[];
    }
  | {
      /** The teacher's own Classroom homework (Google Forms) for this lesson, one or several. */
      kind: "classroom-homework";
      homework: ClassroomHomework[];
    }
);

/**
 * One Classroom homework form from the teacher, kept as the teacher wrote it
 * (obvious typos fixed and listed in `fixes`). A question with `options` is
 * pick-one; without them the learner types the answer. Answers are compared
 * like every typed answer: lower-case, punctuation removed.
 */
export type ClassroomHomework = {
  id: string;
  /** The Classroom item number in docs/excercise. */
  item: number;
  title: string;
  posted: string;
  instructions: string;
  questions: Array<{
    id: string;
    prompt: string;
    translation?: string;
    hint?: string;
    options?: string[];
    answers: string[];
  }>;
  fixes?: string[];
};

/** The four recurring native voices; a one-scene role borrows one of them. */
export type YkiVoice = "Alex" | "Elin" | "Henrik" | "Maja";

/**
 * A YKI dialogue: read the situation, then answer each partner turn within
 * its time, guided by a cue such as "(Svara nekande och förklara varför.)".
 * Every line is original; `bookRef` only points to the book page.
 */
export type YkiDialoguePart = {
  type: "dialogue";
  id: string;
  title: string;
  intro?: string;
  bookRef?: string;
  situation: { fi: string; en: string };
  /** Seconds to read the situation card (the exam gives 15). */
  readSeconds: number;
  partner: { role: string; voice: YkiVoice };
  turns: Array<
    | { who: "partner"; fi: string; en: string }
    | {
        who: "learner";
        cue: { fi: string; en: string };
        /** Answer time for this turn, as stored in content (10-40). */
        seconds: number;
        /** One or two model answers: a short safe one, then a fuller one. */
        models: string[];
        tip?: string;
      }
  >;
  phrases?: { fi: string; en: string }[];
};

/** A timed set of YKI situations (react), topics (tell) or statements (opinion). */
export type YkiPromptSetPart = {
  type: "prompts";
  id: string;
  format: "react" | "tell" | "opinion";
  title: string;
  intro?: string;
  bookRef?: string;
  prepSeconds: number;
  speakSeconds: number;
  /** How many prompts one round asks, picked at random; default all, in order. */
  roundSize?: number;
  rules?: string[];
  frames?: { fi: string; en: string }[];
  prompts: Array<{
    id: string;
    fi: string;
    en: string;
    bullets?: string[];
    model: string;
    modelEn: string;
  }>;
};

export type YkiSpeakingPart = YkiDialoguePart | YkiPromptSetPart;

/**
 * A fill-in plan for the "Do the task" step: the learner writes their own
 * details into the lecture's sentence frames before speaking. Each line is
 * `before` + the learner's words + `after`; an empty `before` makes the whole
 * line free text. Omit it and the step shows the task's help text instead.
 */
export type MissionPlan = {
  title: string;
  intro: string;
  lines: Array<{
    label: string;
    before: string;
    after?: string;
    placeholder: string;
  }>;
};

export type LecturePresentation = {
  /**
   * Selects a visual treatment, not a curriculum structure. A future lecture
   * may use the neutral `standard` renderer, opt into `conversation-first`, or
   * add a new template without changing existing lecture data.
   */
  template?: "standard" | "conversation-first";
  /** Override only the learner-facing labels that this lecture needs. */
  routeSteps?: Partial<
    Record<CoursePart, { label: string; description: string }>
  >;
  /** Optional opening treatment. Dialogue can move without checking a lecture number. */
  opening?: {
    teacherNote?: { title: string; body: string };
    questionIntro?: string;
    dialogue?: {
      part: "recall" | "teach";
      eyebrow?: string;
      title?: string;
      instructions?: string;
      initiallyOpen?: boolean;
    };
  };
  /** Optional teaching-page behaviour; omitted fields use neutral defaults. */
  teaching?: {
    /** Optional task-specific interaction attached to one explicitly named teaching section. */
    builder?: { type: "introduction"; sectionTitle: string };
    /** Optional live practice is explicit per section so future topics never inherit the wrong coach mode. */
    livePractice?: Array<{ sectionTitle: string; mode: "conversation" | "pronunciation" }>;
    wordBank?: { mode: "open" | "collapsed"; title?: string };
    resourceIntro?: { eyebrow: string; title: string; body: string };
  };
  /** Optional custom hero. Future template variants can be added beside this one. */
  hero?: {
    variant: "conversation";
    meta: string[];
    kicker: string;
    title: string;
    lede: string;
    startLine: {
      label: string;
      fi: string;
      en: string;
      audioText?: string;
    };
    speakers: [
      { name: string; fi: string },
      { name: string; fi: string },
    ];
    connector?: string;
    encounterLabel?: string;
    chunks: { label: string; fi: string; en: string }[];
    footerTags?: string[];
  };
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
  /** Optional first-attempt mode for a workshop; defaults to `primarySkill`. */
  firstAttemptSkill?: Skill;
  /** A concrete, visible description of what the learner will produce. */
  expectedOutput: string;
  /** A small changed condition for the second, transferable attempt. */
  transferPrompt: string;
  /** A deliberately short prompt used when this language returns later. */
  returnPrompt: string;
  /** Observable, task-first checks for useful feedback. */
  successChecks: string[];
};
/**
 * Optional hands-on practice attached to one teaching section. Each type is a
 * generic interaction; the lecture JSON supplies every learner-facing string,
 * so a future lecture can reuse a type with its own material or add a new one.
 */
type TeachingActivityBase = {
  /** Beat label in the teaching navigation. Defaults to "Play with it". */
  label?: string;
  title: string;
  instructions: string;
};
export type SoundMapActivity = TeachingActivityBase & {
  type: "sound-map";
  /** Shared properties a learner can highlight across the map, e.g. rounded lips. */
  features?: { id: string; label: string; note: string }[];
  sounds: {
    symbol: string;
    cue: string;
    features?: string[];
    /** A two-part mouth recipe. Sounds with a recipe become quiz items. */
    recipe?: { from: string; to: string };
    words: { fi: string; en: string }[];
  }[];
  /** Short audio contrasts, e.g. I → Y with the tongue kept still. */
  contrasts?: { label: string; audio: string; cue: string }[];
  quizPrompt?: string;
};
export type SortActivity = TeachingActivityBase & {
  type: "sort";
  buckets: { id: string; label: string; hint?: string }[];
  items: {
    fi: string;
    en?: string;
    bucket: string;
    /** Letters to highlight inside `fi`, e.g. the stressed vowel and what follows it. */
    mark?: string;
    why: string;
  }[];
  /** false hides the play buttons, e.g. for cards that show a mistake on purpose. A card with a gap (___) never gets one. */
  audio?: boolean;
  summary?: string;
};
export type MatchActivity = TeachingActivityBase & {
  type: "match";
  leftLabel: string;
  rightLabel: string;
  pairs: { left: string; right: string; note?: string }[];
  /** The pattern revealed once every pair is matched. */
  pattern?: string;
  /** A speakable frame using {left} and {right}, offered for each finished pair. */
  sentence?: string;
};
/**
 * An information gap: facts are hidden on a card and the learner reveals each
 * one by choosing the question that would really get it. Wrong options can
 * test the pronoun, the question word, or the word order.
 */
export type QuestionGapActivity = TeachingActivityBase & {
  type: "question-gap";
  card: { title: string; subtitle?: string };
  /** Registered story character who answers aloud, for example Alex. */
  answerer: string;
  gaps: {
    about: string;
    field: string;
    options: string[];
    answer: string;
    reply: { fi: string; en: string };
    /** Why the correct question works; shown after a wrong choice. */
    why: string;
  }[];
  summary?: string;
};
export type TeachingActivity = SoundMapActivity | SortActivity | MatchActivity | QuestionGapActivity;

export type TeachingSection = {
  title: string;
  /** `rule` = grammar/sound rule (formal card). `scene` = story/context. `register` = usage split. Optional; renderer defaults to `scene`. */
  kind?: "scene" | "rule" | "register";
  body: string[];
  examples: { fi: string; en: string; note?: string }[];
  table?: { headings: string[]; rows: string[][] };
  /** A learner-friendly bridge to the idea. It is a memory cue, not a replacement for the audio model. */
  memoryTip?: string;
  /** One short action completed immediately after the explanation. */
  tryIt?: string;
  /** Optional interactive practice shown as its own beat after the examples. */
  activity?: TeachingActivity;
  /** Several activities, each shown as its own beat, in order. */
  activities?: TeachingActivity[];
};
export type LearningResource = {
  label: string;
  url: string;
  description: string;
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
  /** Explicit, optional selection of a content/yki-mocks.json practice set. */
  ykiMockId?: string;
  /** Scene details belong to this lecture; absent art shows cast portraits. */
  story?: { art?: string; object?: string; cast?: string[] };
  /** Explicit route choice. Future lecture numbers carry no implied format. */
  routeProfile?: LectureRouteProfileId;
  /**
   * Ids from content/grammar-terms.json that this lecture uses. They are
   * underlined in teaching text and explained in plain English beside it.
   */
  grammarTerms?: string[];
  /** Presentation is optional so future lectures do not inherit Lesson 1. */
  presentation?: LecturePresentation;
  /** Lecture-owned steps added to the route, such as textbook page practice. */
  extraSteps?: LectureExtraStep[];
  /** Sentence frames the learner fills in before the "Do the task" attempt. */
  missionPlan?: MissionPlan;
  /**
   * Useful chunks for spaced review, prompted in English and answered aloud
   * in Swedish. They join the learner's review once the teaching step is done.
   */
  reviewPhrases?: Array<{ id: string; en: string; fi: string }>;
  /**
   * Questions the learner has not planned for, asked aloud in the mission's
   * unexpected-questions round. Three are picked each time; `sample` is one
   * possible answer shown afterwards.
   */
  unplannedQuestions?: Array<{ id: string; fi: string; en: string; sample: string }>;
  /**
   * Splits the lecture into two sittings after this stored step. The route
   * marks part 2, suggests stopping after part 1, and opens part 2 with a
   * short recall of the lecture's own phrases.
   */
  sittingBreakAfter?: CoursePart;
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
  resources?: LearningResource[];
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
  story?: {
    title: string;
    setting: string;
    summary: string;
    cast: string[];
    /** Only existing /images/story artwork, or null for cast portraits. */
    art: string | null;
  };
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
