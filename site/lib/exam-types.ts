/**
 * Exam-first course track ("Exam course"): the frozen contract shared by every package.
 *
 * Spec: docs/exam-track-learning-flow.md (section 3.3 = the activity component contract,
 * section 11 = content, state v2, actions and API shapes). Names follow the spec exactly;
 * where the spec gives no TypeScript, the shape here is the decision (see each comment).
 *
 * Content lives in site/content/exam/*.json (generated from ../reports by
 * scripts/build-exam-content.py, then committed; the app never reads ../reports).
 * Progress lives in one JSON document per learner in the SQLite table `exam_state`
 * (lib/exam-db.ts); typed texts and transcripts live in `exam_work`.
 *
 * The v1 shapes of the first slice stay available as `*V1` exports so the v1 to v2
 * migration (normalizeExamState) can read stored rows. This file imports nothing.
 */

/* ================================ shared values ================================ */

/** A day mark: Green, Amber or Red (own honest marks, never an exam result). */
export type ExamGar = "green" | "amber" | "red";
/** One of the four YKI subtests. */
export type ExamSkill = "listening" | "speaking" | "reading" | "writing";
/** Time pressure of an activity: no timer, gentle (first take), moderate (redo), exam (tests and mocks). */
export type ExamPressure = "none" | "gentle" | "moderate" | "exam";
/** Timer factor applied to a target time (0 = no timer); derived from the activity's pressure. */
export type ExamFactor = 0 | 1 | 1.5 | 2;
/** The six blocks of a study day (plan 3.1). */
export type ExamBlock = "review" | "new" | "speaking" | "writing" | "input" | "log";
/** Error types of the error list: grammar groups G1-G7, a wrong word, a missing point, over the time limit. */
export type ExamErrorType = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "word" | "missing-point" | "over-time";
/** Machine verdict on a spoken line (lib/exam-match.ts); "empty" = nothing heard, "none" = no transcription. */
export type ExamVerdict = "match" | "close" | "different" | "empty" | "none";
/** The learner's own rating of a recall or review card: Got it, Slowly, Missed. */
export type ExamRating = "got" | "slow" | "missed";
/** Session length chosen at the start of a run, in minutes. */
export type ExamPlan = 30 | 60 | 90;
/** Where the course starts for this learner: Day 1, or Day 15 after the staged check. */
export type ExamStartKey = "1" | "15";
/** Unit key of a mock day that owns a skill-signal row. */
export type ExamMockKey = "28" | "56" | "84";
/** A stage of the Day 0 staged check. */
export type ExamPlacementStageKey = "1" | "2" | "3" | "4" | "5";
/** A got-of-total pair of counts, e.g. 4 of 5 recalled. */
export type ExamRatio = { got: number; of: number };

/* ============================ units, entries, documents ============================ */

/** One study unit: what the learner does in one sitting (Day 3 is split into 3a and 3b). */
export type ExamUnit = {
  /** Stable key used in progress: "1", "2", "3a", "3b", "4" ... "31", "31b", "34a", "38b" ... "84". */
  key: string;
  /** Display label, e.g. "Day 3a". */
  label: string;
  /** Calendar day number (3 for 3a/3b, 31 for 31 and 31b). */
  day: number;
  title: string;
  /** 1 = Foundations (Days 1-14), 2 = Task moves (15-42), 3 = Topics (43-63), 4 = Full tasks and mocks (64-84). */
  phase: 1 | 2 | 3 | 4;
  /** Kind of day; rest days and mocks are saved without a day mark. */
  kind: "study" | "light" | "rest" | "mock" | "exit-test";
  /** Planned minutes for the day (60 for a normal day). */
  minutes: number;
  /** Key of the curriculum entry that holds the full text for this unit. */
  curriculumKey: string;
  /** True for Days 1-14: a short learner page exists (content/exam/learner.json, key = unit key). */
  hasLearnerPage?: boolean;
};

/** One entry of the 84-day curriculum (the long reference layer, shown in the Full entry drawer). */
export type ExamCurriculumEntry = {
  key: string;
  label: string;
  day: number;
  title: string;
  phase: 1 | 2 | 3 | 4 | null;
  markdown: string;
};

/** One section of a readable document. */
export type ExamDocSection = { id: string; title: string; level: number; layer?: "active" | "recognition" | "reference" | "rules"; markdown: string };
/** A readable document: core sheet, method (the plan), templates, book map, guide, audio list. */
export type ExamDoc = { id: string; title: string; summary: string; sections: ExamDocSection[]; playable?: boolean };

/** The first slice's content bundle (units, entries, documents). */
export type ExamContent = {
  units: ExamUnit[];
  curriculum: ExamCurriculumEntry[];
  docs: ExamDoc[];
};

/** A printed step of a learner page (learner.json). */
export type ExamStep = { id: string; text: string; minutes?: number };
/** A dialogue turn of a learner page (learner.json). */
export type ExamDialogueTurn = { who: "voice" | "you"; sv: string };
/** A dialogue printed on a learner page (learner.json). */
export type ExamDialogue = { id: string; title: string; turns: ExamDialogueTurn[] };

/** The short learner page of Days 1-14 (learner.json, kept for the Full entry drawer). */
export type ExamLearnerPage = {
  /** Page body as Markdown. Swedish is written in *italics*, wrong forms in ~~strikethrough~~. */
  markdown: string;
  steps: ExamStep[];
  /** Cards as the first slice parsed them (v1 shape). */
  cards: ExamCardV1[];
  /** Models, keys and helper lines for this day (the "back of the file"), Markdown. */
  backMarkdown?: string;
  dialogues: ExamDialogue[];
  doneWhen: { green: string; amber: string; red: string };
};

