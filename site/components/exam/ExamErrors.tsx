"use client";

import { useState } from "react";
import type { ExamUnit } from "@/lib/exam-types";
import type { ExamApi } from "./useExam";
import { InlineMarkdown } from "./MarkdownView";
import styles from "./exam.module.css";

/** The learner's own mistakes: what they wrote, the right way, and the day it came from. */
export default function ExamErrors({ units, exam, openDay }: { units: ExamUnit[]; exam: ExamApi; openDay: (key: string) => void }) {
  const [text, setText] = useState("");
  const [right, setRight] = useState("");
  const [message, setMessage] = useState("");
  const state = exam.state;
  if (!state) return <p className={styles.muted}>{exam.loading ? "Loading…" : "Unavailable."}</p>;
  const open = state.errors.filter((e) => !e.resolvedAt);
  const done = state.errors.filter((e) => e.resolvedAt);
  const label = (key?: string) => units.find((u) => u.key === key)?.label;
  const row = (e: (typeof state.errors)[number]) => (
    <li key={e.id} className={styles.card}>
      <p><del>{e.text}</del>{e.right ? <> → <b>{e.right}</b></> : null}</p>
      <div className={styles.row}>
        {e.unitKey ? <button type="button" className="text-button" onClick={() => openDay(e.unitKey!)}>{label(e.unitKey)}</button> : null}
        <button type="button" className="secondary" onClick={() => void exam.act({ type: "resolveError", id: e.id, resolved: !e.resolvedAt })}>{e.resolvedAt ? "Reopen" : "I have fixed this"}</button>
        <button type="button" className="text-button" onClick={() => void exam.act({ type: "deleteError", id: e.id })}>Delete</button>
      </div>
    </li>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXAM COURSE · LEARN FROM MISTAKES</p>
          <h1>Error list</h1>
          <p>Write down a mistake you made, with the right way. At most 3 new error cards a day; fix the same one again and again until it stops.</p>
        </div>
      </div>
      <div className={styles.card}>
        <h3>Add a mistake</h3>
        <div className={styles.fieldRow}>
          <label className={styles.field}>What you wrote or said (wrong)<input value={text} maxLength={300} onChange={(e) => setText(e.target.value)} /></label>
          <label className={styles.field}>The right way (optional)<input value={right} maxLength={300} onChange={(e) => setRight(e.target.value)} /></label>
        </div>
        <div className={styles.row} style={{ marginTop: 10 }}>
          <button type="button" className="primary" disabled={!text.trim() || exam.saving} onClick={async () => { const p = await exam.act({ type: "addError", id: `e-${crypto.randomUUID()}`, text, ...(right.trim() ? { right } : {}) }); setMessage(p); if (!p) { setText(""); setRight(""); } }}>Add to the list</button>
          {message ? <span role="alert" className={styles.error}>{message}</span> : null}
        </div>
      </div>
      <h3>Open ({open.length})</h3>
      {open.length ? <ul className={styles.stack} style={{ listStyle: "none", padding: 0, margin: 0 }}>{open.map(row)}</ul> : <p className={styles.muted}>No open mistakes. When you make one in a day, add it here with the right way.</p>}
      {done.length ? <><h3>Fixed ({done.length})</h3><ul className={styles.stack} style={{ listStyle: "none", padding: 0, margin: 0 }}>{done.map(row)}</ul></> : null}
      <p className={styles.muted}><InlineMarkdown text="Examples to watch for: ~~Jag är bor~~ → **Jag bor**; ~~Var du bor?~~ → **Var bor du?**" /></p>
    </>
  );
}
