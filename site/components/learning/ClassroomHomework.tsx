"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, RotateCcw, X } from "lucide-react";
import type { ClassroomHomework as Homework } from "@/lib/course-types";
import { normalizeCourseAnswer } from "@/lib/course-progress";
import sourceStyles from "./SourcePagePractice.module.css";
import styles from "./ClassroomHomework.module.css";

type Saved = { answers: Record<string, string>; checked: boolean };
const empty: Saved = { answers: {}, checked: false };
const storageKey = (id: string) => `stigen:homework:${id}`;

function load(id: string): Saved {
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    return raw ? { ...empty, ...(JSON.parse(raw) as Saved) } : empty;
  } catch {
    return empty;
  }
}

function save(id: string, value: Saved) {
  try {
    window.localStorage.setItem(storageKey(id), JSON.stringify(value));
  } catch {
    /* Private windows may block storage; the form still works for this visit. */
  }
}

const isRight = (question: Homework["questions"][number], answer = "") =>
  !!normalizeCourseAnswer(answer) &&
  question.answers.some((value) => normalizeCourseAnswer(value) === normalizeCourseAnswer(answer));

function score(homework: Homework, saved: Saved) {
  return homework.questions.filter((question) => isRight(question, saved.answers[question.id])).length;
}

function HomeworkForm({
  homework,
  saved,
  onChange,
}: {
  homework: Homework;
  saved: Saved;
  onChange: (value: Saved) => void;
}) {
  const answered = homework.questions.filter((question) => normalizeCourseAnswer(saved.answers[question.id] ?? "")).length;
  const total = homework.questions.length;
  const right = score(homework, saved);
  const set = (id: string, value: string) => onChange({ answers: { ...saved.answers, [id]: value }, checked: false });

  return (
    <section className={styles.form} aria-labelledby={`${homework.id}-title`}>
      <header className={styles.header}>
        <ClipboardList size={26} aria-hidden="true" />
        <div>
          <span className={sourceStyles.eyebrow}>
            CLASSROOM HOMEWORK {homework.item} · POSTED {homework.posted.toUpperCase()}
          </span>
          <h3 id={`${homework.id}-title`}>{homework.title}</h3>
          <p>{homework.instructions}</p>
        </div>
      </header>

      <ol className={styles.questions}>
        {homework.questions.map((question, index) => {
          const answer = saved.answers[question.id] ?? "";
          const correct = saved.checked && isRight(question, answer);
          const wrong = saved.checked && !correct;
          return (
            <li key={question.id} className={correct ? styles.right : wrong ? styles.wrong : ""}>
              <span className={styles.number}>{index + 1}</span>
              <div className={styles.body}>
                <p className={styles.prompt} lang="sv">
                  {question.prompt}
                </p>
                {question.translation && <small className={styles.translation}>{question.translation}</small>}
                {question.hint && <small className={styles.hint}>{question.hint}</small>}
                {question.options ? (
                  <div className={styles.options} role="group" aria-label={`Question ${index + 1} options`}>
                    {question.options.map((option) => (
                      <button
                        type="button"
                        key={option}
                        lang="sv"
                        aria-pressed={answer === option}
                        className={answer === option ? styles.chosen : ""}
                        disabled={saved.checked}
                        onClick={() => set(question.id, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    className="field"
                    lang="sv"
                    aria-label={`Question ${index + 1} answer`}
                    value={answer}
                    disabled={saved.checked}
                    onChange={(event) => set(question.id, event.target.value)}
                    placeholder="Type your answer"
                  />
                )}
                {saved.checked && (
                  <p className={styles.feedback} role="status">
                    {correct ? (
                      <>
                        <Check size={15} aria-hidden="true" /> Right
                      </>
                    ) : (
                      <>
                        <X size={15} aria-hidden="true" /> Answer: <b lang="sv">{question.answers[0]}</b>
                      </>
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className={styles.footer}>
        {saved.checked ? (
          <>
            <p className={styles.score} role="status">
              {right} of {total} right
            </p>
            <button type="button" className="secondary" onClick={() => onChange(empty)}>
              <RotateCcw size={15} aria-hidden="true" /> Try again
            </button>
          </>
        ) : (
          <>
            <p className={styles.progress}>
              {answered} of {total} answered
            </p>
            <button
              type="button"
              className="primary"
              disabled={!answered}
              onClick={() => onChange({ ...saved, checked: true })}
            >
              Check my answers
            </button>
          </>
        )}
      </footer>
      {homework.fixes?.length ? (
        <details className={styles.fixes}>
          <summary>Small fixes to the original form</summary>
          <ul>
            {homework.fixes.map((fix) => (
              <li key={fix}>{fix}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

/** The teacher's homework for one lecture: one form, or tabs when there are several. */
export function ClassroomHomeworkSet({ homework }: { homework: Homework[] }) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Record<string, Saved>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is read once after hydration
    setSaved(Object.fromEntries(homework.map((item) => [item.id, load(item.id)])));
  }, [homework]);

  const update = (id: string, value: Saved) => {
    setSaved((current) => ({ ...current, [id]: value }));
    save(id, value);
  };
  const current = homework[index];

  return (
    <div className={sourceStyles.pageSet}>
      {homework.length > 1 && (
        <div className={sourceStyles.pageTabs} role="group" aria-label="Teacher's homework for this lesson">
          <span className={sourceStyles.eyebrow}>TEACHER&apos;S HOMEWORK FOR THIS LESSON</span>
          {homework.map((item, itemIndex) => {
            const state = saved[item.id] ?? empty;
            return (
              <button
                type="button"
                key={item.id}
                aria-pressed={index === itemIndex}
                className={`${sourceStyles.level} ${index === itemIndex ? sourceStyles.levelActive : ""}`}
                onClick={() => setIndex(itemIndex)}
              >
                <span>{state.checked ? <Check size={12} aria-label="checked" /> : itemIndex + 1}</span>
                {item.title}
                {state.checked && (
                  <small className={styles.tabScore}>
                    {score(item, state)}/{item.questions.length}
                  </small>
                )}
              </button>
            );
          })}
        </div>
      )}
      <HomeworkForm
        key={current.id}
        homework={current}
        saved={saved[current.id] ?? empty}
        onChange={(value) => update(current.id, value)}
      />
      {homework.length > 1 && index < homework.length - 1 && (
        <button type="button" className={`primary ${sourceStyles.nextStage}`} onClick={() => setIndex(index + 1)}>
          Next homework: {homework[index + 1].title} →
        </button>
      )}
    </div>
  );
}
