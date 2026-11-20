import units from "@/content/exam/units.json";
import learner from "@/content/exam/learner.json";
import curriculum from "@/content/exam/curriculum.json";
import docs from "@/content/exam/docs.json";
// P0 shim: package C replaces this. Content cards are still the v1 learner-page cards.
import type { ExamCardV1 as ExamCard, ExamCurriculumEntry, ExamDoc, ExamLearnerPage, ExamUnit } from "./exam-types.ts";
import type { ExamContext } from "./exam-state.ts";

/** Server-side access to the generated exam content (npm run content:exam). Never import this in client components. */

export const examUnits = units as unknown as ExamUnit[];
export const examLearner = learner as unknown as Record<string, ExamLearnerPage>;
export const examCurriculum = curriculum as unknown as ExamCurriculumEntry[];
export const examDocs = docs as unknown as (ExamDoc & { playable?: boolean })[];

export const examUnitKeys: string[] = examUnits.map((u) => u.key);

export function getExamUnit(key: string): ExamUnit | undefined {
  return examUnits.find((u) => u.key === key);
}

export function getCurriculumEntry(key: string): ExamCurriculumEntry | undefined {
  return examCurriculum.find((e) => e.key === key);
}

export type ExamCardWithUnit = ExamCard & { unitKey: string };

export function contentCards(): ExamCardWithUnit[] {
  const out: ExamCardWithUnit[] = [];
  for (const [unitKey, page] of Object.entries(examLearner)) for (const card of page.cards) out.push({ ...card, unitKey });
  return out;
}

export function examContext(): ExamContext {
  const cards = contentCards();
  const byUnit = new Map<string, string[]>();
  for (const c of cards) byUnit.set(c.unitKey, [...(byUnit.get(c.unitKey) ?? []), c.id]);
  return { unitKeys: new Set(examUnitKeys), cardsByUnit: byUnit, contentCardIds: new Set(cards.map((c) => c.id)) };
}
