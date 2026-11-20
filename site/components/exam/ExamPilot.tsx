"use client";

import type { ExamDayLogV1, ExamUnit } from "@/lib/exam-types";
import type { ExamApi } from "./useExam";
import { GarDot } from "./ExamDays";
import styles from "./exam.module.css";

const ratio = (r?: { got: number; of: number }) => (r ? `${r.got}/${r.of}` : "–");

/** The seven-lesson pilot: what really happened in Days 1-7, so the course can be changed from facts. */
export default function ExamPilot({ units, exam }: { units: ExamUnit[]; exam: ExamApi }) {
  const state = exam.state;
  if (!state) return <p className={styles.muted}>Loading…</p>;
  const rows = units.filter((u) => u.day <= 7 && u.kind !== "mock");
  const logged = rows.filter((u) => state.days[u.key]);
  const minutes = logged.map((u) => state.days[u.key].minutes);
  const avg = minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : 0;
  const over70 = logged.filter((u) => u.kind === "study" && state.days[u.key].minutes > 70).length;
  const cell = (log: ExamDayLogV1 | undefined, f: "recalled" | "understood" | "changed" | "typed") => ratio(log?.[f]);
  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <h3>Pilot log, Days 1–7</h3>
        <p className={styles.muted}>Fill in the optional pilot boxes when you log a day (Days 1–7). After Day 7 look here: is 60 minutes realistic, do you remember yesterday&rsquo;s sentences, and which day was too much?</p>
        <div className={styles.stats}>
          <div className={styles.stat}><b>{logged.length}/{rows.length}</b><span>days logged</span></div>
          <div className={styles.stat}><b>{avg || "–"}</b><span>average minutes</span></div>
          <div className={styles.stat}><b>{over70}</b><span>study days over 70 min</span></div>
        </div>
        {over70 >= 2 ? <p className={styles.notice} role="status">Two or more days ran past 70 minutes: 60 minutes a day is probably not enough for this load. Say so to your teacher; the plan says to split those days.</p> : null}
      </div>
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Day</th><th>Mark</th><th>Minutes</th><th>New patterns</th><th>Recalled</th><th>Understood</th><th>Changed</th><th>Typed</th><th>Too much</th></tr></thead>
          <tbody>
            {rows.map((u) => {
              const log = state.days[u.key];
              return (
                <tr key={u.key}>
                  <td>{u.label}</td>
                  <td>{log ? <><GarDot gar={log.gar} /> {log.gar}</> : "–"}</td>
                  <td>{log?.minutes ?? "–"}</td>
                  <td>{log?.newPatterns ?? "–"}</td>
                  <td>{cell(log, "recalled")}</td><td>{cell(log, "understood")}</td><td>{cell(log, "changed")}</td><td>{cell(log, "typed")}</td>
                  <td>{log?.tooMuch ?? "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
