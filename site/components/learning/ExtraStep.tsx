"use client";

import type { ReactNode } from "react";
import type { LectureExtraStep } from "@/lib/course-types";
import { SourcePagePracticeSet } from "./SourcePagePractice";

type StepOfKind<K extends LectureExtraStep["kind"]> = Extract<LectureExtraStep, { kind: K }>;

/**
 * One renderer per extra-step kind. Adding a kind means adding its data shape
 * to `LectureExtraStep` and one entry here; TypeScript flags a missing entry.
 */
const renderers: { [K in LectureExtraStep["kind"]]: (step: StepOfKind<K>) => ReactNode } = {
  "source-practice": (step) => <SourcePagePracticeSet pages={step.pages} />,
};

export default function ExtraStep({ step }: { step: LectureExtraStep }) {
  const render = renderers[step.kind] as (value: LectureExtraStep) => ReactNode;
  return <>{render(step)}</>;
}
