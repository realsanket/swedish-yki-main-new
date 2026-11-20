"use client";

import { useState } from "react";
import type { ExamGar, ExamLearnerPage, ExamUnit } from "@/lib/exam-types";
import { isUnitDone } from "@/lib/exam-state";
import { playSpeech, useSpeech } from "./speech";
import type { ExamApi } from "./useExam";
import { GarDot } from "./ExamDays";
import { InlineMarkdown } from "./MarkdownView";
import styles from "./exam.module.css";

const PILOT_FIELDS = [
  ["recalled", "Recalled next day"],
  ["understood", "Understood when spoken"],
  ["changed", "Changed independently"],
  ["typed", "Typed independently"],
] as const;
type PilotKey = (typeof PILOT_FIELDS)[number][0];

const GAR_COPY: Record<ExamGar, { label: string; short: string }> = {
  green: { label: "Green", short: "Did it on your own. Go on." },
  amber: { label: "Amber", short: "Got there, but slowly or one mistake kept coming back. Note it and go on." },
  red: { label: "Red", short: "Misunderstood, could not answer, or needed the model. Repeat tomorrow with new details." },
};

export function PlayLine({ id, text, speaker, label }: { id: string; text: string; speaker: "Elin" | "Maja" | "Henrik" | "Alex"; label?: string }) {
  const key = `line:${id}`;
  const { state, error } = useSpeech(key);
  return (
    <>
      <button type="button" className={styles.chip} data-state={state} aria-label={`${state === "idle" ? "Hear" : "Stop"}: ${text}`} onClick={() => void playSpeech(key, { text, speaker })}>
        {label ?? text}
      </button>
      {error ? <span role="status" className={styles.chipError}>{error}</span> : null}
    </>
  );
}

function ratio(got: string, of: string): { got: number; of: number } | undefined {
  if (got === "" && of === "") return undefined;
  const g = Number(got), o = Number(of);
  return Number.isFinite(g) && Number.isFinite(o) ? { got: g, of: o } : undefined;
}

