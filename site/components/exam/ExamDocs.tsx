"use client";

import { useState } from "react";
import type { ExamDocSection } from "@/lib/exam-types";
import MarkdownView from "./MarkdownView";
import { useContent } from "./useExam";
import styles from "./exam.module.css";

type DocList = { id: string; title: string; summary: string; playable: boolean; sections: { id: string; title: string; level: number; layer?: string }[] }[];
type DocBody = { id: string; title: string; playable: boolean; section: ExamDocSection };

const LAYER: Record<string, string> = { active: "Active core: say it without notes", recognition: "Recognition core: understand it", reference: "Reference: look it up", rules: "Study rules" };

/** Reads one of the course documents (core sheet, method, templates, book map, guide, audio list). */
export default function ExamDocs({ docId, showPicker = false }: { docId: string; showPicker?: boolean }) {
  const [doc, setDoc] = useState(docId);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const list = useContent<DocList>("kind=docs");
  const current = list.data?.find((d) => d.id === doc);
  const sectionId = picked[doc] ?? current?.sections[0]?.id ?? null;
  const body = useContent<DocBody>(sectionId ? `kind=doc&key=${encodeURIComponent(doc)}&section=${encodeURIComponent(sectionId)}` : null);
  let lastLayer = "";
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXAM COURSE · {showPicker ? "METHOD AND GUIDE" : "CORE SHEET"}</p>
          <h1>{current?.title ?? (showPicker ? "Method and guide" : "Core sheet")}</h1>
          <p>{current?.summary ?? ""}</p>
        </div>
      </div>
      <p className={styles.notice}>The Swedish in these documents is AI-written and has not been checked by a teacher yet. Tap a green Swedish phrase to hear it (synthetic Sweden-Swedish voice).</p>
      {list.error ? <p role="alert" className={styles.error}>{list.error}</p> : null}
      {showPicker && list.data ? (
        <div className={styles.docNav} role="group" aria-label="Documents">
          {list.data.map((d) => <button key={d.id} type="button" className={styles.tab} aria-pressed={doc === d.id} onClick={() => setDoc(d.id)}>{d.title}</button>)}
        </div>
      ) : null}
      <div className={styles.docGrid}>
        <nav className={`${styles.card} ${styles.toc}`} aria-label="Sections">
          {current?.sections.map((s) => {
            const header = s.layer && s.layer !== lastLayer ? LAYER[s.layer] : null;
            if (s.layer) lastLayer = s.layer;
            return (
              <div key={s.id}>
                {header ? <p className={styles.layerTag}>{header}</p> : null}
                <button type="button" className={styles.tocItem} aria-current={s.id === sectionId} onClick={() => { setPicked((p) => ({ ...p, [doc]: s.id })); window.scrollTo({ top: 0, behavior: "instant" }); }}>{s.title}</button>
              </div>
            );
          }) ?? <p className={styles.muted}>Loading…</p>}
        </nav>
        <article className={styles.card} aria-live="polite">
          {body.error ? <p role="alert" className={styles.error}>{body.error}</p>
            : body.data ? (
              <>
                <h2>{body.data.section.title}</h2>
                <MarkdownView markdown={body.data.section.markdown} playable={body.data.playable} />
              </>
            ) : <p className={styles.muted}>Loading…</p>}
        </article>
      </div>
    </>
  );
}