/* ============================ lesson content (11.1) ============================ */

/** A slot inside a line: the part the learner changes, with its printed options. */
export type ExamSlot = { target: string; options: { sv: string; en?: string }[] };
/** One Swedish line of a lesson with its English; `cls` decides how it is drilled (library = heard on tap only). */
export type ExamLine = {
  id: string; sv: string; en: string; notes?: string; slots?: ExamSlot[];
  cls: "pattern" | "known" | "question" | "word" | "number" | "library";
};
/** A wrong form to watch for: never a line, card, chip or audio; shown struck and labelled. */
export type ExamWatch = { wrong: string; right: string; rule?: string; type?: ExamErrorType };
/** A required point of a task, in English; `critical` = without it the message cannot be used. */
export type ExamPoint = { id: string; en: string; critical?: boolean };
/** One turn of a scripted call: the other voice, or a model line for the learner. */
export type ExamTurn = { who: "voice" | "you"; sv: string };
/** Details for a repeat run with new details (run 2 and later), or another source of the same task. */
export type ExamVariant = {
  id: string; label: string; source: "page" | "overlay" | "book" | "ninety" | "appendix" | "self";
  cardSv?: string; cardEn?: string; details?: { label: string; sv?: string; en: string }[];
  turns?: ExamTurn[]; model?: string; bookRef?: string;
};
/** A speaking or writing task from a card; `seen: true` because every prompt in the app is seen practice. */
export type ExamTask = {
  id: string; title: string; skill: "speaking" | "writing";
  cardSv?: string; cardEn?: string; cardCheck?: { options: string[]; answer: number };
  prepSec?: number; speakSec?: number; turnSec?: number; writeMin?: number; wordRange?: [number, number];
  situation?: "phone" | "voicemail" | "friend" | "formal" | "opinion" | "story" | "face" | "react";
  points: ExamPoint[]; turns?: ExamTurn[]; rounds?: { cardSv: string; cardEn?: string }[];
  /** Question mode: the voice asks each question; `modelSv` lets Recall's verdict run. */
  questions?: { sv: string; en: string; modelSv?: string }[];
  model?: string; variants: ExamVariant[]; testId?: string; seen: true;
};
/**
 * One choose item. Listen mode: audio of `sv` once, no text. Read mode: `sv` as text and audio.
 * A rule check is a read item with no `sv`, `prompt` set, and the right and wrong forms as plain
 * options (the wrong form is never played).
 */
export type ExamChoiceItem = { id: string; mode: "listen" | "read"; sv?: string; prompt?: string; options: string[]; answer: number };
/** One swap or ladder item: an English instruction and the finished expected sentence (from content, never built at run time). */
export type ExamSwapItem = { id: string; lineId: string; instruction: string; sv: string };
/** One dictation item: what the voice says, the digits key, and its kind. */
export type ExamDictationItem = { say: string; key: string; kind: "number" | "time" | "date" | "price" | "phone" | "year" };
/** One typed line in lines mode: English cue and the expected Swedish. */
export type ExamTypeLine = { id: string; en: string; sv: string };
/** One part of a mock shell: a timer for a subtest, no prompt. */
export type ExamTimerPart = { id: string; title: string; minutes: number; skill: ExamSkill };

/** Fields every activity has (the spec's `Base`). `counts` marks the counted tasks the mark is computed from. */
export type ExamActivityBase = {
  id: string; step: string; block: ExamBlock; title: string; minutes?: number; pressure: ExamPressure;
  counts?: boolean; optional?: boolean; only90?: boolean; note?: string; derived?: boolean;
};
/**
 * One activity of a lesson (spec 11.1). One union member per `type`, so that
 * `ExamActivityOf<"hear">` resolves; `type` has two members (lines and message mode).
 */
export type ExamActivity = ExamActivityBase & (
  | { type: "review" }
  | { type: "cards" }
  | { type: "errors" }
  | { type: "log" }
  | { type: "drill" }
  | { type: "read"; markdown: string }
  | { type: "hear"; lineIds: string[] }
  | { type: "imitate"; lineIds: string[] }
  | { type: "recall"; lineIds: string[] }
  | { type: "choose"; items: ExamChoiceItem[] }
  | { type: "swap"; items: ExamSwapItem[] }
  | { type: "respond"; task: ExamTask }
  | { type: "dialogue"; task: ExamTask }
  | { type: "type"; mode: "lines"; items: ExamTypeLine[] }
  | { type: "type"; mode: "message"; task: ExamTask }
  | { type: "dictation"; items: ExamDictationItem[]; generate?: { kinds: ExamDictationItem["kind"][]; count: number } }
  | { type: "outside"; routine: "listening" | "reading" | "notice-hunt" | "book"; markdown: string; bookRef?: string }
  | { type: "timer"; parts: ExamTimerPart[] }
);
/** The name of an activity type. */
export type ExamActivityType = ExamActivity["type"];
/** The activity members of one type, e.g. `ExamActivityOf<"recall">`. */
export type ExamActivityOf<T extends ExamActivityType> = Extract<ExamActivity, { type: T }>;
/** An activity that carries a task card (respond, dialogue, typed message). */
export type ExamTaskActivity = Extract<ExamActivity, { task: ExamTask }>;
/** An activity that works on lesson lines (hear, imitate, recall). */
export type ExamLineActivity = Extract<ExamActivity, { lineIds: string[] }>;

