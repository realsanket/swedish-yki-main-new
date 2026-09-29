"use client";

import { useState } from "react";
import { Check, HelpCircle, RotateCcw, X } from "lucide-react";
import type { QuestionGapActivity as QuestionGapActivityData } from "@/lib/course-types";
import { storyCharacterForSpeaker } from "@/lib/story-world";
import AudioButton from "../AudioButton";
import { GlossText } from "../GrammarNotes";
import { seededShuffle } from "./shared";
import styles from "./TeachingActivity.module.css";

/**
 * Reveal a card one fact at a time by asking the question that would really
 * get that fact. The answerer replies aloud once the question is right.
 */
export default function QuestionGapActivity({ activity }: { activity: QuestionGapActivityData }) {
  const [round, setRound] = useState(0);
  const [active, setActive] = useState(0);
  const [solved, setSolved] = useState<number[]>([]);
  const [misses, setMisses] = useState<Record<number, string[]>>({});
  const answerer = storyCharacterForSpeaker(activity.answerer)?.name ?? "Henrik";
  const gap = activity.gaps[active];
  const complete = solved.length === activity.gaps.length;
  const firstTry = activity.gaps.filter((_, index) => solved.includes(index) && !misses[index]?.length).length;

  function ask(option: string) {
    if (option === gap.answer) {
      const next = activity.gaps.findIndex((_, index) => index !== active && !solved.includes(index));
      setSolved((current) => [...current, active]);
      if (next >= 0) setActive(next);
      return;
    }
    setMisses((current) => ({ ...current, [active]: [...(current[active] ?? []), option] }));
  }

  return (
    <div className={styles.gap}>
      <div className={styles.gapCard}>
        <div className={styles.gapCardHead}>
          <b>{activity.card.title}</b>
          {activity.card.subtitle && <small>{activity.card.subtitle}</small>}
        </div>
        <ul>
          {activity.gaps.map((item, index) => {
            const isSolved = solved.includes(index);
            return (
              <li key={`${item.about}-${item.field}`} className={index === active && !isSolved ? styles.gapActive : ""}>
                <span className={styles.gapAbout}>{item.about}</span>
                <span className={styles.gapField}>{item.field}</span>
                {isSolved ? (
                  <span className={styles.gapReply}>
                    <span lang="sv">{item.reply.fi}</span>
                    <AudioButton text={item.reply.fi} speaker={answerer} label={`Hear: ${item.reply.fi}`} className="icon-button" />
                  </span>
                ) : (
                  <button type="button" className={styles.gapHidden} onClick={() => setActive(index)}>
                    <HelpCircle size={15} aria-hidden="true" /> ask
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {complete ? (
        <div className={styles.sortResult} aria-live="polite">
          <b>Card complete: {firstTry} of {activity.gaps.length} questions right on the first try</b>
          {activity.summary && <p><GlossText text={activity.summary} /></p>}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setRound((value) => value + 1);
              setActive(0);
              setSolved([]);
              setMisses({});
            }}
          >
            <RotateCcw size={15} aria-hidden="true" /> Ask again
          </button>
        </div>
      ) : (
        <div className={styles.gapAsk}>
          <p>
            You want to know <b>{gap.field.toLocaleLowerCase("en")}</b> for <b>{gap.about}</b>. Which question do you ask {activity.answerer}?
          </p>
          <div className={styles.quizOptions} role="group" aria-label="Choose your question">
            {seededShuffle(gap.options, `${gap.about}:${gap.field}:${round}`).map((option) => {
              const missed = misses[active]?.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  lang="sv"
                  disabled={missed}
                  className={`${styles.gapOption} ${missed ? styles.wrong : ""}`}
                  onClick={() => ask(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {!!misses[active]?.length && (
            <div className={`${styles.feedback} ${styles.wrong}`} aria-live="polite">
              <X size={17} aria-hidden="true" />
              <p>{activity.answerer} does not understand that question yet. <GlossText text={gap.why} /></p>
            </div>
          )}
          {solved.length > 0 && !misses[active]?.length && (
            <p className={styles.gapHint}>
              <Check size={15} aria-hidden="true" /> {solved.length} of {activity.gaps.length} filled. Play each answer to hear it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
