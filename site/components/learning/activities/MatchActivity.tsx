"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import type { MatchActivity as MatchActivityData } from "@/lib/course-types";
import AudioButton from "../AudioButton";
import { GlossText } from "../GrammarNotes";
import { seededShuffle } from "./shared";
import styles from "./TeachingActivity.module.css";

type Side = "left" | "right";

/** Pair two columns; each finished pair becomes a sentence to say aloud. */
export default function MatchActivity({ activity }: { activity: MatchActivityData }) {
  const [round, setRound] = useState(0);
  const [matched, setMatched] = useState<number[]>([]);
  const [selected, setSelected] = useState<{ side: Side; index: number } | null>(null);
  const [miss, setMiss] = useState<{ left: number; right: number } | null>(null);
  const rightOrder = useMemo(
    () => seededShuffle(activity.pairs.map((_, index) => index), `${activity.title}:${round}`),
    [activity.pairs, activity.title, round],
  );
  const complete = matched.length === activity.pairs.length;

  function choose(side: Side, index: number) {
    setMiss(null);
    if (!selected || selected.side === side) {
      setSelected({ side, index });
      return;
    }
    const left = side === "left" ? index : selected.index;
    const right = side === "right" ? index : selected.index;
    setSelected(null);
    // Pairs are matched by their text so duplicated right-hand values stay valid.
    if (activity.pairs[left].right === activity.pairs[right].right) setMatched((current) => [...current, left]);
    else setMiss({ left, right });
  }

  const sentenceFor = (index: number) =>
    activity.sentence
      ?.replaceAll("{left}", activity.pairs[index].left)
      .replaceAll("{right}", activity.pairs[index].right);

  const rightIsMatched = (index: number) =>
    matched.some((left) => activity.pairs[left].right === activity.pairs[index].right);

  return (
    <div className={styles.match}>
      <div className={styles.matchColumns}>
        {(["left", "right"] as const).map((side) => (
          <div key={side} role="group" aria-label={side === "left" ? activity.leftLabel : activity.rightLabel}>
            <span className={styles.columnLabel}>{side === "left" ? activity.leftLabel : activity.rightLabel}</span>
            {(side === "left" ? activity.pairs.map((_, index) => index) : rightOrder).map((index) => {
              const done = side === "left" ? matched.includes(index) : rightIsMatched(index);
              const isSelected = selected?.side === side && selected.index === index;
              const isMiss = miss?.[side] === index;
              return (
                <button
                  type="button"
                  key={`${side}-${index}`}
                  lang="sv"
                  disabled={done}
                  aria-pressed={isSelected}
                  className={[styles.matchItem, done ? styles.right : "", isSelected ? styles.selected : "", isMiss ? styles.wrong : ""].filter(Boolean).join(" ")}
                  onClick={() => choose(side, index)}
                >
                  {done && <Check size={14} aria-hidden="true" />}
                  {side === "left" ? activity.pairs[index].left : activity.pairs[index].right}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className={styles.matchStatus} aria-live="polite">
        {miss
          ? "Not that pair. Try again."
          : complete
            ? "All pairs matched."
            : `${matched.length} of ${activity.pairs.length} matched. Choose one item on each side.`}
      </p>
      {matched.length > 0 && activity.sentence && (
        <div className={styles.sayList}>
          <b>Say each finished pair aloud</b>
          {matched.map((index) => (
            <div key={index}>
              <p lang="sv">{sentenceFor(index)}</p>
              {activity.pairs[index].note && <small>{activity.pairs[index].note}</small>}
              <AudioButton text={sentenceFor(index) ?? ""} label={`Hear: ${sentenceFor(index)}`} className="icon-button" />
            </div>
          ))}
        </div>
      )}
      {matched.length > 0 && !activity.sentence && activity.pairs.some((pair) => pair.note) && (
        <div className={styles.sayList}>
          <b>Why each pair fits</b>
          {matched.map((index) =>
            activity.pairs[index].note ? (
              <div key={index}>
                <p>{activity.pairs[index].left} → {activity.pairs[index].right}</p>
                <small>{activity.pairs[index].note}</small>
              </div>
            ) : null,
          )}
        </div>
      )}
      {complete && (
        <div className={styles.sortResult}>
          {activity.pattern && <p><b>The pattern:</b> <GlossText text={activity.pattern} /></p>}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setMatched([]);
              setSelected(null);
              setMiss(null);
              setRound((value) => value + 1);
            }}
          >
            <RotateCcw size={15} aria-hidden="true" /> Match again
          </button>
        </div>
      )}
    </div>
  );
}