/** A step of a lesson: a printed step or minute block, 5 to 9 a day. */
export type ExamStepDef = { id: string; title: string; block: ExamBlock; minutes: number; minutes90?: number };
/** A content card made by a unit (v2); a `pick` card is chosen or typed by the learner at the Cards step. */
export type ExamCard = {
  id: string; unitKey: string; kind: "say" | "listen" | "word" | "number" | "pick";
  items: { front: string; back: string; lineId?: string }[]; pool?: string[];
};
/** One unit's lesson (lessons.json, key = unit key): steps, activities, lines, cards, rule, watch list, marks. */
export type ExamLesson = {
  key: string; source: "page" | "entry";
  steps: ExamStepDef[]; activities: ExamActivity[]; lines: ExamLine[]; cards: ExamCard[]; cardCap: number;
  rule?: { text: string; pairs: { right: string; wrong: string }[] }; watch: ExamWatch[];
  doneWhen: { green: string; amber: string; red: string; redHere?: string[] };
  tests?: { id: string; title: string; behind: string[] }[];
  /** How many rule-9 fallback blocks this lesson uses (each listed in exceptions.json). */
  fallbacks: number;
};
/** lessons.json: unit key to lesson. */
export type ExamLessons = Record<string, ExamLesson>;

/** placement.json: the Day 0 staged check, five stages of `stageMinutes` (spec 2.2, plan 4.1 Part 1). */
export type ExamPlacement = {
  stageMinutes: number;
  /** The plan's Green, Amber and Red descriptions per stage (English). */
  marks: Record<ExamPlacementStageKey, { green: string; amber: string; red: string }>;
  /** Stage 1: spoken questions, listen mode, 4 English options each. */
  understand: ExamChoiceItem[];
  /** Stage 2: word chips in the printed mixed order, and the sentence key. */
  build: { id: string; chips: string[]; key: string }[];
  /** Stage 3: one English instruction per sentence; `accept` lists every printed key. */
  change: { id: string; base: string; instruction: string; accept: string[] }[];
  /** Stage 4: the speaking card (self-marked). */
  speak: ExamTask;
  /** Stage 5: the typed message card with its points (self-marked). */
  write: ExamTask;
  /** Unit keys to watch after stages 4 and 5 (speaking, typing). */
  watch: { speaking: string[]; typing: string[] };
};
/** One appendix practice prompt (prompts.json, seen practice), by function letter A, B, C ... */
export type ExamPrompt = {
  id: string; fn: string; fnTitle: string; skill: "speaking" | "writing"; role?: string;
  cardSv: string; cardEn?: string;
  /** The function's default points followed by the prompt's extra points (English). */
  points: ExamPoint[];
};
/** prompts.json: prompt id to prompt. */
export type ExamPrompts = Record<string, ExamPrompt>;
/** One outside-material link (links.json, checked by hand). */
export type ExamLink = { id: string; title: string; url: string; routine: "listening" | "reading" | "notice-hunt"; note?: string; checkedOn: string };

/* ======================= activity component contract (3.3) ======================= */

/** Who speaks a Swedish line (Azure sv-SE voices; Elin = the learner's lines, Henrik = the other voice). */
export type ExamSpeaker = "Elin" | "Maja" | "Henrik" | "Alex";
/** One request to /api/speech: a single line or a sequence of segments; `slow` = the slow variant. */
export type ExamSpeechRequest =
  | { text: string; speaker?: ExamSpeaker; slow?: boolean }
  | { segments: { text: string; speaker: ExamSpeaker }[]; slow?: boolean };
/** Play state of the shared player. */
export type ExamSpeechState = "idle" | "loading" | "playing";
/** Snapshot of the shared player: which key is loading or playing, and its last error. */
export type ExamSpeechSnapshot = { key: string | null; state: ExamSpeechState; error: string };
/** How one play ended; `httpStatus` 502/503 means no voice (store `noAudio`), 429 means too many requests. */
export type ExamPlayOutcome = { status: "ended" | "stopped" | "failed"; error?: string; httpStatus?: number };
/** The client speech store (speech.ts): one clip at a time, the last 80 clips kept in memory. */
export type SpeechApi = {
  /** Plays a clip (playing the same key again stops it); resolves when it ends, is stopped or fails. */
  play: (key: string, request: ExamSpeechRequest) => Promise<ExamPlayOutcome>;
  stop: () => void;
  /** For useSyncExternalStore. */
  subscribe: (listener: () => void) => () => void;
  snapshot: () => ExamSpeechSnapshot;
};

/** One finished take: audio blob, length, an object URL for playback and download, its MIME type. */
export type ExamRecording = { blob: Blob; seconds: number; url: string; mimeType: string };
/** Recorder state; "blocked" = microphone refused, "unsupported" = no MediaRecorder (say-and-self-check). */
export type ExamRecorderState = "idle" | "starting" | "recording" | "blocked" | "unsupported";
/** Snapshot of the recorder: state, seconds recorded so far, last error. */
export type ExamRecorderSnapshot = { state: ExamRecorderState; seconds: number; error: string };
/** The recorder (useRecorder.ts): audio/webm, else audio/mp4; frees the microphone on stop and unmount. */
export type RecorderApi = {
  /** Starts a take; resolves when it ends (stop(), `maxSec` reached) or with null on failure (see snapshot().error). */
  start: (maxSec: number) => Promise<ExamRecording | null>;
  stop: () => void;
  subscribe: (listener: () => void) => () => void;
  snapshot: () => ExamRecorderSnapshot;
};

