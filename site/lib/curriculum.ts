import lectureData from "../content/lectures/index.json";
import modulesData from "../content/modules.json";

/** Original learning material. CEFR stages are learning goals, not certified assessments. */
export type Level = "A0" | "A1" | "A2" | "B1";
export type Skill = "listening" | "speaking" | "reading" | "writing";
export type Word = { id: string; fi: string; en: string; example: string; translation: string; level: Level };
export type Question = { question: string; options: string[]; answer: number; explanation: string };
export type Lesson = {
  id: string;
  level: Level;
  unit: string;
  title: string;
  subtitle: string;
  minutes: number;
  goal: string;
  grammar: { title: string; explanation: string; examples: { fi: string; en: string }[] };
  pronunciation: { text: string; tip: string };
  words: Word[];
  reading: Question & { text: string };
  listening: Question & { text: string };
  speaking: { prompt: string; help: string; model: string };
  writing: { prompt: string; help: string; model: string };
  quiz: Question[];
};
export type ExamTask = {
  id: string;
  skill: Skill;
  title: string;
  prompt: string;
  help: string;
  text?: string;
  questions?: Question[];
  model?: string;
  seconds: number;
};

type RawCourseQuestion = {
  prompt: string;
  answers: string[];
  options?: string[];
  explanation: string;
};

type RawLecture = {
  number: number;
  objectives: string[];
  sections: {
    title: string;
    kind?: "scene" | "rule" | "register";
    body: string[];
    examples: { fi: string; en: string }[];
  }[];
  checkpoint: RawCourseQuestion[];
  practice: {
    words: Omit<Word, "level">[];
    pronunciation: Lesson["pronunciation"];
    listening: Lesson["listening"];
    reading: Lesson["reading"];
    speaking: Lesson["speaking"];
    writing: Lesson["writing"];
  };
};

export const stages: { level: Level; title: string; description: string; outcome: string }[] = [
  {
    level: "A0",
    title: "First words",
    description: "Start from zero with clear English support.",
    outcome: "Greet people, introduce yourself, hear key Swedish contrasts, and ask for help.",
  },
  {
    level: "A1",
    title: "Everyday foundations",
    description: "Build short sentences for everyday life in Swedish-speaking Finland.",
    outcome: "Handle simple shopping, travel, routines, appointments, and personal information.",
  },
  {
    level: "A2",
    title: "Make yourself understood",
    description: "Connect ideas and navigate familiar situations.",
    outcome: "Describe experiences, arrange plans, understand notices, and solve routine problems.",
  },
  {
    level: "B1",
    title: "Connected communication practice",
    description: "Express opinions and practise listening, speaking, reading, and writing in YKI-style tasks.",
    outcome: "Communicate connected ideas about familiar topics with reasons, examples, and repair.",
  },
];

const rawLectures = lectureData as RawLecture[];
const modules = modulesData.modules as { number: number; level: Level; title: string; first: number; last: number }[];
const titles = modulesData.titles as string[];

function moduleFor(number: number) {
  const courseModule = modules.find((item) => number >= item.first && number <= item.last);
  if (!courseModule) throw new Error(`Lecture ${number} has no curriculum module.`);
  return courseModule;
}

function toQuestion(question: RawCourseQuestion): Question {
  const options = question.options?.length ? question.options : question.answers;
  const normalizedAnswer = question.answers[0]?.trim().toLocaleLowerCase("sv");
  const answer = options.findIndex(
    (option) => option.trim().toLocaleLowerCase("sv") === normalizedAnswer,
  );
  if (!normalizedAnswer || answer < 0) {
    throw new Error(`Curriculum question has no matching answer option: ${question.prompt}`);
  }
  return {
    question: question.prompt,
    options,
    answer,
    explanation: question.explanation,
  };
}

/**
 * The compact Practice Studio is generated from the same 60 authored episodes
 * as the story path. This avoids a second, drifting copy of the curriculum.
 * The internal `fi` field name is retained for saved-data compatibility; its
 * values are Swedish.
 */
