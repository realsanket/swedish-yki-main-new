/**
 * Hand-built guided lessons for Day 1 and Day 2 of the Exam course.
 * Every Swedish line is taken from reports/YKI-LEARNER-DAYS-1-14.md (pages and back-of-file keys).
 * [Unreviewed Swedish: have a teacher check it]
 */

export type Part = { sv: string; en: string };

/** A sentence shape the learner must say from memory. `{}` marks the changeable slot. */
export type GPattern = {
  id: string; // matches the generated card id (d1-p1 ...)
  template: string;
  en: string; // English with {} for the slot
  slot?: { value: string; en: string; label: string };
  swaps?: Part[];
  words: Part[];
  note?: string;
};

export type GQuestion = { sv: string; en: string; answer: string };
export type GCard = { id: string; front: string; back: string; own?: boolean };

export type GStepKind = "hear" | "recall" | "questions" | "speak" | "typelines" | "wants" | "makeq" | "conversation" | "typemsg" | "dictation" | "cards";

export type GStep = {
  id: string; // s1, s2 ... (tickStep ids)
  title: string;
  minutes: number;
  kind: GStepKind;
  intro: string;
};

export type GuidedDay = {
  key: string;
  title: string;
  goal: string;
  patterns: GPattern[];
  understand: GQuestion[];
  words: Part[];
  rule: { text: string; wrong: string; right: string };
  steps: GStep[];
  cards: GCard[];
  /** Typed from the English cue, one sentence at a time. */
  typeLines: { en: string; sv: string }[];
  /** Spoken task prompts. */
  speakTasks: { id: string; prompt: string; en: string; points: string[]; model: string }[];
  /** Day 2 only */
  wants?: { q: string; wants: string }[];
  makeQ?: { answer: string; question: string }[];
  numbers?: { words: Part[]; dictation: { say: string; key: number }[] };
  conversation?: { voice: string; model: string; addAndYou?: boolean }[];
  message?: { prompt: string; en: string; points: { label: string; test: string }[]; model: string };
  doneWhen: { green: string; amber: string; red: string };
  tomorrow: string;
};

const GENERIC_AMBER = "You got there, but slowly, or one mistake kept coming back: write it in your error list and go on.";
const GENERIC_RED = "You misunderstood the card, could not answer, or needed to read the model: do this day again tomorrow with new details.";

const q1: GQuestion[] = [
  { sv: "Vad heter du?", en: "What's your name?", answer: "Jag heter Alex." },
  { sv: "Var kommer du ifrån?", en: "Where are you from?", answer: "Jag kommer från Indien." },
  { sv: "Var bor du?", en: "Where do you live?", answer: "Jag bor i Esbo." },
  { sv: "Vilka språk talar du?", en: "Which languages do you speak?", answer: "Jag talar engelska, hindi och marathi." },
];

