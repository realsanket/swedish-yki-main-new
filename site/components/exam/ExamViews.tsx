"use client";

import { lazy, Suspense } from "react";
import type { ExamUnit } from "@/lib/exam-types";
import { useExam, useUnits } from "./useExam";
import ExamHome from "./ExamHome";
import ExamDays from "./ExamDays";
import ExamDay from "./ExamDay";
import styles from "./exam.module.css";

const ExamCards = lazy(() => import("./ExamCards"));
const ExamErrors = lazy(() => import("./ExamErrors"));
const ExamDocs = lazy(() => import("./ExamDocs"));

export const EXAM_VIEWS = ["Exam today", "Exam days", "Core sheet", "Exam cards", "Error list", "Method & guide"] as const;
export type ExamViewName = (typeof EXAM_VIEWS)[number];

export type ExamViewProps = {
  view: ExamViewName;
  /** Set when the hash is #exam-day/<key>. */
  unitKey: string | null;
  openDay: (key: string) => void;
  navigate: (view: ExamViewName) => void;
};

/** One entry point for every exam-course screen, so the app shell only has to know about this file. */
export default function ExamViews({ view, unitKey, openDay, navigate }: ExamViewProps) {
  const exam = useExam();
  const { data: units, error: unitsError } = useUnits();
  const body = (list: ExamUnit[]) => {
    if (unitKey && view === "Exam days") return <ExamDay unitKey={unitKey} units={list} exam={exam} openDay={openDay} back={() => navigate("Exam days")} />;
    switch (view) {
      case "Exam today": return <ExamHome units={list} exam={exam} openDay={openDay} navigate={navigate} />;
      case "Exam days": return <ExamDays units={list} exam={exam} openDay={openDay} />;
      case "Core sheet": return <ExamDocs docId="core" />;
      case "Exam cards": return <ExamCards units={list} exam={exam} openDay={openDay} />;
      case "Error list": return <ExamErrors units={list} exam={exam} openDay={openDay} />;
      case "Method & guide": return <ExamDocs docId="guide" showPicker />;
    }
  };
  return (
    <div className={styles.stack}>
      {unitsError ? <p className={styles.error} role="alert">{unitsError}</p> : null}
      {exam.error && !exam.state ? <p className={styles.error} role="alert">{exam.error} <button type="button" className="text-button" onClick={() => void exam.reload()}>Try again</button></p> : null}
      {units ? <Suspense fallback={<p className={styles.muted}>Loading…</p>}>{body(units)}</Suspense> : !unitsError ? <p className={styles.muted}>Loading the exam course…</p> : null}
    </div>
  );
}
