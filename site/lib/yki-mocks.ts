import mockData from "../content/yki-mocks.json";
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
  episode: number;
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

// Archived practice sets stay inactive until a lecture explicitly selects an id.
export const ykiMocks = mockData as YkiMockSet[];
export const getYkiMock = (id?: string): YkiMockSet | undefined =>
  id ? ykiMocks.find((mock) => mock.id === id) : undefined;
