"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, RotateCcw, Timer } from "lucide-react";
import AudioButton from "./AudioButton";

type Question = { id: string; fi: string; en: string; sample: string };

const ROUND = 3;
const SECONDS = 15;

function pick(questions: Question[]) {
  return [...questions].sort(() => Math.random() - 0.5).slice(0, ROUND);
}

/**
 * The unplanned part of a real conversation: hear a question you did not
 * prepare, answer aloud within a short time, then compare with one possible
 * answer. No script and no text unless you ask for it.
 */
export default function QuickQuestions({
  questions,
  onDone,
}: {
  questions: Question[];
  onDone: (answered: number) => void;
}) {
  const [round, setRound] = useState(() => pick(questions));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"ask" | "answer" | "review">("ask");
  const [left, setLeft] = useState(SECONDS);
  const [showText, setShowText] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const current = round[index];

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function startAnswer() {
    setPhase("answer");
    setLeft(SECONDS);
    if (timer.current) clearInterval(timer.current);
    const started = Date.now();
    timer.current = setInterval(() => {
      const remaining = SECONDS - Math.floor((Date.now() - started) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) stopAnswer();
    }, 250);
  }
  function stopAnswer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPhase("review");
  }
  function rate(answered: boolean) {
    const next = [...results, answered];
    setResults(next);
    setShowText(false);
    setPhase("ask");
    setIndex(index + 1);
    if (next.length === round.length) onDone(next.filter(Boolean).length);
  }

  if (!current) {
    const answered = results.filter(Boolean).length;
    return (
      <div className="quick-questions quick-questions-done" role="status">
        <p>
          <Check size={17} aria-hidden="true" /> You answered {answered} of {round.length} without getting stuck.
          {answered < round.length ? " The ones you missed are good ones to ask Stigen about." : " That is real conversation."}
        </p>
        <button
          type="button"
          className="secondary"
          onClick={() => { setRound(pick(questions)); setIndex(0); setResults([]); setPhase("ask"); }}
        >
          <RotateCcw size={15} aria-hidden="true" /> Ask me three new ones
        </button>
      </div>
    );
  }

  return (
    <div className="quick-questions">
      <div className="quick-questions-meta">
        <span className="badge">Question {index + 1} of {round.length}</span>
        <span className="help-text">No script. Short answers are fine.</span>
      </div>
      {phase === "ask" && (
        <div className="quick-questions-card">
          <p>Hear the question, then press start and answer aloud straight away.</p>
          <div className="quick-questions-actions">
            <AudioButton key={current.id} text={current.fi} speaker="Elin" label={`Hear question ${index + 1}`} className="secondary" />
            <button type="button" className="primary" onClick={startAnswer}>
              <Timer size={16} aria-hidden="true" /> Start my {SECONDS} seconds
            </button>
          </div>
        </div>
      )}
      {phase === "answer" && (
        <div className="quick-questions-card">
          <p className="quick-questions-timer" aria-live="off"><Timer size={20} aria-hidden="true" /> {left}s</p>
          <p>Answer aloud now. One short sentence is enough.</p>
          <div className="quick-questions-actions">
            <AudioButton key={`${current.id}-again`} text={current.fi} speaker="Elin" label="Hear it again" className="secondary" />
            {!showText && (
              <button type="button" className="text-button" onClick={() => setShowText(true)}>
                <Eye size={15} aria-hidden="true" /> Show the question text
              </button>
            )}
            <button type="button" className="primary" onClick={stopAnswer}>I answered</button>
          </div>
          {showText && <p className="quick-questions-text" lang="sv">{current.fi}</p>}
        </div>
      )}
      {phase === "review" && (
        <div className="quick-questions-card">
          <p className="quick-questions-text" lang="sv">{current.fi} <small>{current.en}</small></p>
          <p>One possible answer:</p>
          <p className="quick-questions-sample" lang="sv">{current.sample}</p>
          <AudioButton key={`${current.id}-sample`} text={current.sample.split(" / ")[0]} speaker="Henrik" label="Hear the sample" slow className="secondary" />
          <p>How did your answer go?</p>
          <div className="quick-questions-actions">
            <button type="button" className="primary" onClick={() => rate(true)}>I answered it</button>
            <button type="button" className="secondary" onClick={() => rate(false)}>I got stuck</button>
          </div>
        </div>
      )}
    </div>
  );
}
