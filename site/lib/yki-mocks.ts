import type { Skill } from "./course-types.ts";

export type YkiMockQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type YkiMockListeningTask = {
  id: string;
  title: string;
  instruction: string;
  listeningText: string;
  minutes: number;
  questions: YkiMockQuestion[];
};

export type YkiMockReadingTask = {
  id: string;
  title: string;
  instruction: string;
  text: string;
  minutes: number;
  questions: YkiMockQuestion[];
};

export type YkiMockSpeakingTask = {
  id: string;
  title: string;
  minutes: number;
  scenario: string;
  task: string;
  followUp?: string;
  successChecks: string[];
};

export type YkiMockWritingTask = {
  id: string;
  title: string;
  minutes: number;
  reader: string;
  purpose: string;
  prompt: string;
  suggestedLength: string;
  successChecks: string[];
};

export type YkiMockDiagnosis = {
  skill: Skill;
  title: string;
  prompts: string[];
  nextDrillPrompt: string;
};

export type YkiTargetedReturn = {
  source: "structured" | "legacy";
  skill: Skill | null;
  drill: string;
};

const ykiSkills: readonly Skill[] = ["listening", "speaking", "reading", "writing"];
const TARGETED_RETURN_KIND = "yki-targeted-return";
const MINIMUM_DRILL_LENGTH = 12;

function isYkiSkill(value: unknown): value is Skill {
  return typeof value === "string" && ykiSkills.includes(value as Skill);
}

function meaningfulDrill(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const drill = value.replace(/\s+/g, " ").trim();
  return drill.length >= MINIMUM_DRILL_LENGTH ? drill : null;
}

export function parseYkiTargetedReturn(raw: unknown): YkiTargetedReturn | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { kind?: unknown; skill?: unknown; drill?: unknown };
    if (parsed.kind === TARGETED_RETURN_KIND && isYkiSkill(parsed.skill)) {
      const drill = meaningfulDrill(parsed.drill);
      return drill ? { source: "structured", skill: parsed.skill, drill } : null;
    }
    return null;
  } catch {
    if (value.startsWith("{") || value.startsWith("[")) return null;
  }
  const drill = meaningfulDrill(value);
  return drill ? { source: "legacy", skill: null, drill } : null;
}

export function serializeYkiTargetedReturn(skill: Skill, drill: string): string {
  if (!isYkiSkill(skill)) {
    throw new TypeError("A YKI return plan needs one of the four language skills.");
  }
  const normalizedDrill = meaningfulDrill(drill);
  if (!normalizedDrill) {
    throw new TypeError(
      `A YKI return plan needs a specific drill of at least ${MINIMUM_DRILL_LENGTH} characters.`,
    );
  }
  return JSON.stringify({ kind: TARGETED_RETURN_KIND, skill, drill: normalizedDrill });
}

export type YkiMockTimingBlock = {
  id: "conditions" | "listening" | "reading" | "speaking" | "writing" | "diagnosis" | "return";
  label: string;
  minutes: number;
};

export type YkiMockSet = {
  episode: 59 | 60;
  id: string;
  title: string;
  theme: string;
  totalMinutes: 60;
  originalPracticeNotice: string;
  conditions: string[];
  timing: YkiMockTimingBlock[];
  listening: YkiMockListeningTask[];
  reading: YkiMockReadingTask[];
  speaking: YkiMockSpeakingTask[];
  writing: YkiMockWritingTask[];
  diagnosis: YkiMockDiagnosis[];
};

const timing: YkiMockTimingBlock[] = [
  { id: "conditions", label: "Prepare", minutes: 3 },
  { id: "listening", label: "Listening", minutes: 10 },
  { id: "reading", label: "Reading", minutes: 10 },
  { id: "speaking", label: "Speaking", minutes: 15 },
  { id: "writing", label: "Writing", minutes: 15 },
  { id: "diagnosis", label: "Skill diagnosis", minutes: 5 },
  { id: "return", label: "Next drill", minutes: 2 },
];

const conditions = [
  "Complete the first attempt independently and with the timer running.",
  "Listen before opening transcript support.",
  "Speak from keywords instead of reading a finished script.",
  "Write for the named reader and purpose.",
  "Treat every score as practice evidence, not an official YKI result.",
];

