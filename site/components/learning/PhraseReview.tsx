"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Eye, Mic } from "lucide-react";
import type { ReviewCard } from "@/lib/review-cards";
import type { ReviewRating } from "@/lib/progress";
import AudioButton from "./AudioButton";

export type SaveReview = (cardId: string, rating: ReviewRating, requestId: string) => Promise<void>;

const ratings: Array<{ rating: ReviewRating; label: string; hint: string }> = [
  { rating: "again", label: "Couldn't", hint: "Comes back soon" },
  { rating: "hard", label: "With effort", hint: "Comes back sooner" },
  { rating: "good", label: "I said it", hint: "Comes back later" },
  { rating: "easy", label: "Easily", hint: "Comes back much later" },
];

/**
 * Productive recall: read the English, say the Swedish aloud, then reveal
 * and hear it and rate honestly. Ratings feed the same spaced scheduler as
 * the word bank, so each card returns just before it would be forgotten.
 */
export default function PhraseReview({
  cards,
  onReview,
  onDone,
  doneText = "Review done. These come back when they need you.",
}: {
  cards: ReviewCard[];
  onReview: SaveReview;
  onDone?: () => void;
  doneText?: string;
}) {
  const [queue, setQueue] = useState(() => cards.map((card) => card.id));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const current = cards.find((card) => card.id === queue[index]);

  async function rate(rating: ReviewRating) {
    if (!current || busy) return;
    setBusy(true);
    setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      await onReview(current.id, rating, requestId.current);
      requestId.current = null;
      // A card you could not say comes back once more in this session.
      if (rating === "again") setQueue((ids) => [...ids, current.id]);
      setIndex((value) => value + 1);
      setRevealed(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!current) {
    return (
      <div className="phrase-review phrase-review-done" role="status">
        <CheckCircle2 size={22} aria-hidden="true" />
        <p>{doneText}</p>
        {onDone && (
          <button type="button" className="secondary" onClick={onDone}>
            Close review
          </button>
        )}
      </div>
    );
  }

  const isReturn = current.kind === "return";
  return (
    <div className="phrase-review">
      <div className="phrase-review-meta">
        <span className="badge">{isReturn ? "From memory" : `Lecture ${current.lectureNumber}`}</span>
        <span className="help-text">
          Card {Math.min(index + 1, queue.length)} of {queue.length}
        </span>
      </div>
      <div className="phrase-review-card">
        <span className="small-label">{isReturn ? "SAY IT FROM MEMORY" : "SAY IT IN SWEDISH"}</span>
        <h3>{current.prompt}</h3>
        {!revealed ? (
          <>
            <p className="help-text">
              <Mic size={14} aria-hidden="true" /> Say it aloud first, even if you are unsure. Then check.
            </p>
            <button type="button" className="primary" onClick={() => setRevealed(true)}>
              <Eye size={16} aria-hidden="true" /> Show the Swedish
            </button>
          </>
        ) : (
          <>
            <p className="phrase-review-answer" lang="sv">{current.answer}</p>
            <AudioButton text={current.answer} label="Hear it" slow className="secondary" />
            <p className="help-text">How did your version go?</p>
            <div className="phrase-review-ratings" role="group" aria-label="Rate your recall">
              {ratings.map((item) => (
                <button type="button" key={item.rating} disabled={busy} onClick={() => void rate(item.rating)}>
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {error && <p className="lecture-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
