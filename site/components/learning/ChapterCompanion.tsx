"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Loader2 } from "lucide-react";
import type { BookReview } from "@/lib/book-reviews";

export default function ChapterCompanion({
  review,
  returnLabel,
  continueLabel,
  onReturn,
  onContinue,
}: {
  review: BookReview;
  returnLabel: string;
  continueLabel: string | null;
  onReturn: () => void;
  onContinue: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="course-space chapter-companion-space">
      <header className="chapter-companion-toolbar">
        <button type="button" className="text-button" onClick={onReturn}>
          <ArrowLeft size={16} /> {returnLabel}
        </button>
        <span>Optional source companion · your episode stays saved</span>
      </header>

      <section className="chapter-companion-intro" aria-labelledby="chapter-companion-title">
        <div className="chapter-companion-marker" aria-hidden="true">
          <BookOpen size={25} />
          <span>0{review.number}</span>
        </div>
        <div>
          <p className="eyebrow">COMPANION SCENE · SUOMEN MESTARI 1</p>
          <h1 id="chapter-companion-title">
            {review.title}
          </h1>
          <p>{review.storyBridge}</p>
          <p className="chapter-companion-focus">
            <b>Use it for:</b> {review.focus}
          </p>
        </div>
        {continueLabel && (
          <button type="button" className="primary" onClick={onContinue}>
            {continueLabel} <ArrowRight size={17} />
          </button>
        )}
      </section>

      <section className="chapter-companion-reader" aria-labelledby="chapter-source-title">
        <header>
          <div>
            <p className="eyebrow">FULL CHAPTER REFERENCE</p>
            <h2 id="chapter-source-title">Read, listen, and return when you need it.</h2>
            <p>
              This is reference material, not another task or score. It stays
              in this course window while you explore it.
            </p>
          </div>
          {!loaded && (
            <span className="chapter-companion-loading" role="status">
              <Loader2 size={16} className="animate-spin" /> Loading chapter
            </span>
          )}
        </header>
        <iframe
          className="chapter-companion-frame"
          src={review.href}
          title={`Complete reference for Chapter ${review.number}: ${review.title}`}
          onLoad={() => setLoaded(true)}
        />
      </section>

      <footer className="chapter-companion-footer">
        <button type="button" className="secondary" onClick={onReturn}>
          <ArrowLeft size={16} /> {returnLabel}
        </button>
        {continueLabel && (
          <button type="button" className="primary" onClick={onContinue}>
            {continueLabel} <ArrowRight size={17} />
          </button>
        )}
      </footer>
    </div>
  );
}