export function LogPanel({ unit, doneWhen, exam, suggestedMinutes }: { unit: ExamUnit; doneWhen?: ExamLearnerPage["doneWhen"]; exam: ExamApi; suggestedMinutes?: number }) {
  const existing = exam.state?.days[unit.key];
  const needsMark = unit.kind === "study" || unit.kind === "exit-test" || unit.kind === "mock";
  const [gar, setGar] = useState<ExamGar | null>(existing?.gar ?? (needsMark ? null : "green"));
  const [minutes, setMinutes] = useState(String(existing?.minutes ?? suggestedMinutes ?? unit.minutes));
  const [note, setNote] = useState(existing?.note ?? "");
  const [newPatterns, setNewPatterns] = useState(existing?.newPatterns != null ? String(existing.newPatterns) : "");
  const [tooMuch, setTooMuch] = useState(existing?.tooMuch ?? "");
  const [pairs, setPairs] = useState<Record<PilotKey, { got: string; of: string }>>(() => {
    const out = {} as Record<PilotKey, { got: string; of: string }>;
    for (const [k] of PILOT_FIELDS) out[k] = { got: existing?.[k] ? String(existing[k]!.got) : "", of: existing?.[k] ? String(existing[k]!.of) : "" };
    return out;
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pilot = unit.day <= 7 && unit.kind !== "mock";
  const done = exam.state ? isUnitDone(exam.state, unit.key) : false;

  async function save() {
    setMessage("");
    if (!gar) { setError("Choose Green, Amber or Red first."); return; }
    const mins = Number(minutes);
    if (!Number.isFinite(mins) || mins < 0 || mins > 600) { setError("Minutes must be a number from 0 to 600."); return; }
    const log: Parameters<ExamApi["act"]>[0] & { type: "logDay" } = {
      type: "logDay",
      unitKey: unit.key,
      log: {
        gar,
        minutes: Math.round(mins),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(pilot && newPatterns !== "" ? { newPatterns: Number(newPatterns) } : {}),
        ...(pilot && tooMuch.trim() ? { tooMuch: tooMuch.trim() } : {}),
        ...(pilot ? Object.fromEntries(PILOT_FIELDS.map(([k]) => [k, ratio(pairs[k].got, pairs[k].of)]).filter(([, v]) => v)) : {}),
      },
    };
    const problem = await exam.act(log);
    setError(problem);
    if (!problem) setMessage(gar === "red" ? "Saved. This day stays next: repeat it with new details." : "Saved. Cards from this day join your review tomorrow.");
  }

  return (
    <div className={styles.card}>
      <div className={`${styles.row} ${styles.between}`}>
        <h3>{needsMark ? "How did it go?" : "Mark this day done"}</h3>
        {existing ? <span className={styles.badge}><GarDot gar={existing.gar} /> logged {existing.date}{done ? "" : " · repeat"}</span> : null}
      </div>
      {needsMark ? (
        <div className={styles.garRow} role="group" aria-label="Green, Amber or Red">
          {(["green", "amber", "red"] as const).map((g) => (
            <button key={g} type="button" className={`${styles.garButton} ${g === "green" ? styles.g : g === "amber" ? styles.a : styles.r}`} aria-pressed={gar === g} onClick={() => setGar(g)}>
              <b><GarDot gar={g} /> {GAR_COPY[g].label}</b>
              <span className={styles.garText}><InlineMarkdown text={doneWhen?.[g] || GAR_COPY[g].short} /></span>
            </button>
          ))}
        </div>
      ) : <p className={styles.muted}>Light and rest days need no mark. Write how long it took and mark it done.</p>}
      <div className={styles.fieldRow} style={{ marginTop: 14 }}>
        <label className={styles.field}>Actual minutes (the true number)
          <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
        <label className={styles.field} style={{ gridColumn: "1 / -1" }}>Note (optional)
          <textarea value={note} maxLength={600} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
      {pilot ? (
        <details style={{ marginTop: 12 }}>
          <summary>Pilot log for Days 1–7 (optional)</summary>
          <div className={styles.fieldRow} style={{ marginTop: 10 }}>
            <label className={styles.field}>New patterns today
              <input inputMode="numeric" value={newPatterns} onChange={(e) => setNewPatterns(e.target.value)} />
            </label>
            {PILOT_FIELDS.map(([k, label]) => (
              <div key={k} className={styles.field}>{label}
                <span className={styles.pair}>
                  <input aria-label={`${label}: correct`} inputMode="numeric" value={pairs[k].got} onChange={(e) => setPairs({ ...pairs, [k]: { ...pairs[k], got: e.target.value } })} /> of
                  <input aria-label={`${label}: total`} inputMode="numeric" value={pairs[k].of} onChange={(e) => setPairs({ ...pairs, [k]: { ...pairs[k], of: e.target.value } })} />
                </span>
              </div>
            ))}
            <label className={styles.field} style={{ gridColumn: "1 / -1" }}>What was too much?
              <input value={tooMuch} maxLength={600} onChange={(e) => setTooMuch(e.target.value)} />
            </label>
          </div>
          <p className={styles.muted}>Fill these in the next morning for the recall row: cover the Swedish and say yesterday&rsquo;s patterns from the English.</p>
        </details>
      ) : null}
      <div className={styles.row} style={{ marginTop: 14 }}>
        <button type="button" className="primary" disabled={exam.saving} onClick={() => void save()}>{existing ? "Update" : needsMark ? "Log this day" : "Mark done"}</button>
        {existing ? <button type="button" className="text-button" onClick={async () => { setError(await exam.act({ type: "resetDay", unitKey: unit.key })); setGar(needsMark ? null : "green"); setMessage(""); }}>Clear this day&rsquo;s log</button> : null}
      </div>
      {message ? <p role="status" className={styles.muted}>{message}</p> : null}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </div>
  );
}

export function QuickError({ unit, exam }: { unit: ExamUnit; exam: ExamApi }) {
  const [text, setText] = useState("");
  const [right, setRight] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <details className={styles.card}>
      <summary><b>Add a mistake to your error list</b></summary>
      <div className={styles.fieldRow} style={{ marginTop: 10 }}>
        <label className={styles.field}>What you wrote or said (wrong)
          <input value={text} maxLength={300} onChange={(e) => { setText(e.target.value); setSaved(false); }} />
        </label>
        <label className={styles.field}>The right way (optional)
          <input value={right} maxLength={300} onChange={(e) => setRight(e.target.value)} />
        </label>
      </div>
      <div className={styles.row} style={{ marginTop: 10 }}>
        <button
          type="button"
          className="secondary"
          disabled={!text.trim() || exam.saving}
          onClick={async () => {
            const problem = await exam.act({ type: "addError", id: `e-${crypto.randomUUID()}`, text, ...(right.trim() ? { right } : {}), unitKey: unit.key });
            setError(problem);
            if (!problem) { setText(""); setRight(""); setSaved(true); }
          }}
        >Add to the list</button>
        {saved ? <span role="status" className={styles.muted}>Added. At most 3 new error cards a day.</span> : null}
      </div>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </details>
  );
}