/** Result of one transcription; "empty" = no speech (422), "none" = not configured or failed after the retry. */
export type ExamTranscript = { status: "ok" | "empty" | "none"; text: string; message?: string };
/** One scored word from /api/pronunciation. */
export type ExamScoredWord = { word: string; accuracy: number | null; error: string };
/** Result of one pronunciation score (display only, never a mark). */
export type ExamScore = { status: "ok" | "empty" | "none"; pron?: number; heard?: string; words: ExamScoredWord[]; message?: string };
/** Snapshot of the queue: jobs waiting or running, and whether it is held by the rate limit. */
export type ExamQueueSnapshot = { pending: number; waiting: boolean };
/** The client evidence queue (evidenceQueue.ts): serial, at most 10 calls in 60 s, one retry after a 429. */
export type EvidenceQueue = {
  /** /api/transcribe for any recording except Imitate. Never rejects. */
  transcribe: (audio: Blob) => Promise<ExamTranscript>;
  /** /api/pronunciation for Imitate: 16 kHz mono WAV (toWav16k) and the reference text. Never rejects. */
  score: (wav16k: Blob, reference: string) => Promise<ExamScore>;
  subscribe: (listener: () => void) => () => void;
  snapshot: () => ExamQueueSnapshot;
};

/** The services the shell gives every activity; activities must work with all three `can*` flags false. */
export type ExamServices = {
  speech: SpeechApi; recorder: RecorderApi; evidence: EvidenceQueue;
  canSpeak: boolean; canTranscribe: boolean; canScore: boolean;
};
/** Props of every activity component. An activity never draws its own Next button: it calls `record(result, true)`. */
export type ActivityProps<A extends ExamActivity = ExamActivity> = {
  unit: ExamUnit; lesson: ExamLesson; activity: A; run: ExamRun;
  /** 0 = first time; 1+ = repeat with new details. */
  variant: number;
  /** Timer factor from activity.pressure (0 = no timer). */
  factor: ExamFactor;
  /** Saves evidence; resolves "" or an error message. */
  record: (result: ExamResult, done: boolean) => Promise<string>;
  services: ExamServices;
};

/* ================================ state v2 (11.2) ================================ */

/** Evidence from one activity attempt; never a gate (pronunciation, words and seconds are targets only). */
export type ExamResult = {
  ok?: number; of?: number; verdict?: ExamVerdict;
  self?: ExamRating; override?: boolean; understood?: "yes" | "partly" | "no";
  english?: boolean; modelFirst?: boolean; points?: string[]; pointsOf?: number; seconds?: number; limit?: number;
  replays?: number; words?: number; pron?: number; kinds?: string[]; watch?: string[];
  /** At most 160 characters of the transcript or text. */
  excerpt?: string;
};
/** Evidence of one activity in a run: `first` is written once, `last` is the latest try. */
export type ExamEvidence = { first: ExamResult; last?: ExamResult; tries: number; at: number };
/** One run of a unit (run n; variant 0 = first time, 1+ = repeat with new details). */
export type ExamRun = {
  n: number; variant: number; plan: ExamPlan; startedDay: string; startedAt: number;
  activeSec: number; stepSec: Record<string, number>; done: string[]; skipped: string[]; evidence: Record<string, ExamEvidence>;
  /** Event ids already applied (the last 200; cleared by logDay). */
  events: string[]; cardsConfirmed?: boolean; noAudio?: boolean; log?: ExamDayLog;
  /** An unlogged practice run (the "Welcome back" re-recording): never logged, never blocks startRun. [P0 addition] */
  practice?: boolean;
};
/** The mark of one exit test; `misread` = the card or a task word was misunderstood; `teacher` = rated with a teacher (not provisional). */
export type ExamTestMark = { gar: ExamGar; misread?: boolean; teacher?: boolean };
/** The v2 day log: the v1 fields plus the run, the suggested mark and its reasons, and edit marks. */
export type ExamDayLog = ExamDayLogV1 & {
  run: number; suggested?: ExamGar; reasons?: string[];
  clockMinutes?: number; tests?: Record<string, ExamTestMark>;
  tooMuchDay?: boolean;
  /** Names of the fields changed by editLog. */
  edited?: string[]; editedAt?: number;
  /** Rest day or mock saved without a mark; `gar` is then "green" for v1 readers and is not counted. [P0 decision] */
  noMark?: boolean;
};
/** Review state of one card (content, error or own card); dates are Helsinki day strings "YYYY-MM-DD". */
export type ExamCardState = {
  kind: "say" | "listen" | "word" | "number" | "error" | "own";
  /** Text of cards not in content: own cards, error cards and pick cards. */
  custom?: { front: string; back: string; unitKey?: string; errorId?: string };
  addedDay: string; rung: number; dueDay: string; lapses: number; reviews: number; lastDay?: string; lastEventId?: string;
};
/** One entry of the error list. */
export type ExamError = {
  id: string; text: string; right?: string; type?: ExamErrorType; unitKey?: string;
  activityId?: string; createdAt: number; seen: number; seenDays: string[]; cardId?: string; resolvedAt?: number;
};
/** Learner settings. */
export type ExamSettings = { plan: ExamPlan; voiceCheck: boolean; aiPoints: boolean };
/** Saved result of the Day 0 staged check. */
export type ExamPlacementResult = { stages: Partial<Record<ExamPlacementStageKey, ExamGar>>; day: string };
/** One mock's early skill-signal row; it decides nothing. */
export type ExamSignalRow = Partial<Record<ExamSkill, ExamGar>> & { mistakes?: string };
/** The whole stored progress of one learner (v2). */
export type ExamState = {
  version: 2;
  /** Raised by every action. */
  rev: number;
  seenWelcome?: boolean; startKey: ExamStartKey;
  settings: ExamSettings;
  placement?: ExamPlacementResult;
  /** Runs per unit key, oldest first. */
  runs: Record<string, ExamRun[]>;
  /** The log of the latest logged run (v1 readers keep working). */
  days: Record<string, ExamDayLog>;
  /** v1 only; read during migration. */
  steps: Record<string, string[]>;
  cards: Record<string, ExamCardState>;
  /** Content card ids displaced by the daily limit; they head tomorrow's list. */
  waiting: string[];
  /** Review seconds per learning day; the last 14 days are kept. */
  reviewSec: Record<string, number>;
  /** Seconds of the one-time "5 more minutes" per learning day, outside the 8-minute stop. [P0 addition] */
  reviewExtraSec?: Record<string, number>;
  /** Due cards left after the stop per learning day, for the 3-days-running pile-up rule. [P0 addition] */
  reviewLeft?: Record<string, number>;
  errors: ExamError[];
  /** Mock unit key to its signal row. */
  signals: Record<string, ExamSignalRow>;
  /** Appendix prompt ids already used for redos. */
  usedPrompts: string[];
  updatedAt: number;
};

