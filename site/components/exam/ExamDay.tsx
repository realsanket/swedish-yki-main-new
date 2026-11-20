"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import type { ExamDialogue, ExamLearnerPage, ExamUnit } from "@/lib/exam-types";
import MarkdownView from "./MarkdownView";
import { playSpeech, useSpeech } from "./speech";
import { useCurriculumEntry, useLearnerPage, type ExamApi } from "./useExam";
import { PlayLine, LogPanel, QuickError } from "./DayParts";
import GuidedDay, { GUIDED_KEYS } from "./guided/GuidedDay";
import styles from "./exam.module.css";

function Dialogue({ dialogue }: { dialogue: ExamDialogue }) {
  const [showYou, setShowYou] = useState(false);
  const key = `call:${dialogue.id}`;
  const { state, error } = useSpeech(key);
  const segments = dialogue.turns.map((t) => ({ text: t.sv, speaker: (t.who === "voice" ? "Henrik" : "Maja") as "Henrik" | "Maja" }));
  return (
    <div className={styles.card}>
      <div className={`${styles.row} ${styles.between}`}>
        <h3>{dialogue.title.replace(/\(helper reads "Voice"[^)]*\)/, "").replace(/^\d+[ab]?\s*/, "").trim() || "Phone call"}</h3>
        <button type="button" className="secondary" onClick={() => void playSpeech(key, { segments })} aria-label={state === "idle" ? "Play the whole call" : "Stop the call"}>
          {state === "idle" ? <Play size={16} aria-hidden /> : <Square size={16} aria-hidden />} {state === "idle" ? "Play the whole call" : "Stop"}
        </button>
      </div>
      <p className={styles.muted}>Listen first. The <b>Voice</b> lines are the other person; the blurred lines are a model for you: try your own answer, then reveal them.</p>
      <label className={`${styles.row} ${styles.small}`}>
        <input type="checkbox" checked={showYou} onChange={(e) => setShowYou(e.target.checked)} /> Show my lines
      </label>
      {error ? <p role="status" className={styles.error}>{error}</p> : null}
      <div>
        {dialogue.turns.map((turn, index) => (
          <div className={styles.turn} key={index}>
            <span className={styles.who}>{turn.who === "voice" ? "Voice" : "You"}</span>
            <span className={turn.who === "you" ? styles.youLine : undefined} data-open={showYou}>
              <PlayLine id={`${dialogue.id}-${index}`} text={turn.sv} speaker={turn.who === "voice" ? "Henrik" : "Maja"} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepList({ unit, page, exam }: { unit: ExamUnit; page: ExamLearnerPage; exam: ExamApi }) {
  const ticked = new Set(exam.state?.steps[unit.key] ?? []);
  const [error, setError] = useState("");
  const total = page.steps.reduce((n, s) => n + (s.minutes ?? 0), 0);
  return (
    <div className={styles.card}>
      <div className={`${styles.row} ${styles.between}`}>
        <h3>Steps</h3>
        <span className={styles.badge}>{ticked.size}/{page.steps.length} done{total ? ` · about ${total} min` : ""}</span>
      </div>
      <ul className={styles.steps}>
        {page.steps.map((step) => (
          <li key={step.id} className={`${styles.step} ${ticked.has(step.id) ? styles.done : ""}`}>
            <input
              type="checkbox"
              checked={ticked.has(step.id)}
              aria-label={`Step ${step.id.slice(1)}`}
              onChange={async (e) => setError(await exam.act({ type: "tickStep", unitKey: unit.key, stepId: step.id, done: e.target.checked }))}
            />
            <span><MarkdownView markdown={step.text.replace(/\s*\(\d+\s*min\)\s*$/, "")} playable /></span>
            {step.minutes ? <span className={styles.muted}>{step.minutes} min</span> : null}
          </li>
        ))}
      </ul>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </div>
  );
}

type DayProps = { unitKey: string; units: ExamUnit[]; exam: ExamApi; openDay: (key: string) => void; back: () => void };

/** Keyed by day so the tab, forms and scroll position start fresh when you move to another day. */
export default function ExamDay(props: DayProps) {
  const unit = props.units.find((u) => u.key === props.unitKey);
  // Days 1 and 2 have a hand-built guided lesson; every other day uses the page below.
  if (unit && GUIDED_KEYS.has(unit.key)) return <GuidedDay key={props.unitKey} unit={unit} units={props.units} exam={props.exam} openDay={props.openDay} back={props.back} />;
  return <ExamDayBody key={props.unitKey} {...props} />;
}

function ExamDayBody({ unitKey, units, exam, openDay, back }: DayProps) {
  const index = units.findIndex((u) => u.key === unitKey);
  const unit = units[index];
  const learner = useLearnerPage(unit?.hasLearnerPage ? unit.key : null);
  const entry = useCurriculumEntry(unit?.curriculumKey ?? null);
  const [tab, setTab] = useState<"today" | "full" | "answers">("today");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  const page = learner.data;
  const prev = units[index - 1];
  const next = units[index + 1];
  const cardTexts = useMemo(() => page?.cards ?? [], [page]);
  if (!unit) return <div className={styles.card}><p>This day was not found.</p><button type="button" className="secondary" onClick={back}>Back to all days</button></div>;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PHASE {unit.phase} · {unit.label.toUpperCase()} · {unit.minutes} MIN</p>
          <h1>{unit.title}</h1>
        </div>
      </div>
      <div className={`${styles.row} ${styles.between}`}>
        <button type="button" className="secondary" onClick={back}>All days</button>
        <span className={styles.row}>
          <button type="button" className="secondary" disabled={!prev} onClick={() => prev && openDay(prev.key)} aria-label={prev ? `Previous: ${prev.label}` : "No previous day"}><ChevronLeft size={16} aria-hidden /> {prev?.label ?? ""}</button>
          <button type="button" className="secondary" disabled={!next} onClick={() => next && openDay(next.key)} aria-label={next ? `Next: ${next.label}` : "No next day"}>{next?.label ?? ""} <ChevronRight size={16} aria-hidden /></button>
        </span>
      </div>
      <p className={styles.notice}>Hear each new line before you say it: tap any <span className={styles.chip}>Swedish phrase</span> to hear it. The voices are synthetic Sweden-Swedish, and the Swedish is AI-written and not yet checked by a teacher.</p>

      <div className={styles.tabs} role="group" aria-label="Day content">
        <button type="button" className={styles.tab} aria-pressed={tab === "today"} onClick={() => setTab("today")}>{unit.hasLearnerPage ? "Today" : "Day plan"}</button>
        {unit.hasLearnerPage ? <button type="button" className={styles.tab} aria-pressed={tab === "full"} onClick={() => setTab("full")}>Full curriculum entry</button> : null}
        {page?.backMarkdown ? <button type="button" className={styles.tab} aria-pressed={tab === "answers"} onClick={() => setTab("answers")}>Models and keys</button> : null}
      </div>

      <div className={styles.card}>
        {tab === "answers" && page?.backMarkdown ? (
          <>
            <p className={styles.muted}>Try the task first. These are the models, keys and the helper&rsquo;s lines.</p>
            <MarkdownView markdown={page.backMarkdown} playable />
          </>
        ) : tab === "full" || !unit.hasLearnerPage ? (
          entry.error ? <p role="alert" className={styles.error}>{entry.error}</p>
            : entry.data ? (
              <>
                {!unit.hasLearnerPage ? <p className={styles.muted}>This day has no short learner page yet. Follow the full entry below. <b>Hear each new line before you say it</b> (tap a Swedish phrase).</p> : null}
                <MarkdownView markdown={entry.data.markdown} playable />
              </>
            ) : <p className={styles.muted}>Loading…</p>
        ) : learner.error ? <p role="alert" className={styles.error}>{learner.error}</p>
          : page ? <MarkdownView markdown={page.markdown} playable />
          : <p className={styles.muted}>Loading…</p>}
      </div>

      {page ? <StepList unit={unit} page={page} exam={exam} /> : null}
      {page?.dialogues.map((d) => <Dialogue key={d.id} dialogue={d} />)}
      {cardTexts.length ? (
        <div className={styles.card}>
          <h3>Cards from this day ({cardTexts.length})</h3>
          <p className={styles.muted}>English on the front, Swedish on the back. Log the day and they join your review from tomorrow.</p>
          <ul>
            {cardTexts.map((c) => <li key={c.id}>{c.front} → <PlayLine id={c.id} text={c.back} speaker="Elin" /></li>)}
          </ul>
        </div>
      ) : null}

      <LogPanel key={unit.key} unit={unit} doneWhen={page?.doneWhen} exam={exam} />
      <QuickError unit={unit} exam={exam} />
    </>
  );
}