export const DAY1: GuidedDay = {
  key: "1",
  title: "Say who you are",
  goal: "Understand four questions and answer each in one full sentence.",
  patterns: [
    { id: "d1-p1", template: "Jag heter {}.", en: "My name is {}.", slot: { value: "Alex", en: "Alex", label: "your name" }, swaps: [{ sv: "Sara", en: "Sara" }], words: [{ sv: "jag", en: "I" }, { sv: "heter", en: "am called" }] },
    { id: "d1-p2", template: "Jag kommer från {}.", en: "I come from {}.", slot: { value: "Indien", en: "India", label: "your country" }, swaps: [{ sv: "Sverige", en: "Sweden" }, { sv: "Nepal", en: "Nepal" }], words: [{ sv: "kommer", en: "come" }, { sv: "från", en: "from" }] },
    { id: "d1-p3", template: "Jag bor i {}.", en: "I live in {}.", slot: { value: "Esbo", en: "Espoo", label: "your town" }, swaps: [{ sv: "Helsingfors", en: "Helsinki" }, { sv: "Vanda", en: "Vantaa" }, { sv: "Åbo", en: "Turku" }], words: [{ sv: "bor", en: "live" }, { sv: "i", en: "in" }] },
    { id: "d1-p4", template: "Jag talar {}.", en: "I speak {}.", slot: { value: "engelska, hindi och marathi", en: "English, Hindi and Marathi", label: "your languages" }, swaps: [{ sv: "svenska", en: "Swedish" }, { sv: "finska", en: "Finnish" }], words: [{ sv: "talar", en: "speak" }, { sv: "och", en: "and" }] },
    { id: "d1-p5", template: "Jag lär mig svenska.", en: "I am learning Swedish.", words: [{ sv: "lär mig", en: "learn (keep it as one piece)" }] },
  ],
  understand: q1,
  words: [{ sv: "berätta", en: "tell" }, { sv: "skriv", en: "write" }],
  rule: { text: "One verb form for every person: jag bor, du bor. Do not put är before another verb to make the present.", wrong: "Jag är bor", right: "Jag bor" },
  steps: [
    { id: "s1", title: "Listen and repeat", minutes: 10, kind: "hear", intro: "Hear each sentence before you say it. Press Hear, then say it out loud after the voice. Do it three times for each one." },
    { id: "s2", title: "Say it from the English, then swap", minutes: 10, kind: "recall", intro: "Cover the Swedish. Read the English and say the sentence out loud. Then check. After that, swap the changeable word three times." },
    { id: "s3", title: "Answer the four questions", minutes: 10, kind: "questions", intro: "Listen only. You hear a question; answer it out loud in a full sentence about yourself; then check." },
    { id: "s4", title: "Berätta om dig själv", minutes: 10, kind: "speak", intro: "Tell about yourself. Record your five sentences, listen once, then redo once." },
    { id: "s5", title: "Type the five sentences from memory", minutes: 10, kind: "typelines", intro: "Set up å, ä and ö (the buttons help). Type each sentence from the English. The check ignores capital letters and small spelling slips." },
    { id: "s6", title: "Answer as Sara", minutes: 5, kind: "speak", intro: "Same questions, but you are Sara. Say her four facts without looking." },
    { id: "s7", title: "Cards and error list", minutes: 5, kind: "cards", intro: "Today's eight cards. Add the three listening cards to your review, and note any mistake you made." },
  ],
  cards: [
    { id: "d1-p1", front: "My name is Alex.", back: "Jag heter Alex." },
    { id: "d1-p2", front: "I come from India.", back: "Jag kommer från Indien." },
    { id: "d1-p3", front: "I live in Espoo.", back: "Jag bor i Esbo." },
    { id: "d1-p4", front: "I speak English, Hindi and Marathi.", back: "Jag talar engelska, hindi och marathi." },
    { id: "d1-p5", front: "I am learning Swedish.", back: "Jag lär mig svenska." },
    { id: "c-d1-l1", front: "Vad heter du?", back: "What's your name? Answer: Jag heter Alex.", own: true },
    { id: "c-d1-l2", front: "Var kommer du ifrån?", back: "Where are you from? Answer: Jag kommer från Indien.", own: true },
    { id: "c-d1-l3", front: "Vilka språk talar du?", back: "Which languages do you speak? Answer: Jag talar engelska, hindi och marathi.", own: true },
  ],
  typeLines: [
    { en: "My name is Alex.", sv: "Jag heter Alex." },
    { en: "I come from India.", sv: "Jag kommer från Indien." },
    { en: "I live in Espoo.", sv: "Jag bor i Esbo." },
    { en: "I speak English, Hindi and Marathi.", sv: "Jag talar engelska, hindi och marathi." },
    { en: "I am learning Swedish.", sv: "Jag lär mig svenska." },
  ],
  speakTasks: [
    { id: "s4", prompt: "Berätta om dig själv.", en: "Tell about yourself.", points: ["Your name", "Where you come from", "Where you live", "Which languages you speak", "That you are learning Swedish"], model: "Hej! Jag heter Alex. Jag kommer från Indien. Jag bor i Esbo. Jag talar engelska, hindi och marathi. Jag lär mig svenska." },
    { id: "s6", prompt: "Svara som Sara: Sara, från Sverige, bor i Åbo, talar svenska och finska.", en: "Answer as Sara: Sara, from Sweden, lives in Turku, speaks Swedish and Finnish.", points: ["Name: Sara", "From: Sverige", "Lives in: Åbo", "Speaks: svenska och finska"], model: "Jag heter Sara. Jag kommer från Sverige. Jag bor i Åbo. Jag talar svenska och finska." },
  ],
  doneWhen: {
    green: "You answer the four questions without reading; your recording and your typing give the five facts.",
    amber: `${GENERIC_AMBER} Watch for ~~Jag är bor~~.`,
    red: GENERIC_RED,
  },
  tomorrow: "Day 2: your work, your years in Finland, and asking back.",
};