const commonDiagnosis: YkiMockDiagnosis[] = [
  {
    skill: "listening",
    title: "Listening",
    prompts: [
      "Could you identify the situation before catching every word?",
      "Which detail was hardest: time, reason, intention, or required action?",
    ],
    nextDrillPrompt: "Listen to one new Swedish service message and note only who, when, and what happens next before a second listen.",
  },
  {
    skill: "reading",
    title: "Reading",
    prompts: [
      "Did you find the text’s purpose without translating every word?",
      "Which sentence carried the action, condition, or deadline?",
    ],
    nextDrillPrompt: "Read one new Swedish notice and mark its purpose, deadline, condition, and required action.",
  },
  {
    skill: "speaking",
    title: "Speaking",
    prompts: [
      "Did you complete the communicative purpose even when a word was missing?",
      "Which part needs a clearer structure: opening, reason, example, request, or closing?",
    ],
    nextDrillPrompt: "Record a fresh 75-second Swedish response with an opening, two key details, one repair phrase, and a clear closing.",
  },
  {
    skill: "writing",
    title: "Writing",
    prompts: [
      "Could the reader immediately identify why you wrote?",
      "Did every requested point lead to a concrete next step?",
    ],
    nextDrillPrompt: "Write a fresh 90-word Swedish message and check only reader, purpose, required details, and requested next action.",
  },
];

