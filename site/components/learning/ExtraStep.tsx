"use client";

import type { ReactNode } from "react";
import type { LectureExtraStep } from "@/lib/course-types";
import { ClassroomHomeworkSet } from "./ClassroomHomework";
import { SourcePagePracticeSet } from "./SourcePagePractice";
import { YkiSpeakingPracticeSet } from "./YkiSpeakingPractice";
import { YkiComprehensionSet, type SkillScoreHandler } from "./YkiComprehension";

type StepOfKind<K extends LectureExtraStep["kind"]> = Extract<LectureExtraStep, { kind: K }>;

/**
 * One renderer per extra-step kind. Adding a kind means adding its data shape
 * to `LectureExtraStep` and one entry here; TypeScript flags a missing entry.
 */
type StepContext = { onScore?: SkillScoreHandler };

const renderers: { [K in LectureExtraStep["kind"]]: (step: StepOfKind<K>, context: StepContext) => ReactNode } = {
  "source-practice": (step) => <SourcePagePracticeSet pages={step.pages} />,
  "yki-speaking": (step) => <YkiSpeakingPracticeSet parts={step.parts} />,
  "classroom-homework": (step) => <ClassroomHomeworkSet homework={step.homework} />,
  "yki-comprehension": (step, context) => (
    <YkiComprehensionSet parts={step.parts} examMinutes={step.examMinutes} onScore={context.onScore} />
  ),
};

export default function ExtraStep({ step, onScore }: { step: LectureExtraStep; onScore?: SkillScoreHandler }) {
  const render = renderers[step.kind] as (value: LectureExtraStep, context: StepContext) => ReactNode;
  return <>{render(step, { onScore })}</>;
}
