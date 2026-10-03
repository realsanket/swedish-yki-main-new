"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { SortActivity as SortActivityData } from "@/lib/course-types";
import AudioButton from "../AudioButton";
import { GlossText } from "../GrammarNotes";
import { MarkedWord, seededShuffle } from "./shared";
import styles from "./TeachingActivity.module.css";

/** One word at a time: predict its group, get the reason, move on. */
export default function SortActivity({ activity }: { activity: SortActivityData }) {
  const [round, setRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const order = useMemo(
    () => seededShuffle(activity.items.map((_, index) => index), `${activity.title}:${round}`),
    [activity.items, activity.title, round],
  );
  const bucketLabel = (id: string) => activity.buckets.find((bucket) => bucket.id === id)?.label ?? id;
  const finished = position >= order.length;
  const itemIndex = order[Math.min(position, order.length - 1)];
  const item = activity.items[itemIndex];
  const choice = choices[itemIndex];
  const correctCount = order.filter((index) => choices[index] === activity.items[index].bucket).length;
  const missed = order.filter((index) => choices[index] && choices[index] !== activity.items[index].bucket);

  function restart() {
    setRound((value) => value + 1);
    setPosition(0);
    setChoices({});
  }

  if (finished) {
    return (
      <div className={styles.sortResult} aria-live="polite">
        <b>{correctCount} of {order.length} on the first try</b>
        {activity.summary && <p><GlossText text={activity.summary} /></p>}
        {missed.length > 0 && (
          <ul>
            {missed.map((index) => {
              const missedItem = activity.items[index];
              return (
                <li key={missedItem.fi}>
                  <MarkedWord text={missedItem.fi} mark={missedItem.mark} className={styles.mark} />
                  <span>→ {bucketLabel(missedItem.bucket)}</span>
                  <small><GlossText text={missedItem.why} /></small>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" className="secondary" onClick={restart}>
          <RotateCcw size={15} aria-hidden="true" /> Sort again in a new order
        </button>
      </div>
    );
  }

  return (
    <div className={styles.sort}>
      <div className={styles.sortProgress} aria-hidden="true">
        {order.map((index, step) => (
          <span
            key={index}
            className={
              step === position
                ? styles.current
                : choices[index] === undefined
                  ? ""
                  : choices[index] === activity.items[index].bucket
                    ? styles.right
                    : styles.wrong
            }
          />
        ))}
      </div>
      <div className={styles.sortCard}>
        <span className={styles.counter}>Card {position + 1} of {order.length}</span>
        <p className={styles.sortWord}>
          <MarkedWord text={item.fi} mark={item.mark} className={styles.mark} />
        </p>
        {item.en && <p className={styles.sortMeaning}>{item.en}</p>}
        {activity.audio !== false && !item.fi.includes("___") && (
          <AudioButton text={item.fi} label={`Hear ${item.fi}`} className="icon-button" />
        )}
      </div>
      <div className={styles.buckets} role="group" aria-label="Choose a group">
        {activity.buckets.map((bucket) => {
          const state = !choice
            ? ""
            : bucket.id === item.bucket
              ? styles.right
              : bucket.id === choice
                ? styles.wrong
                : styles.muted;
          return (
            <button
              type="button"
              key={bucket.id}
              className={`${styles.bucket} ${state}`}
              disabled={!!choice}
              onClick={() => setChoices((current) => ({ ...current, [itemIndex]: bucket.id }))}
            >
              <b>{bucket.label}</b>
              {bucket.hint && <small>{bucket.hint}</small>}
            </button>
          );
        })}
      </div>
      {choice && (
        <div className={`${styles.feedback} ${choice === item.bucket ? styles.right : styles.wrong}`} aria-live="polite">
          {choice === item.bucket ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
          <p>
            <b>{choice === item.bucket ? "Yes." : `It is ${bucketLabel(item.bucket)}.`}</b> <GlossText text={item.why} />
          </p>
          <button type="button" className="primary" onClick={() => setPosition((value) => value + 1)}>
            {position + 1 < order.length ? "Next card →" : "See my result →"}
          </button>
        </div>
      )}
    </div>
  );
}
