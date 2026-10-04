"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Headphones, Timer } from "lucide-react";
import type { ComprehensionPart } from "@/lib/course-types";
import AudioButton from "./AudioButton";
import { useShowEnglish } from "./useShowEnglish";
import { QuestionList, emptySaved, loadSaved, scoreQuestions, storeSaved, type Saved } from "./ClassroomHomework";
import sourceStyles from "./SourcePagePractice.module.css";
import homeworkStyles from "./ClassroomHomework.module.css";
import styles from "./YkiComprehension.module.css";

export type SkillScoreHandler = (skill: "listening" | "reading", score: number, minutes: number) => void;

const storageKey = (id: string) => `comprehension:${id}`;

/** One countdown for an exam-style set; it only informs, it never locks answers. */
function ExamTimer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => (value === null ? null : value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  const shown = left ?? minutes * 60;
  const clock = `${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, "0")}`;
  return (
    <div className={styles.timer} role="timer" aria-live="off">
      <Timer size={18} aria-hidden="true" />
      <span>
        <b>{clock}</b> {left === 0 ? "· Time is up. Finish the question you are on, then check." : `· the test gives ${minutes} minutes for this part`}
      </span>
      {left === null ? (
        <button type="button" className="primary" onClick={() => setLeft(minutes * 60)}>
          Start the timer
        </button>
      ) : (
        <button type="button" className="secondary" onClick={() => setLeft(null)}>
          Reset
        </button>
      )}
    </div>
  );
}

function ListeningPart({ part, plays, onPlay }: { part: Extract<ComprehensionPart, { type: "listening" }>; plays: number; onPlay: () => void }) {
  const [showEnglish] = useShowEnglish();
  return (
    <>
      <p className={styles.situation} lang="sv">
        {part.situation.fi}
      </p>
      {showEnglish ? (
        <small className={homeworkStyles.translation}>{part.situation.en}</small>
      ) : null}
      <p className={styles.tip}>Read the questions first. Then listen. In the YKI test you hear each recording twice.</p>
      <div className={styles.player} onClickCapture={onPlay}>
        <AudioButton
          text={part.lines.map((line) => line.fi).join(" ")}
          segments={part.lines.map((line) => ({ text: line.fi, speaker: line.voice }))}
          label={plays === 0 ? "Listen (first time)" : plays === 1 ? "Listen (second time)" : "Listen again (extra practice)"}
          className="primary"
        />
        <span className={styles.plays}>{plays === 0 ? "Not played yet" : `Played ${plays} ${plays === 1 ? "time" : "times"}`}</span>
      </div>
    </>
  );
}

function Transcript({ part }: { part: ComprehensionPart }) {
  return (
    <details className={styles.transcript}>
      <summary>{part.type === "listening" ? "Transcript and new words" : "New words"}</summary>
      {part.type === "listening" && (
        <ol className={styles.lines}>
          {part.lines.map((line, index) => (
            <li key={index}>
              <b>{line.speaker}:</b> <span lang="sv">{line.fi}</span>
              <small>{line.en}</small>
            </li>
          ))}
        </ol>
      )}
      {part.words?.length ? (
        <ul className={styles.words}>
          {part.words.map((word) => (
            <li key={word.fi}>
              <b lang="sv">{word.fi}</b> {word.en}
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}

function Part({ part, saved, onChange, onScore }: { part: ComprehensionPart; saved: Saved; onChange: (value: Saved) => void; onScore?: SkillScoreHandler }) {
  const [plays, setPlays] = useState(0);
  const started = useRef<number | null>(null);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const update = (value: Saved) => {
    if (value.checked && !saved.checked) {
      const result = scoreQuestions(part.questions, value);
      if (result.total && onScore) {
        const minutes = Math.max(1, Math.min(60, Math.round((Date.now() - (started.current ?? Date.now())) / 60000)));
        onScore(part.type, Math.round((result.right / result.total) * 100), minutes);
      }
    }
    onChange(value);
  };
  const listening = part.type === "listening";
  return (
    <section className={homeworkStyles.form} aria-labelledby={`${part.id}-title`}>
      <header className={`${homeworkStyles.header} ${listening ? styles.listenHeader : styles.readHeader}`}>
        {listening ? <Headphones size={26} aria-hidden="true" /> : <BookOpen size={26} aria-hidden="true" />}
        <div>
          <span className={sourceStyles.eyebrow}>
            {listening ? "LISTENING" : "READING"} · {part.textType.toUpperCase()}
            {part.type === "reading" && part.minutes ? ` · ABOUT ${part.minutes} MIN` : ""}
          </span>
          <h3 id={`${part.id}-title`} lang="sv">
            {part.title}
          </h3>
          {listening ? (
            <ListeningPart part={part} plays={plays} onPlay={() => setPlays((value) => value + 1)} />
          ) : (
            <p className={styles.tip}>Read the questions first, then look for the answers in the text.</p>
          )}
        </div>
      </header>
      {part.type === "reading" && (
        <article className={homeworkStyles.text} lang="sv">
          <p>{part.text}</p>
        </article>
      )}
      <QuestionList questions={part.questions} saved={saved} onChange={update} />
      {saved.checked && <Transcript part={part} />}
    </section>
  );
}

/** Listening clips and reading texts for one lecture, or a timed mock set. */
export function YkiComprehensionSet({
  parts,
  examMinutes,
  onScore,
}: {
  parts: ComprehensionPart[];
  examMinutes?: number;
  onScore?: SkillScoreHandler;
}) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Record<string, Saved>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is read once after hydration
    setSaved(Object.fromEntries(parts.map((part) => [part.id, loadSaved(storageKey(part.id))])));
  }, [parts]);
  const update = (id: string, value: Saved) => {
    setSaved((current) => ({ ...current, [id]: value }));
    storeSaved(storageKey(id), value);
  };
  const current = parts[index];
  return (
    <div className={sourceStyles.pageSet}>
      {examMinutes ? <ExamTimer minutes={examMinutes} /> : null}
      {parts.length > 1 && (
        <div className={sourceStyles.pageTabs} role="group" aria-label="Listening and reading for this lesson">
          <span className={sourceStyles.eyebrow}>LISTEN AND READ</span>
          {parts.map((part, partIndex) => {
            const state = saved[part.id] ?? emptySaved;
            const result = scoreQuestions(part.questions, state);
            return (
              <button
                type="button"
                key={part.id}
                aria-pressed={index === partIndex}
                className={`${sourceStyles.level} ${index === partIndex ? sourceStyles.levelActive : ""}`}
                onClick={() => setIndex(partIndex)}
              >
                <span>{state.checked ? <Check size={12} aria-label="checked" /> : partIndex + 1}</span>
                {part.type === "listening" ? "Listen: " : "Read: "}
                {part.title}
                {state.checked && result.total > 0 && (
                  <small className={homeworkStyles.tabScore}>
                    {result.right}/{result.total}
                  </small>
                )}
              </button>
            );
          })}
        </div>
      )}
      <Part
        key={current.id}
        part={current}
        saved={saved[current.id] ?? emptySaved}
        onChange={(value) => update(current.id, value)}
        onScore={onScore}
      />
      {parts.length > 1 && index < parts.length - 1 && (
        <button type="button" className={`primary ${sourceStyles.nextStage}`} onClick={() => setIndex(index + 1)}>
          Next: {parts[index + 1].title} →
        </button>
      )}
    </div>
  );
}
