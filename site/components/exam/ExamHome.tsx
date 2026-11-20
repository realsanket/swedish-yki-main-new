"use client";

import { useMemo, useState } from "react";
import { summarise, todayUnitKey } from "@/lib/exam-state";
import type { ExamUnit } from "@/lib/exam-types";
import type { ExamApi } from "./useExam";
import type { ExamViewName } from "./ExamViews";
import styles from "./exam.module.css";

export default function ExamHome({ units, exam, openDay, navigate }: { units: ExamUnit[]; exam: ExamApi; openDay: (key: string) => void; navigate: (view: ExamViewName) => void }) {
  const state = exam.state;
  const keys = useMemo(() => units.map((u) => u.key), [units]);
  const [now] = useState(() => Date.now());
  if (!state) return <p className={styles.muted}>{exam.loading ? "Loading your progress…" : "Your progress is unavailable."}</p>;
  const todayKey = todayUnitKey(keys, state);
  const today = units.find((u) => u.key === todayKey);
  const stats = summarise(keys, state);
  const dueCount = Object.values(state.cards).filter((c) => c.due <= now).length;
  const red = units.find((u) => state.days[u.key]?.gar === "red" && u.key === todayKey);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXAM COURSE · PASS-FIRST</p>
          <h1>{today ? `Today: ${today.label}` : "You have finished every day."}</h1>
          <p>A short, exam-first course: learn the sentences the YKI tasks need, hear them first, say them, type them, and mark the day Green, Amber or Red.</p>
        </div>
      </div>
      <p className={styles.notice}>The Swedish in this course is AI-written and has not been checked by a teacher yet. The voices are synthetic Sweden-Swedish; your teacher&rsquo;s recordings are better to copy.</p>
      {today ? (
        <div className={styles.card}>
          <p className={styles.phase}>Phase {today.phase} · {today.minutes} minutes</p>
          <h2>{today.title}</h2>
          {red ? <p className={styles.muted}>You marked this day Red. Do it again with new details; it stays next until you mark it Green or Amber.</p> : null}
          <div className={styles.row}>
            <button type="button" className="primary" onClick={() => openDay(today.key)}>{state.days[today.key] ? "Repeat this day" : "Start this day"}</button>
            <button type="button" className="secondary" onClick={() => navigate("Exam days")}>All days</button>
          </div>
        </div>
      ) : null}
      <div className={styles.stats}>
        <div className={styles.stat}><b>{stats.done}/{stats.total}</b><span>days done</span></div>
        <div className={styles.stat}><b>{Math.round(stats.minutes / 60 * 10) / 10}</b><span>hours logged</span></div>
        <div className={styles.stat}><b>{dueCount}</b><span>cards to review</span></div>
        <div className={styles.stat}><b>{stats.openErrors}</b><span>open errors</span></div>
      </div>
      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3>Review</h3>
          <p className={styles.muted}>Cards from the days you finished come back the next day, then after 1, 6 days and longer. Review stops after 8 minutes.</p>
          <button type="button" className="secondary" onClick={() => navigate("Exam cards")}>{dueCount ? `Review ${dueCount} card${dueCount === 1 ? "" : "s"}` : "Open cards"}</button>
        </div>
        <div className={styles.card}>
          <h3>Core sheet</h3>
          <p className={styles.muted}>Everything you memorise, everything you only recognise, and what you look up.</p>
          <button type="button" className="secondary" onClick={() => navigate("Core sheet")}>Open the core sheet</button>
        </div>
      </div>
    </>
  );
}