/* ================================== actions ================================== */

/** What the learner sends with logDay (the server sets date, loggedAt and run). */
export type ExamDayLogInput = Omit<ExamDayLog, "date" | "loggedAt" | "run" | "edited" | "editedAt"> & { date?: string };
/** What editLog may change: the mark, minutes, note and pilot fields. */
export type ExamLogPatch = Partial<Pick<ExamDayLog, "gar" | "minutes" | "note" | "newPatterns" | "recalled" | "understood" | "changed" | "typed" | "tooMuch" | "tooMuchDay">>;
/** A filled pick slot at the Cards step: the item the learner chose from the pool or typed. [P0 decision] */
export type ExamCardPick = { front: string; back: string; kind: "say" | "number" };

/**
 * Every v2 action (spec 11.2). Actions with `eventId` are ignored when repeated. Field names that
 * would clash with the discriminant `type` are renamed `errorType`. `tickStep` and `resetDay` are
 * the v1 actions the server still accepts. `reviewCard.extra` marks the one-time 5 more minutes;
 * `setSignal` is the v1 form, or `mistakes` alone.
 */
export type ExamAction =
  | { type: "setSettings"; settings: Partial<ExamSettings> }
  | { type: "seeWelcome" }
  | { type: "savePlacement"; stages: Partial<Record<ExamPlacementStageKey, ExamGar>> }
  | { type: "setStart"; startKey: ExamStartKey }
  | { type: "startRun"; unitKey: string; n: number; variant: number; plan: ExamPlan; practice?: boolean }
  | { type: "recordEvidence"; eventId: string; unitKey: string; n: number; activityId: string; result: ExamResult; done: boolean; activeSec: number }
  | { type: "skipActivity"; eventId: string; unitKey: string; n: number; activityId: string }
  | { type: "confirmCards"; eventId: string; unitKey: string; n: number; cardIds: string[]; picks: Record<string, ExamCardPick>; errorIds: string[] }
  | { type: "reviewCard"; eventId: string; cardId: string; rating: ExamRating; verdict?: ExamVerdict; sec: number; practice?: boolean; extra?: boolean }
  | { type: "logDay"; unitKey: string; n?: number; log: ExamDayLogInput }
  | { type: "editLog"; unitKey: string; n: number; patch: ExamLogPatch }
  | { type: "addError"; id: string; text: string; right?: string; errorType?: ExamErrorType; unitKey?: string; activityId?: string }
  | { type: "seeError"; eventId: string; id: string }
  | { type: "setErrorType"; id: string; errorType: ExamErrorType | null }
  | { type: "resolveError"; id: string; resolved: boolean }
  | { type: "deleteError"; id: string }
  | { type: "errorToCard"; id: string }
  | { type: "addCard"; id: string; front: string; back: string; unitKey?: string }
  | { type: "deleteCard"; id: string }
  | { type: "usePrompt"; id: string }
  | { type: "setSignal"; mock: ExamMockKey; skill: ExamSkill; gar: ExamGar | null; mistakes?: string }
  | { type: "setSignal"; mock: ExamMockKey; mistakes: string }
  | { type: "tickStep"; unitKey: string; stepId: string; done: boolean }
  | { type: "resetDay"; unitKey: string };
/** The name of an action. */
export type ExamActionType = ExamAction["type"];
/** One action of a given name. */
export type ExamActionOf<T extends ExamActionType> = Extract<ExamAction, { type: T }>;
/** What POST /api/exam accepts: a v2 action, or a v1 one (v1 ratings, reviewCard without `sec`). */
export type ExamIncomingAction = ExamAction | ExamActionV1;

/* ============================== selector results ============================== */