const NUMBER_WORDS = ["noll", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva", "tolv"];

export const DAY2: GuidedDay = {
  key: "2",
  title: "Say more, and ask back",
  goal: "Add your work and your time in Finland, and ask two questions yourself.",
  patterns: [
    { id: "d2-p1", template: "Jag jobbar som {}.", en: "I work as {}.", slot: { value: "ingenjör", en: "an engineer", label: "your job" }, swaps: [{ sv: "lärare", en: "a teacher" }, { sv: "läkare", en: "a doctor" }, { sv: "programmerare", en: "a programmer" }], words: [{ sv: "jobbar", en: "work" }, { sv: "som", en: "as (no en before a job)" }] },
    { id: "d2-p2", template: "Jag har bott i Finland i {} år.", en: "I have lived in Finland for {} years.", slot: { value: "fem", en: "five", label: "a number from 1 to 12" }, swaps: [{ sv: "tre", en: "three" }, { sv: "sju", en: "seven" }, { sv: "tolv", en: "twelve" }], words: [{ sv: "har bott", en: "have lived (one piece)" }, { sv: "i … år", en: "for … years (one piece)" }] },
    { id: "d2-p3", template: "Vad heter du?", en: "What's your name? (now you ask it)", words: [{ sv: "vad", en: "what" }, { sv: "heter", en: "is called" }, { sv: "du", en: "you" }], note: "The question word comes first, then the verb, then du. Same shape: Var bor du?" },
    { id: "d2-p4", template: "Och du?", en: "And you?", words: [{ sv: "och", en: "and" }, { sv: "du", en: "you" }] },
    { id: "d2-p5", template: "Hälsningar, Alex", en: "Regards, Alex (closes a message to a friend; it opens with Hej!)", words: [{ sv: "hälsningar", en: "regards" }] },
  ],
  understand: [
    { sv: "Vad jobbar du med?", en: "What do you do for work?", answer: "Jag jobbar som ingenjör." },
    { sv: "Hur länge har du bott i Finland?", en: "How long have you lived in Finland?", answer: "Jag har bott i Finland i fem år." },
  ],
  words: [{ sv: "fråga", en: "ask" }, { sv: "svara", en: "answer" }, { sv: "ställ två frågor", en: "ask two questions" }],
  rule: { text: "After a question word, the verb comes next.", wrong: "Var du bor?", right: "Var bor du?" },
  steps: [
    { id: "s1", title: "Review your Day 1 cards", minutes: 8, kind: "recall", intro: "Say each Day 1 sentence from the English, out loud. Then check and rate yourself honestly." },
    { id: "s2", title: "Listen and repeat, numbers too", minutes: 10, kind: "hear", intro: "Hear each new sentence before you say it, then say it three times. Then hear the numbers 0 to 12." },
    { id: "s3", title: "What does the question want?", minutes: 2, kind: "wants", intro: "Each question word asks for one kind of answer. Learn the three you have met." },
    { id: "s4", title: "Make the question, then answer six questions", minutes: 8, kind: "makeq", intro: "First turn each answer into the question you would ask. Then answer all six questions out loud." },
    { id: "s5", title: "A helper asks four questions", minutes: 12, kind: "conversation", intro: "The voice asks; you answer out loud in a full sentence, and twice you add Och du? Record yourself and redo it once." },
    { id: "s6", title: "Type a message to a new course-mate", minutes: 10, kind: "typemsg", intro: "Write about yourself and ask two questions." },
    { id: "s7", title: "Write the numbers you hear", minutes: 5, kind: "dictation", intro: "You hear eight numbers. Write each one as digits." },
    { id: "s8", title: "Cards and error list", minutes: 5, kind: "cards", intro: "Today's eight cards, and your error list." },
  ],
  cards: [
    { id: "d2-p1", front: "I work as an engineer.", back: "Jag jobbar som ingenjör." },
    { id: "d2-p2", front: "I have lived in Finland for five years.", back: "Jag har bott i Finland i fem år." },
    { id: "d2-p3", front: "What's your name? (you ask)", back: "Vad heter du?" },
    { id: "d2-p4", front: "And you?", back: "Och du?" },
    { id: "d2-p5", front: "Regards, Alex", back: "Hälsningar, Alex" },
    { id: "c-d2-6", front: "Where do you live? (you ask)", back: "Var bor du?", own: true },
    { id: "c-d2-7", front: "Vad jobbar du med? / Hur länge har du bott i Finland?", back: "What do you do for work? / How long have you lived in Finland?", own: true },
    { id: "c-d2-8", front: "fråga · svara · ställ två frågor", back: "ask · answer · ask two questions", own: true },
  ],
  typeLines: [],
  speakTasks: [],
  wants: [
    { q: "Var?", wants: "a place (i Esbo)" },
    { q: "Vad?", wants: "a thing or a name (Alex)" },
    { q: "Hur länge?", wants: "a length of time (i fem år)" },
  ],
  makeQ: [
    { answer: "Jag bor i Esbo.", question: "Var bor du?" },
    { answer: "Jag heter Alex.", question: "Vad heter du?" },
  ],
  numbers: {
    words: NUMBER_WORDS.map((sv, i) => ({ sv, en: String(i) })),
    dictation: [["tre", 3], ["sju", 7], ["noll", 0], ["tolv", 12], ["fem", 5], ["nio", 9], ["elva", 11], ["sex", 6]].map(([say, key]) => ({ say: say as string, key: key as number })),
  },
  conversation: [
    { voice: "Vad heter du?", model: "Jag heter Alex." },
    { voice: "Var bor du?", model: "Jag bor i Esbo. Och du?", addAndYou: true },
    { voice: "Vad jobbar du med?", model: "Jag jobbar som ingenjör." },
    { voice: "Hur länge har du bott i Finland?", model: "Jag har bott i Finland i fem år. Och du?", addAndYou: true },
  ],
  message: {
    prompt: "Skriv till en ny kurskamrat. Berätta om dig själv och ställ två frågor.",
    en: "Write to a new course-mate. Tell about yourself and ask two questions.",
    points: [
      { label: "Opens with Hej!", test: "hej" },
      { label: "Your facts (name, where you live, how long, your work)", test: "jag" },
      { label: "Two questions (with ?)", test: "??" },
      { label: "Closes with Hälsningar", test: "hälsningar" },
    ],
    model: "Hej! Jag heter Alex och jag kommer från Indien. Jag bor i Esbo. Jag har bott i Finland i fem år. Jag jobbar som ingenjör. Jag lär mig svenska. Vad heter du? Var bor du? Hälsningar, Alex",
  },
  doneWhen: {
    green: "Full answers on your own; the verb comes next in your two questions; the message has Hej!, your facts, two questions and Hälsningar.",
    amber: `${GENERIC_AMBER} Watch for ~~Var du bor?~~`,
    red: GENERIC_RED,
  },
  tomorrow: "Day 3a: time first, verb second (I dag jobbar jag hemma).",
};

export const GUIDED_DAYS: Record<string, GuidedDay> = { "1": DAY1, "2": DAY2 };