export const lessons: Lesson[] = rawLectures
  .slice()
  .sort((a, b) => a.number - b.number)
  .map((lecture) => {
    const courseModule = moduleFor(lecture.number);
    const teaching =
      lecture.sections.find((section) => section.kind === "rule") ??
      lecture.sections[0];
    return {
      id: `lecture-${String(lecture.number).padStart(2, "0")}`,
      level: courseModule.level,
      unit: courseModule.title,
      title: titles[lecture.number - 1] ?? `Episode ${lecture.number}`,
      subtitle: lecture.objectives[0] ?? "Use Swedish for a practical purpose.",
      minutes: lecture.number % 5 === 0 ? 60 : 45,
      goal: lecture.objectives[0] ?? "Use Swedish for a practical purpose.",
      grammar: {
        title: teaching?.title ?? "Language in this situation",
        explanation: teaching?.body.join("\n\n") ?? "Notice the useful pattern, then use it in your own response.",
        examples: teaching?.examples ?? [],
      },
      pronunciation: lecture.practice.pronunciation,
      words: lecture.practice.words.map((word) => ({ ...word, level: courseModule.level })),
      reading: lecture.practice.reading,
      listening: lecture.practice.listening,
      speaking: lecture.practice.speaking,
      writing: lecture.practice.writing,
      quiz: lecture.checkpoint.slice(0, 2).map(toQuestion),
    };
  });

export const words: Word[] = Array.from(
  new Map(lessons.flatMap((lesson) => lesson.words).map((word) => [word.id, word])).values(),
);