export const ykiMocks: Record<59 | 60, YkiMockSet> = {
  59: {
    episode: 59,
    id: "stigen-original-mock-a",
    title: "Original four-skill practice set A",
    theme: "Everyday services and your neighbourhood",
    totalMinutes: 60,
    originalPracticeNotice:
      "This is Stigen’s original, compressed four-skill practice. It is not an official YKI test, a copy of released material, or a representation of official test timing.",
    conditions,
    timing,
    listening: [
      {
        id: "a-listen-library",
        title: "A library voicemail",
        instruction: "Lyssna två gånger. Välj först huvudbudskapet och sedan den viktiga handlingen.",
        listeningText:
          "Hej, det här är stadsbiblioteket. Boken som du reserverade har kommit och väntar på dig vid informationsdisken. På grund av renoveringen stänger biblioteket redan klockan sexton på fredag. Om du inte hinner hämta boken före helgen kan vi hålla den till tisdag, men då behöver du svara på det här meddelandet senast fredag klockan tolv.",
        minutes: 5,
        questions: [
          {
            id: "a-listen-library-q1",
            prompt: "Varför ringer biblioteket?",
            options: ["En reserverad bok har kommit.", "Ett lån är försenat.", "Biblioteket har tappat ett kort."],
            answerIndex: 0,
            explanation: "The voicemail says that the reserved book is ready for collection.",
          },
          {
            id: "a-listen-library-q2",
            prompt: "Vad ska personen göra om boken hämtas först på tisdag?",
            options: ["Betala en avgift.", "Svara senast fredag klockan tolv.", "Göra en ny reservation."],
            answerIndex: 1,
            explanation: "A reply by noon Friday is required to keep the book until Tuesday.",
          },
        ],
      },
      {
        id: "a-listen-neighbour",
        title: "A message from a neighbour",
        instruction: "Lyssna efter problem, tillfällig lösning och tid.",
        listeningText:
          "Hej Alex! Tvättmaskinen i den tvättstuga vi har bokat har gått sönder. Fastighetsskötaren kommer i morgon eftermiddag. Jag har flyttat vår bokning till tvättstugan i huset bredvid klockan arton, och vi kan använda samma nyckel. Skicka gärna ett meddelande om den tiden inte passar, så försöker jag byta igen.",
        minutes: 5,
        questions: [
          {
            id: "a-listen-neighbour-q1",
            prompt: "Vad är problemet?",
            options: ["Nyckeln saknas.", "Tvättmaskinen är trasig.", "Bokningen är nästa vecka."],
            answerIndex: 1,
            explanation: "The washing machine in the booked room is broken.",
          },
          {
            id: "a-listen-neighbour-q2",
            prompt: "Vilken lösning föreslår grannen?",
            options: ["Tvätta i huset bredvid klockan 18.", "Vänta en månad.", "Köpa en ny maskin."],
            answerIndex: 0,
            explanation: "The booking has been moved to the neighbouring building at 18:00.",
          },
        ],
      },
    ],
    reading: [
      {
        id: "a-read-water",
        title: "A building notice",
        instruction: "Läs texten och hitta ändringen, undantaget och den handling som krävs.",
        text:
          "MEDDELANDE TILL BOENDE\nVattnet stängs av på onsdag klockan 8–12 på grund av rörarbete. Tappa upp dricksvatten i förväg. Husets gym är öppet som vanligt, men duscharna får inte användas under avbrottet. Arbetet gäller inte affärslokalen på gatuplanet. Frågor kan skickas till servicebolaget före tisdag klockan 16.",
        minutes: 5,
        questions: [
          {
            id: "a-read-water-q1",
            prompt: "Vad bör de boende göra före onsdag morgon?",
            options: ["Tappa upp dricksvatten.", "Stänga gymmet.", "Kontakta affärslokalen."],
            answerIndex: 0,
            explanation: "The notice explicitly asks residents to store drinking water beforehand.",
          },
          {
            id: "a-read-water-q2",
            prompt: "Vilket utrymme påverkas inte av avbrottet?",
            options: ["Duscharna", "Affärslokalen", "Alla bostäder"],
            answerIndex: 1,
            explanation: "The ground-floor business premises are excluded.",
          },
        ],
      },
      {
        id: "a-read-event",
        title: "A volunteer invitation",
        instruction: "Läs för syfte, villkor och nästa steg.",
        text:
          "Vill du hjälpa till på områdets höstdag? Vi behöver frivilliga till informationsbordet mellan klockan 11 och 15. Du kan välja ett tvåtimmarspass. Tidigare erfarenhet behövs inte, men du ska delta i ett kort digitalt introduktionsmöte på torsdagen. Anmäl dig senast måndag och skriv vilka tider du kan delta.",
        minutes: 5,
        questions: [
          {
            id: "a-read-event-q1",
            prompt: "Vad måste alla frivilliga göra före evenemanget?",
            options: ["Köpa arbetskläder.", "Delta i ett digitalt möte.", "Arbeta hela dagen."],
            answerIndex: 1,
            explanation: "Every volunteer must join the short online introduction.",
          },
          {
            id: "a-read-event-q2",
            prompt: "Vad ska anmälan innehålla?",
            options: ["Möjliga arbetstider", "Ett fotografi", "Tidigare lön"],
            answerIndex: 0,
            explanation: "Applicants need to state the times when they can participate.",
          },
        ],
      },
    ],
    speaking: [
      {
        id: "a-speak-return",
        title: "Return a faulty lamp",
        minutes: 7,
        scenario: "Du köpte en bordslampa för tre dagar sedan. Den slocknar efter några minuter, även med en ny glödlampa.",
        task: "Tala med kundtjänsten. Beskriv felet, säg när du köpte lampan och be om en konkret lösning.",
        followUp: "Butiken kan inte byta lampan i dag. Hur vill du gå vidare?",
        successChecks: ["State the purchase and fault.", "Request a clear solution.", "Respond to the changed condition."],
      },
      {
        id: "a-speak-area",
        title: "Improve your neighbourhood",
        minutes: 8,
        scenario: "Kommunen frågar hur ett tomt område nära ditt hem borde användas.",
        task: "Föreslå en användning. Ge två skäl och ett konkret exempel på vem som skulle ha nytta av den.",
        followUp: "En annan boende oroar sig för buller. Bemöt oron.",
        successChecks: ["Give a clear proposal.", "Support it with reasons and an example.", "Acknowledge and answer the concern."],
      },
    ],
    writing: [
      {
        id: "a-write-maintenance",
        title: "Request a repair",
        minutes: 7,
        reader: "Fastighetsservice",
        purpose: "Get a leaking kitchen tap inspected.",
        prompt: "Skriv var problemet finns, när det började, vad du redan har kontrollerat och när servicepersonalen kan komma.",
        suggestedLength: "About 70–100 words for this practice.",
        successChecks: ["Make the problem and location clear.", "Include timing and useful access details.", "Ask for a specific next action."],
      },
      {
        id: "a-write-invitation",
        title: "Reply to an invitation",
        minutes: 8,
        reader: "A neighbour you know",
        purpose: "Accept an invitation while checking one practical detail.",
        prompt: "Tacka för inbjudan, säg att du kommer, nämn en kostpreferens och fråga vad du kan ta med.",
        suggestedLength: "About 50–80 words for this practice.",
        successChecks: ["Use a friendly register.", "Answer attendance and food points.", "Ask one useful practical question."],
      },
    ],
    diagnosis: commonDiagnosis,
  },
  60: {
    episode: 60,
    id: "stigen-original-mock-b",
    title: "Original four-skill practice set B",
    theme: "Work, learning, and public choices",
    totalMinutes: 60,
    originalPracticeNotice:
      "This is Stigen’s original, compressed four-skill practice. It is not an official YKI test, a copy of released material, or a representation of official test timing.",
    conditions,
    timing,
    listening: [
      {
        id: "b-listen-shift",
        title: "A change at work",
        instruction: "Lyssna efter ändringen, orsaken och vad mottagaren förväntas göra.",
        listeningText:
          "Hej! Det är Mira från caféet. Personen som skulle öppna på lördag har blivit sjuk. Kan du börja klockan sju i stället för nio? Du skulle fortfarande sluta klockan tre. Om du kan ta passet får du ledigt nästa onsdag. Ring mig före klockan sex i kväll, även om du inte kan.",
        minutes: 5,
        questions: [
          {
            id: "b-listen-shift-q1",
            prompt: "Vilken ändring föreslår Mira?",
            options: ["Börja två timmar tidigare.", "Sluta två timmar senare.", "Arbeta på onsdag."],
            answerIndex: 0,
            explanation: "The proposed start moves from nine to seven; the end time stays three.",
          },
          {
            id: "b-listen-shift-q2",
            prompt: "När ska mottagaren svara?",
            options: ["Före sex i kväll", "På lördag morgon", "Nästa onsdag"],
            answerIndex: 0,
            explanation: "Mira asks for a call before 18:00 today, whether or not the shift works.",
          },
        ],
      },
      {
        id: "b-listen-course",
        title: "Course feedback",
        instruction: "Lyssna efter talarens helhetsåsikt och förbättringsförslag.",
        listeningText:
          "Jag har tyckt om kvällskursen, särskilt samtalsövningarna i små grupper. Tempot har ändå varit högt, och det har varit svårt att hinna repetera mellan lektionerna. Jag skulle gärna fortsätta nästa termin om vi fick kortare hemuppgifter och en tydlig ordlista efter varje lektion. Jag vill inte ha färre övningar, bara bättre stöd för repetition.",
        minutes: 5,
        questions: [
          {
            id: "b-listen-course-q1",
            prompt: "Vad uppskattar talaren mest?",
            options: ["Samtalsövningar i små grupper", "Långa hemuppgifter", "Ett långsammare kursbyte"],
            answerIndex: 0,
            explanation: "The small-group speaking practice is named as the strongest positive.",
          },
          {
            id: "b-listen-course-q2",
            prompt: "Vilken förändring vill talaren ha?",
            options: ["Färre lektioner", "Bättre repetitionsstöd", "Inga hemuppgifter alls"],
            answerIndex: 1,
            explanation: "The speaker asks for shorter homework and a clear word list to support review.",
          },
        ],
      },
    ],
    reading: [
      {
        id: "b-read-course",
        title: "A changed course arrangement",
        instruction: "Läs och skilj på gammal information, ny information och alternativ.",
        text:
          "Hej deltagare! Kursen i digitala vardagstjänster flyttas från tisdagar klockan 18 till torsdagar klockan 17 med start nästa vecka. Platsen är fortfarande bibliotekets datasal. Om den nya tiden inte passar kan du byta till distansgruppen på måndagar klockan 19. Meddela ditt val senast fredag. Kursavgiften återbetalas bara om inget av alternativen passar.",
        minutes: 5,
        questions: [
          {
            id: "b-read-course-q1",
            prompt: "Vad är oförändrat?",
            options: ["Veckodagen", "Platsen", "Starttiden"],
            answerIndex: 1,
            explanation: "The library computer room remains the venue.",
          },
          {
            id: "b-read-course-q2",
            prompt: "När kan avgiften återbetalas?",
            options: ["Alltid", "Om inget alternativ passar", "Bara efter första lektionen"],
            answerIndex: 1,
            explanation: "A refund is available only if neither offered option works.",
          },
        ],
      },
      {
        id: "b-read-opinion",
        title: "A view on remote work",
        instruction: "Läs för ståndpunkt, argument och kompromiss.",
        text:
          "Distansarbete passar inte alla uppgifter, men det borde vara möjligt när arbetets innehåll tillåter det. Många sparar restid och kan koncentrera sig bättre hemma. Samtidigt kan samarbetet bli svårare om kollegor aldrig träffas. Därför föreslår jag inte ett helt frivilligt system. En gemensam kontorsdag i veckan skulle ge teamet tid att planera, medan resten kunde avgöras utifrån arbetsuppgift och livssituation.",
        minutes: 5,
        questions: [
          {
            id: "b-read-opinion-q1",
            prompt: "Vilken är skribentens huvudståndpunkt?",
            options: ["Distansarbete ska förbjudas.", "Distansarbete ska vara möjligt när uppgiften tillåter.", "Alla ska arbeta hemma varje dag."],
            answerIndex: 1,
            explanation: "The writer supports remote work conditionally, not universally.",
          },
          {
            id: "b-read-opinion-q2",
            prompt: "Vilken kompromiss föreslår skribenten?",
            options: ["En gemensam kontorsdag", "Kortare semester", "Inga teammöten"],
            answerIndex: 0,
            explanation: "One shared office day is proposed to protect collaboration.",
          },
        ],
      },
    ],
    speaking: [
      {
        id: "b-speak-course",
        title: "Ask for a course solution",
        minutes: 7,
        scenario: "Din kurs flyttas till en tid då du arbetar.",
        task: "Ring arrangören. Förklara situationen, fråga om alternativ och säg vilket resultat du önskar.",
        followUp: "Det finns ingen kvällsgrupp. Fråga om en annan möjlig lösning.",
        successChecks: ["Explain old and new conditions.", "Ask about alternatives.", "Adapt after the follow-up."],
      },
      {
        id: "b-speak-work",
        title: "A balanced workplace opinion",
        minutes: 8,
        scenario: "Din arbetsplats överväger två fasta distansdagar varje vecka.",
        task: "Ge din åsikt med två skäl, ett konkret exempel och en möjlig nackdel.",
        followUp: "Din kollega säger att nya arbetstagare behöver mer stöd på kontoret. Svara.",
        successChecks: ["State a clear position.", "Use reasons and an example.", "Respond constructively to another perspective."],
      },
    ],
    writing: [
      {
        id: "b-write-manager",
        title: "Propose a work arrangement",
        minutes: 7,
        reader: "Your manager",
        purpose: "Request a temporary schedule change.",
        prompt: "Beskriv den nuvarande situationen, föreslå en tidsbegränsad lösning, förklara hur arbetsuppgifterna ska skötas och be om svar före ett visst datum.",
        suggestedLength: "About 90–120 words for this practice.",
        successChecks: ["Use an appropriate professional tone.", "Explain impact and solution.", "Request a clear decision or follow-up."],
      },
      {
        id: "b-write-opinion",
        title: "Write to a local newspaper",
        minutes: 8,
        reader: "Readers of a local newspaper",
        purpose: "Argue for one practical community improvement.",
        prompt: "Välj kollektivtrafik, bibliotek eller motionsmöjligheter. Presentera ditt förslag, ge två argument, bemöt en möjlig invändning och föreslå ett första steg.",
        suggestedLength: "About 110–150 words for this practice.",
        successChecks: ["Make the position unmistakable.", "Support it with connected reasons.", "Acknowledge another view and end with an action."],
      },
    ],
    diagnosis: commonDiagnosis,
  },
};

export const getYkiMock = (episode: number): YkiMockSet | undefined =>
  episode === 59 || episode === 60 ? ykiMocks[episode] : undefined;

export const ykiMockByEpisode = getYkiMock;