/** The home screen's one primary card (nextThing), in priority order. [P0 decision on the shape] */
export type ExamNextThing =
  | { kind: "continue"; unitKey: string; n: number }
  | { kind: "repeat"; unitKey: string; variant: number }
  | { kind: "pinned"; unitKey: string; testId: string; studyDaysLeft: number }
  | { kind: "next"; unitKey: string }
  | { kind: "finished" };
/** One card in today's review queue (dueCards); group 1 = yesterday's new cards, 2 = missed last time, 3 = other due. */
export type ExamQueueItem = { cardId: string; group: 1 | 2 | 3; dueDay: string };
/** The suggested mark of a run (suggestMark, lib/exam-mark.ts) with one English reason per trigger. */
export type ExamMarkSuggestion = { gar: ExamGar; reasons: string[] };
/** The phase-exit result (phaseExit) for the tests of Day 14, Days 41-42 or Days 62-63. */
export type ExamPhaseExit = {
  phase: 1 | 2 | 3;
  status: "open" | "passed" | "passed-with-red" | "not-passed";
  /** True while no teacher has rated the tests. */
  provisional: boolean;
  /** Test ids marked Red and not misread. */
  reds: string[];
  /** Unit keys behind the Red tests, to do next when not passed. */
  behind: string[];
};
/** One computed pilot cell; `overrides` = items the learner rated against the machine, `edited` = changed by hand. */
export type ExamPilotCell = ExamRatio & { overrides?: number; edited?: boolean };
/** One pilot row (pilotRows) for a unit of Days 1-7 and one run. */
export type ExamPilotRow = {
  unitKey: string; run: number;
  minutes?: number; newPatterns?: number;
  recalled?: ExamPilotCell; understood?: ExamPilotCell; changed?: ExamPilotCell; typed?: ExamPilotCell;
  gar?: ExamGar; tooMuch?: string; tooMuchDay?: boolean;
  /** Seconds used per step against the printed minutes (budgetSec) and the build estimate. */
  steps: { stepId: string; title: string; sec: number; budgetSec: number; estimateSec?: number }[];
};
/** One pilot rule of "How to read the result". */
export type ExamPilotRule = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
/** One advice card (pilotAdvice); rule null = "the log gives no rule for this result". */
export type ExamPilotAdvice = {
  rule: ExamPilotRule | null; message: string;
  /** The numbers the rule used, as one English line. */
  numbers: string;
  /** Rule 5: the lines missed in recall but understood when spoken. */
  lines?: string[];
  /** Rules 8 and 9: repeat this unit with new details under the new label (e.g. 3b as 3c). */
  split?: { unitKey: string; label: string };
};

/* ================================ API shapes (11.3) ================================ */

/** Error body of every exam route. */
export type ExamApiError = { error: string; code?: string };
/** POST /api/exam: body is an ExamIncomingAction (at most 24,000 characters); reply is the whole new state. */
export type ExamActionResponse = ExamState;

/** `kind` values of GET /api/exam/content. */
export type ExamContentKind = "units" | "cards" | "learner" | "entry" | "docs" | "doc" | "lesson" | "placement" | "prompt";
/** A document without section bodies (kind=docs). */
export type ExamDocSummary = Pick<ExamDoc, "id" | "title" | "summary"> & { playable: boolean; sections: Omit<ExamDocSection, "markdown">[] };
/** One document (kind=doc&key=) or one of its sections (&section=). */
export type ExamDocResponse = { id: string; title: string; playable: boolean } & ({ sections: ExamDocSection[] } | { section: ExamDocSection });
/** Reply of GET /api/exam/content per kind (lesson and learner by `key`, prompt by `id`). */
export type ExamContentResponses = {
  units: ExamUnit[];
  cards: ExamCard[];
  learner: ExamLearnerPage;
  entry: ExamCurriculumEntry;
  docs: ExamDocSummary[];
  doc: ExamDocResponse;
  lesson: ExamLesson;
  placement: ExamPlacement;
  prompt: ExamPrompt;
};

/** What a saved work item holds: a typed text, a transcript, or a drill. [P0 decision on the values] */
export type ExamWorkKind = "text" | "transcript" | "drill";
/** POST /api/exam/work body (same origin; `body` at most 6,000 characters). */
export type ExamWorkInput = { id: string; unitKey: string; run: number; activityId: string; kind: ExamWorkKind; body: string };
/** One row of the exam_work table as the API returns it (POST reply, GET list newest first). */
export type ExamWorkItem = ExamWorkInput & { createdAt: number };
/** GET /api/exam/work query. */
export type ExamWorkQuery = { unitKey?: string; kind?: ExamWorkKind; limit?: number };

/** POST /api/exam/points body; the server takes the points from content and treats `text` as data. */
export type ExamPointsRequest = { unitKey: string; activityId: string; variant: number; text: string };
/** One AI finding for a point: a suggestion only, the learner's ticks decide. */
export type ExamPointFinding = { id: string; found: boolean; quote: string };
/** POST /api/exam/points reply (503 when no model is configured). */
export type ExamPointsResponse = { points: ExamPointFinding[] };

/* ============================ legacy v1 (migration only) ============================ */

