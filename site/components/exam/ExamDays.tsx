"use client";

import { useMemo, useState, lazy, Suspense } from "react";
import { isUnitDone, summarise, todayUnitKey } from "@/lib/exam-state";
import type { ExamGar, ExamUnit } from "@/lib/exam-types";
import type { ExamApi } from "./useExam";
import styles from "./exam.module.css";

const ExamPilot = lazy(() => import("./ExamPilot"));

const PHASES: Record<number, string> = { 1: "Phase 1 · Foundations (Days 1–14)", 2: "Phase 2 · Task moves (Days 15–42)", 3: "Phase 3 · Topics (Days 43–63)", 4: "Phase 4 · Full tasks and mocks (Days 64–84)" };
const KIND: Record<string, string> = { light: "light day", rest: "rest day", mock: "mock", "exit-test": "exit test", study: "" };

export function GarDot({ gar }: { gar?: ExamGar }) {
  return <span className={`${styles.dot} ${gar ? styles[gar] : styles.none}`} role="img" aria-label={gar ? gar : "not done yet"} />;
}

export default function ExamDays({ units, exam, openDay }: { units: ExamUnit[]; exam: ExamApi; openDay: (key: string) => void }) {
  const [tab, setTab] = useState<"days" | "pilot">("days");
  const state = exam.state;
  const keys = useMemo(() => units.map((u) => u.key), [units]);
  const today = state ? todayUnitKey(keys, state) : null;
  const stats = state ? summarise(keys, state) : null;
  const phases = [1, 2, 3, 4];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXAM COURSE · 84 DAYS</p>
          <h1>All days</h1>
          <p>Open any day. A day counts as done when you mark it Green or Amber; Red means do it again with new details.</p>
        </div>
      </div>
      <div className={styles.tabs} role="group" aria-label="Exam days views">
        <button type="button" className={styles.tab} aria-pressed={tab === "days"} onClick={() => setTab("days")}>Days</button>
        <button type="button" className={styles.tab} aria-pressed={tab === "pilot"} onClick={() => setTab("pilot")}>Pilot log and mock signals</button>
      </div>
      {tab === "pilot" ? (
        <Suspense fallback={<p className={styles.muted}>Loading…</p>}><ExamPilot units={units} exam={exam} /></Suspense>
      ) : (
        <>
          {stats ? (
            <div className={styles.stats}>
              <div className={styles.stat}><b>{stats.done}/{stats.total}</b><span>days done</span></div>
              <div className={styles.stat}><b>{Math.round(stats.minutes / 60 * 10) / 10}</b><span>hours logged</span></div>
              <div className={styles.stat}><b>{stats.counts.green} · {stats.counts.amber} · {stats.counts.red}</b><span>green · amber · red</span></div>
            </div>
          ) : null}
          {phases.map((phase) => (
            <section key={phase} className={styles.stack} aria-label={PHASES[phase]}>
              <p className={styles.phase}>{PHASES[phase]}</p>
              <div className={styles.dayList}>
                {units.filter((u) => u.phase === phase).map((u) => {
                  const log = state?.days[u.key];
                  const done = state ? isUnitDone(state, u.key) : false;
                  return (
                    <button key={u.key} type="button" className={`${styles.dayRow} ${u.key === today ? styles.today : ""}`} onClick={() => openDay(u.key)}>
                      <GarDot gar={log?.gar} />
                      <span className={styles.dayLabel}>{u.label}</span>
                      <span className={styles.dayTitle}>{u.title}{u.key === today ? " · next" : ""}</span>
                      <span className={styles.dayMeta}>{[KIND[u.kind], log ? `${log.minutes} min${log.gar === "red" ? " · repeat" : done ? "" : ""}` : `${u.minutes} min`].filter(Boolean).join(" · ")}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
