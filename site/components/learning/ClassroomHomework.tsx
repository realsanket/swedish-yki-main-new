"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, ExternalLink, PenLine, RotateCcw, X } from "lucide-react";
import type { ClassroomHomework as Homework, ClassroomHomeworkQuestion as Question } from "@/lib/course-types";
import { normalizeCourseAnswer } from "@/lib/course-progress";
import sourceStyles from "./SourcePagePractice.module.css";
import styles from "./ClassroomHomework.module.css";

type Saved = { answers: Record<string, string>; checked: boolean };
const empty: Saved = { answers: {}, checked: false };
const storageKey = (id: string) => `stigen:homework:${id}`;
/** Ticked options of a `multiple` question are saved as one string, one option per line. */
const SEPARATOR = "\n";

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

const marked = (question: Question) => !!question.answers?.length && !question.writing;
const ticked = (answer = "") => answer.split(SEPARATOR).filter(Boolean);
const wordCount = (text = "") => text.trim().split(/\s+/).filter(Boolean).length;

function isRight(question: Question, answer = "") {
  if (!marked(question) || !normalizeCourseAnswer(answer)) return false;
  const answers = question.answers ?? [];
  if (question.multiple) {
    const chosen = ticked(answer);
    return chosen.length === answers.length && answers.every((value) => chosen.includes(value));
  }
  return answers.some((value) => normalizeCourseAnswer(value) === normalizeCourseAnswer(answer));
}

function score(homework: Homework, saved: Saved) {
  const markable = homework.questions.filter(marked);
  return { right: markable.filter((question) => isRight(question, saved.answers[question.id])).length, total: markable.length };
}

function Feedback({ question, answer }: { question: Question; answer: string }) {
  if (marked(question)) {
    const answers = question.answers ?? [];
    return (
      <p className={styles.feedback} role="status">
        {isRight(question, answer) ? (
          <>
            <Check size={15} aria-hidden="true" /> Right
          </>
        ) : (
          <>
            <X size={15} aria-hidden="true" /> Answer: <b lang="sv">{question.multiple ? answers.join(", ") : answers[0]}</b>
          </>
        )}
      </p>
    );
  }
  return (
    <div className={styles.selfCheck} role="status">
      {question.writing?.points?.length ? (
        <>
          <b>Check your text yourself:</b>
          <ul className={styles.points}>
            {question.writing.points.map((point) => (
              <li key={point}>
                <label>
                  <input type="checkbox" /> {point}
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : (
        !question.model && <span>No answer key. Compare your answer with the text or the episode.</span>
      )}
      {question.model && (
        <p className={styles.model}>
          <b>Model answer:</b> <span lang="sv">{question.model}</span>
        </p>
      )}
    </div>
  );
}

function Answer({
  question,
  index,
  answer,
  disabled,
  onChange,
}: {
  question: Question;
  index: number;
  answer: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  if (question.options) {
    const chosen = question.multiple ? ticked(answer) : [answer];
    const toggle = (option: string) =>
      question.multiple
        ? onChange(
            question
              .options!.filter((value) => (value === option ? !chosen.includes(value) : chosen.includes(value)))
              .join(SEPARATOR),
          )
        : onChange(option);
    return (
      <>
        {question.multiple && <small className={styles.hint}>Tick every right answer.</small>}
        <div className={styles.options} role="group" aria-label={`Question ${index + 1} options`}>
          {question.options.map((option) => (
            <button
              type="button"
              key={option}
              lang="sv"
              aria-pressed={chosen.includes(option)}
              className={chosen.includes(option) ? styles.chosen : ""}
              disabled={disabled}
              onClick={() => toggle(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </>
    );
  }
  if (question.writing || !question.answers?.length) {
    const range = question.writing?.wordRange;
    return (
      <>
        <textarea
          className="field"
          lang="sv"
          rows={question.writing ? 9 : 3}
          aria-label={`Question ${index + 1} answer`}
          value={answer}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={question.writing ? "Skriv din text här" : "Write your answer"}
        />
        {question.writing && (
          <small className={styles.translation}>
            {wordCount(answer)} words{range ? ` · aim for ${range[0]}-${range[1]}` : ""}
          </small>
        )}
      </>
    );
  }
  return (
    <input
      className="field"
      lang="sv"
      aria-label={`Question ${index + 1} answer`}
      value={answer}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Type your answer"
    />
  );
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
  const result = score(homework, saved);
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
          {homework.note && <p className={styles.note}>{homework.note}</p>}
          {homework.links?.length ? (
            <ul className={styles.links}>
              {homework.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} aria-hidden="true" /> {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {homework.texts?.map((text, index) => (
        <article key={index} className={styles.text} lang="sv">
          {text.title && <h4>{text.title}</h4>}
          <p>{text.body}</p>
        </article>
      ))}

      <ol className={styles.questions}>
        {homework.questions.map((question, index) => {
          const answer = saved.answers[question.id] ?? "";
          const state = !saved.checked || !marked(question) ? "" : isRight(question, answer) ? styles.right : styles.wrong;
          const heading = question.part && question.part !== homework.questions[index - 1]?.part;
          return (
            <li key={question.id} className={`${state} ${heading ? styles.withPart : ""}`}>
              {heading && <h4 className={styles.part}>{question.part}</h4>}
              <span className={styles.number}>{question.writing ? <PenLine size={14} aria-hidden="true" /> : index + 1}</span>
              <div className={styles.body}>
                <p className={styles.prompt} lang="sv">
                  {question.prompt}
                </p>
                {question.translation && <small className={styles.translation}>{question.translation}</small>}
                {question.hint && <small className={styles.hint}>{question.hint}</small>}
                <Answer
                  question={question}
                  index={index}
                  answer={answer}
                  disabled={saved.checked}
                  onChange={(value) => set(question.id, value)}
                />
                {saved.checked && <Feedback question={question} answer={answer} />}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className={styles.footer}>
        {saved.checked ? (
          <>
            <p className={styles.score} role="status">
              {result.total ? `${result.right} of ${result.total} right` : `${answered} of ${total} answered`}
              {result.total > 0 && result.total < total && (
                <small> · {total - result.total} to check yourself</small>
              )}
            </p>
            <button type="button" className="secondary" onClick={() => onChange({ ...saved, checked: false })}>
              <PenLine size={15} aria-hidden="true" /> Edit my answers
            </button>
            <button type="button" className="secondary" onClick={() => onChange(empty)}>
              <RotateCcw size={15} aria-hidden="true" /> Start again
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
            const result = score(item, state);
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
                {state.checked && result.total > 0 && (
                  <small className={styles.tabScore}>
                    {result.right}/{result.total}
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