export const examTasks: ExamTask[] = [
  {
    id: "exam-listening-appointment",
    skill: "listening",
    title: "A changed appointment",
    seconds: 150,
    prompt: "Lyssna på meddelandet och välj de bästa svaren.",
    help: "Listen first for why the caller contacted you, then for the new time and required action. This is original practice, not an official YKI item.",
    text: "Hej, det här är hälsostationen. Din tid på torsdag klockan fjorton tjugo har flyttats. Den nya tiden är på fredag klockan nio fyrtio. Anmäl dig i entrén ungefär tio minuter i förväg. Om tiden inte passar, ring oss senast på onsdag.",
    questions: [
      {
        question: "Varför ringer hälsostationen?",
        options: ["Tiden har flyttats.", "En räkning saknas.", "Mottagningen stänger permanent."],
        answer: 0,
        explanation: "The caller says that the Thursday appointment has been moved.",
      },
      {
        question: "När är den nya tiden?",
        options: ["Torsdag 14.20", "Fredag 9.40", "Onsdag 9.10"],
        answer: 1,
        explanation: "The new appointment is on Friday at 9:40.",
      },
    ],
  },
  {
    id: "exam-listening-event",
    skill: "listening",
    title: "A community event update",
    seconds: 180,
    prompt: "Lyssna efter huvudbudskapet, en viktig detalj och vad lyssnaren ska göra.",
    help: "Do not try to translate every word. Capture change, reason, and next action. This is original Stigen practice, not official YKI material or timing.",
    text: "Hej! Lördagens gårdsloppis flyttas in i samlingslokalen eftersom väderprognosen lovar kraftigt regn. Dörrarna öppnas som planerat klockan elva. Säljare kan komma från halv elva och ska ta med eget bord. Om du inte längre kan delta, skicka ett meddelande före fredag kväll.",
    questions: [
      {
        question: "Vad har ändrats?",
        options: ["Dagen", "Platsen", "Starttiden"],
        answer: 1,
        explanation: "The event moves indoors; the day and opening time stay the same.",
      },
      {
        question: "Vad ska en säljare ta med?",
        options: ["Ett eget bord", "Mat till alla", "En biljett"],
        answer: 0,
        explanation: "Sellers are explicitly asked to bring their own table.",
      },
    ],
  },
  {
    id: "exam-reading-building",
    skill: "reading",
    title: "A building notice",
    seconds: 240,
    prompt: "Läs meddelandet och hitta tid, konsekvens och handling.",
    help: "Read for what changes and what the resident must do. This is original Stigen practice, not official YKI material or timing.",
    text: "MEDDELANDE TILL BOENDE\nVattnet stängs av i hela huset på tisdag klockan 9–13 på grund av rörarbete. Tappa upp dricksvatten i förväg. Tvättstugan är stängd under avbrottet, men bastubokningar efter klockan 15 gäller som vanligt. Arbetet kan bli klart tidigare.",
    questions: [
      {
        question: "Vad bör de boende göra före avbrottet?",
        options: ["Tappa upp dricksvatten", "Boka bastun", "Flytta bilen"],
        answer: 0,
        explanation: "The notice tells residents to store drinking water beforehand.",
      },
      {
        question: "Vad gäller efter klockan 15?",
        options: ["Alla bokningar avbokas.", "Bastubokningar gäller normalt.", "Vattnet stängs av igen."],
        answer: 1,
        explanation: "Sauna bookings after 15:00 remain valid.",
      },
    ],
  },
  {
    id: "exam-reading-course",
    skill: "reading",
    title: "A course email",
    seconds: 270,
    prompt: "Läs e-postmeddelandet och skilj på den gamla och den nya informationen.",
    help: "Underline the changed place, unchanged end time, and any deadline. This is original Stigen practice, not official YKI material or timing.",
    text: "Hej! Torsdagens matlagningskurs ordnas den här veckan i ungdomsgården i stället för skolköket. Vi börjar en halvtimme senare, klockan 18.30, men slutar som vanligt klockan 20.30. Ta med ett förkläde och två små matlådor. Om du har en allergi som du inte har meddelat tidigare, skriv till oss senast på onsdag.",
    questions: [
      {
        question: "Vad är oförändrat?",
        options: ["Platsen", "Starttiden", "Sluttiden"],
        answer: 2,
        explanation: "The course still ends at 20:30.",
      },
      {
        question: "När ska en ny allergi meddelas?",
        options: ["Senast onsdag", "Efter kursen", "Nästa månad"],
        answer: 0,
        explanation: "The email gives Wednesday as the deadline.",
      },
    ],
  },
  {
    id: "exam-speaking-delivery",
    skill: "speaking",
    title: "Resolve a delivery problem",
    seconds: 75,
    prompt: "Du beställde en arbetsstol som skulle komma i går, men den kom inte. Ring kundtjänsten. Beskriv beställningen, förklara varför du behöver stolen snart och be om en ny leveranstid.",
    help: "Cover every point and ask for a concrete next step. The practice timer is not an official YKI duration.",
    model: "Hej! Jag beställde en arbetsstol förra veckan. Leveransen skulle komma i går, men jag fick varken stolen eller ett meddelande. Jag behöver den snart eftersom jag arbetar hemma. Kan ni kontrollera beställningen och ge mig en ny leveranstid?",
  },
  {
    id: "exam-speaking-opinion",
    skill: "speaking",
    title: "Give a reasoned opinion",
    seconds: 120,
    prompt: "Borde kollektivtrafiken vara gratis? Ge din åsikt, två skäl, ett exempel och gärna ett annat perspektiv.",
    help: "Use a simple structure: position → reason → example → limitation → conclusion. This is original Stigen practice, not official YKI material or timing.",
    model: "Jag tycker att kollektivtrafiken borde vara billig, men inte nödvändigtvis gratis för alla. Bra trafik kostar, och det viktigaste är att bussarna går ofta. Samtidigt skulle studerande och personer med låg inkomst kunna få billigare biljetter. Då blir systemet både tillgängligt och hållbart.",
  },
  {
    id: "exam-writing-message",
    skill: "writing",
    title: "Change a plan with a friend",
    seconds: 600,
    prompt: "Du lovade att hjälpa en vän att flytta på lördag, men du kan inte komma vid den avtalade tiden. Skriv ett meddelande: be om ursäkt, förklara orsaken och föreslå ett konkret annat sätt att hjälpa.",
    help: "Write for a friend and answer every requested point. Suggested practice length: 60–90 words, not an official limit.",
    model: "Hej Sara! Förlåt, men jag kan inte hjälpa till på lördag morgon. Mitt arbetspass ändrades och jag måste jobba till klockan två. Jag kan komma efter tre och bära lådor eller städa den gamla bostaden. Jag kan också ta med mat. Passar det? Förlåt för ändringen!",
  },
  {
    id: "exam-writing-request",
    skill: "writing",
    title: "Ask for a course solution",
    seconds: 900,
    prompt: "Tiden för en kurs du har anmält dig till har ändrats och den nya tiden passar inte. Skriv till arrangören: ange den gamla och nya tiden, förklara problemet, be om en lösning och fråga när du får svar.",
    help: "Use a clear subject, polite tone, essential facts, and a specific requested action. This is original Stigen practice, not official YKI material or timing.",
    model: "Hej! Jag anmälde mig till tisdagskursen som skulle börja klockan 18. Nu har tiden ändrats till klockan 16, men jag arbetar till fem. Finns det en grupp på samma nivå efter klockan 18? Om inte, vill jag gärna diskutera återbetalning. Kan ni svara den här veckan? Tack för hjälpen!",
  },
];