/** v1 review rating (lecture scheduler); maps to v2 by EXAM_RATING_FROM_V1. */
export type ExamRatingV1 = "again" | "hard" | "good" | "easy";
/** v1 content card: English front, Swedish back; reads as a v2 `say` card with one item. */
export type ExamCardV1 = { id: string; front: string; back: string };
/** v1 day log; the v2 log extends it. */
export type ExamDayLogV1 = {
  gar: ExamGar;
  /** Actual minutes studied (the pilot log asks for the true number). */
  minutes: number;
  /** Local learning day, YYYY-MM-DD (Europe/Helsinki). */
  date: string;
  loggedAt: number;
  note?: string;
  /** Pilot log fields (Days 1-7), all optional. */
  newPatterns?: number;
  recalled?: ExamRatio;
  understood?: ExamRatio;
  changed?: ExamRatio;
  typed?: ExamRatio;
  tooMuch?: string;
};
/** v1 error entry. */
export type ExamErrorV1 = { id: string; text: string; right?: string; unitKey?: string; createdAt: number; resolvedAt?: number };
/** v1 card review state (interval scheduler). */
export type ExamCardStateV1 = {
  /** Present only for learner-added cards; content cards are looked up by id. */
  custom?: { front: string; back: string; unitKey?: string };
  interval: number;
  ease: number;
  due: number;
  repetitions: number;
  lastEventId?: string;
};
/** v1 stored progress. */
export type ExamStateV1 = {
  version: 1;
  /** Ticked step ids per unit key (progress inside a day). */
  steps: Record<string, string[]>;
  /** Finished days. A unit counts as done when logged green or amber; red means repeat. */
  days: Record<string, ExamDayLogV1>;
  errors: ExamErrorV1[];
  /** Review state of content cards (by card id) and learner-added cards. */
  cards: Record<string, ExamCardStateV1>;
  /** Early skill signal at Mocks 1-3 (days 28, 56, 84). Decides nothing. */
  signals: Record<string, Partial<Record<ExamSkill, ExamGar>>>;
  updatedAt: number;
};
/** v1 actions. */
export type ExamActionV1 =
  | { type: "tickStep"; unitKey: string; stepId: string; done: boolean }
  | { type: "logDay"; unitKey: string; log: Omit<ExamDayLogV1, "loggedAt" | "date"> & { date?: string } }
  | { type: "resetDay"; unitKey: string }
  | { type: "addError"; id: string; text: string; right?: string; unitKey?: string }
  | { type: "resolveError"; id: string; resolved: boolean }
  | { type: "deleteError"; id: string }
  | { type: "addCard"; id: string; front: string; back: string; unitKey?: string }
  | { type: "deleteCard"; id: string }
  | { type: "reviewCard"; cardId: string; rating: ExamRatingV1; eventId: string }
  | { type: "setSignal"; mock: ExamMockKey; skill: ExamSkill; gar: ExamGar | null };

/* ============================ constants and type guards ============================ */

export const EXAM_GARS: readonly ExamGar[] = ["green", "amber", "red"];
export const EXAM_SKILLS: readonly ExamSkill[] = ["listening", "speaking", "reading", "writing"];
export const EXAM_PRESSURES: readonly ExamPressure[] = ["none", "gentle", "moderate", "exam"];
export const EXAM_BLOCKS: readonly ExamBlock[] = ["review", "new", "speaking", "writing", "input", "log"];
export const EXAM_ERROR_TYPES: readonly ExamErrorType[] = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "word", "missing-point", "over-time"];
export const EXAM_VERDICTS: readonly ExamVerdict[] = ["match", "close", "different", "empty", "none"];
export const EXAM_RATINGS: readonly ExamRating[] = ["got", "slow", "missed"];
export const EXAM_PLANS: readonly ExamPlan[] = [60, 90, 30];
export const EXAM_MOCKS: readonly ExamMockKey[] = ["28", "56", "84"];
export const EXAM_PLACEMENT_STAGES: readonly ExamPlacementStageKey[] = ["1", "2", "3", "4", "5"];
export const EXAM_WORK_KINDS: readonly ExamWorkKind[] = ["text", "transcript", "drill"];

/** v1 ratings in v2 terms: good and easy = Got it, hard = Slowly, again = Missed. */
export const EXAM_RATING_FROM_V1: Readonly<Record<ExamRatingV1, ExamRating>> = { good: "got", easy: "got", hard: "slow", again: "missed" };

/** Timer factor per pressure: gentle = twice the target (spec 4.4); moderate 1.5 and exam 1 are inferred. */
export const EXAM_PRESSURE_FACTOR: Readonly<Record<ExamPressure, ExamFactor>> = { none: 0, gentle: 2, moderate: 1.5, exam: 1 };

/** Every activity type (the registry must map each one). */
const ACTIVITY_TYPES: Record<ExamActivityType, true> = {
  review: true, read: true, hear: true, choose: true, imitate: true, recall: true, swap: true, respond: true,
  dialogue: true, type: true, dictation: true, outside: true, drill: true, cards: true, errors: true, log: true, timer: true,
};
export const EXAM_ACTIVITY_TYPES = Object.keys(ACTIVITY_TYPES) as ExamActivityType[];

/** Every action name, and whether it carries an eventId (the spec's * actions). */
export const EXAM_ACTION_EVENT_ID: Readonly<Record<ExamActionType, boolean>> = {
  setSettings: false, seeWelcome: false, savePlacement: false, setStart: false, startRun: false,
  recordEvidence: true, skipActivity: true, confirmCards: true, reviewCard: true, logDay: false, editLog: false,
  addError: false, seeError: true, setErrorType: false, resolveError: false, deleteError: false, errorToCard: false,
  addCard: false, deleteCard: false, usePrompt: false, setSignal: false, tickStep: false, resetDay: false,
};
export const EXAM_ACTION_TYPES = Object.keys(EXAM_ACTION_EVENT_ID) as ExamActionType[];

