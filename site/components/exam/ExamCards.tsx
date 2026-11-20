"use client";

import { useMemo, useState } from "react";
import { dueCards } from "@/lib/exam-state";
import type { ExamUnit } from "@/lib/exam-types";
import { playSpeech, useSpeech } from "./speech";
import { useContent, type ExamApi } from "./useExam";
import styles from "./exam.module.css";

type ContentCard = { id: string; front: string; back: string; unitKey: string };
const REVIEW_SECONDS = 8 * 60;

/** A side is read aloud only if it is Swedish. This is a simple check, good enough for the course's own cards. */
function looksSwedish(text: string): boolean {
  return /[åäö]/i.test(text) || /^(jag|du|vad|var|vilka|hur|och|hälsningar|tack|hej)\b/i.test(text.trim());
}

function Hear({ text }: { text: string }) {
  const key = `card:${text}`;
  const { state } = useSpeech(key);
  return <button type="button" className="secondary" onClick={() => void playSpeech(key, { text })}>{state === "idle" ? "Hear it" : "Stop"}</button>;
}

/** Review of the cards from finished days. It stops after 8 minutes, finished or not. */
export default function ExamCards({ exam, openDay }: { units: ExamUnit[]; exam: ExamApi; openDay: (key: string) => void }) {
  const content = useContent<ContentCard[]>("kind=cards");
  const [now] = useState(() => Date.now());
  const [start] = useState(() => Date.now());
  const [shown, setShown] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [stopped, setStopped] = useState(false);
  const lookup = useMemo(() => {
    const map = new Map((content.data ?? []).map((c) => [c.id, c]));
    return (id: string) => map.get(id);
  }, [content.data]);
  const state = exam.state;
  if (!state) return <p className={styles.muted}>{exam.loading ? "Loading…" : "Unavailable."}</p>;
  const queue = content.data ? dueCards(state, lookup, now) : [];
  const upcoming = Object.values(state.cards).filter((c) => c.due > now).length;
  const card = queue[0];
  const timeUp = stopped;

  async function rate(rating: "again" | "hard" | "good" | "easy") {
    if (!card) return;
    const problem = await exam.act({ type: "reviewCard", cardId: card.id, rating, eventId: `rv-${card.id}-${crypto.randomUUID()}` });
    if (problem) return;
    setShown(false);
    setReviewed((n) => n + 1);
    if (Date.now() - start > REVIEW_SECONDS * 1000) setStopped(true);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXAM COURSE · REVIEW</p>
          <h1>Exam cards</h1>
          <p>Say the answer out loud before you look. Cards come back after 1, 3, 7, 14 and 30 days. Review stops after 8 minutes.</p>
        </div>
      </div>
      {!content.data && !content.error ? <p className={styles.muted}>Loading the cards…</p> : null}
      {content.error ? <p role="alert" className={styles.error}>{content.error}</p> : null}
      {card && !timeUp ? (
        <div className={`${styles.card} ${styles.flash}`} aria-live="polite">
          <p className={styles.muted}>{queue.length} card{queue.length === 1 ? "" : "s"} due{card.unitKey ? <> · from <button type="button" className="text-button" onClick={() => openDay(card.unitKey!)}>Day {card.unitKey}</button></> : null}</p>
          <div className={styles.big}>{card.front}</div>
          {looksSwedish(card.front) ? <div className={styles.row} style={{ justifyContent: "center" }}><Hear text={card.front} /></div> : null}
          {!shown ? <button type="button" className="primary" onClick={() => setShown(true)}>Show the answer</button> : (
            <>
              <div className={styles.big}>{card.back}</div>
              {looksSwedish(card.back) ? <div className={styles.row} style={{ justifyContent: "center" }}><Hear text={card.back} /></div> : null}
              <div className={styles.rate}>
                <button type="button" className="secondary" onClick={() => void rate("again")}>Again</button>
                <button type="button" className="secondary" onClick={() => void rate("hard")}>Hard</button>
                <button type="button" className="secondary" onClick={() => void rate("good")}>Good</button>
                <button type="button" className="secondary" onClick={() => void rate("easy")}>Easy</button>
              </div>
            </>
          )}
        </div>
      ) : content.data ? (
        <div className={styles.card}>
          <h3>{timeUp && queue.length ? "Eight minutes are up." : "No cards are due right now."}</h3>
          <p className={styles.muted}>{reviewed ? `You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. ` : ""}{queue.length ? `${queue.length} are still waiting; they will be here tomorrow.` : upcoming ? `${upcoming} card${upcoming === 1 ? " is" : "s are"} scheduled for later. Cards from a day join the review the day after you log that day.` : "Log Day 1 and its cards will appear here tomorrow."}</p>
        </div>
      ) : null}
    </>
  );
}