/** Seconds per item the generator uses to estimate a step (spec 3.2), plus EXAM_SECONDS_PER_ACTIVITY per activity. */
export const EXAM_SECONDS_PER_ITEM = { hear: 20, imitate: 15, recall: 20, swap: 20, choose: 8, ruleCheck: 20, dictation: 20 } as const;
export const EXAM_SECONDS_PER_ACTIVITY = 10;

/** The numeric limits of the spec, in one place. */
export const EXAM_CAPS = {
  /** Load rule 1: new patterns per day. */
  newPatternsPerDay: 6,
  /** New cards per learning day, error cards included. */
  newCardsPerDay: 8,
  errorCardsPerDay: 3,
  /** Review stops at 8 minutes of active time per learning day. */
  reviewSecPerDay: 480,
  /** The one "5 more minutes" outside the 60 minutes, from the Exam cards view. */
  reviewExtraSec: 300,
  reviewSecPerCard: 120,
  reviewDaysKept: 14,
  runsPerUnit: 9,
  evidencePerRun: 80,
  activeSecPerEvent: 900,
  eventsPerRun: 200,
  errors: 500,
  /** Error texts, card texts and signal mistakes. */
  text: 300,
  excerpt: 160,
  workBody: 6000,
  actionBody: 24000,
  /** Redos with a change per task. */
  redos: 2,
  /** Client evidence queue: calls in any 60 seconds. */
  evidenceCallsPerMinute: 10,
  /** Client speech store: clips kept in memory. */
  speechClips: 80,
  /** Pile-up: more than 20 due cards left after the stop, on 3 days running. */
  pileUpDue: 20,
  pileUpDays: 3,
  /** "Welcome back" after this many days away. */
  awayDays: 7,
  /** An exit-test redo stays pinned for this many study days. */
  pinnedStudyDays: 3,
  /** Recurring error type: seen this many times in the last recurringWindowDays days. */
  recurringSeen: 3,
  recurringWindowDays: 7,
} as const;

/** Kept from v1. */
export const EXAM_MAX_NEW_CARDS_PER_DAY = EXAM_CAPS.newCardsPerDay;
/** Kept from v1. */
export const EXAM_MAX_NEW_PATTERNS_PER_DAY = EXAM_CAPS.newPatternsPerDay;

const member = <T extends string | number>(list: readonly T[]) => (value: unknown): value is T => list.includes(value as T);

/** Is this a Green/Amber/Red value? */
export const isExamGar = member(EXAM_GARS);
/** Is this a subtest name? */
export const isExamSkill = member(EXAM_SKILLS);
/** Is this a pressure value? */
export const isExamPressure = member(EXAM_PRESSURES);
/** Is this an error type? */
export const isExamErrorType = member(EXAM_ERROR_TYPES);
/** Is this a v2 rating? */
export const isExamRating = member(EXAM_RATINGS);
/** Is this a session length? */
export const isExamPlan = member(EXAM_PLANS);
/** Is this a mock unit key? */
export const isExamMockKey = member(EXAM_MOCKS);
/** Is this a work kind? */
export const isExamWorkKind = member(EXAM_WORK_KINDS);
/** Is this a v1 rating? */
export const isExamRatingV1 = (value: unknown): value is ExamRatingV1 => typeof value === "string" && Object.hasOwn(EXAM_RATING_FROM_V1, value);
/** Is this a known action name (v1 names are a subset)? */
export const isExamActionType = (value: unknown): value is ExamActionType => typeof value === "string" && Object.hasOwn(EXAM_ACTION_EVENT_ID, value);
/** Is this a known activity type? */
export const isExamActivityType = (value: unknown): value is ExamActivityType => typeof value === "string" && Object.hasOwn(ACTIVITY_TYPES, value);

/** Narrows an activity to one type. */
export function isActivityType<T extends ExamActivityType>(activity: ExamActivity, type: T): activity is ExamActivityOf<T> {
  return activity.type === type;
}
/** Does this activity carry a task card (respond, dialogue, typed message)? */
export function isTaskActivity(activity: ExamActivity): activity is ExamTaskActivity {
  return "task" in activity;
}
/** Does this activity work on lesson lines (hear, imitate, recall)? */
export function isLineActivity(activity: ExamActivity): activity is ExamLineActivity {
  return "lineIds" in activity;
}
/** Is this a counted task (the speaking task, the typed task, each exit test)? */
export function isCountedActivity(activity: ExamActivity): boolean {
  return activity.counts === true;
}
/** The timer factor of an activity. */
export function pressureFactor(pressure: ExamPressure): ExamFactor {
  return EXAM_PRESSURE_FACTOR[pressure];
}

/** Stored JSON that says it is v2 (shape not checked; normalizeExamState does that). */
export function isExamStateV2(raw: unknown): raw is { version: 2 } {
  return !!raw && typeof raw === "object" && !Array.isArray(raw) && (raw as { version?: unknown }).version === 2;
}
/** Stored JSON from the first slice: an object with version 1, or with no version at all. */
export function isExamStateV1(raw: unknown): raw is Partial<ExamStateV1> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const version = (raw as { version?: unknown }).version;
  return version === 1 || version === undefined;
}
