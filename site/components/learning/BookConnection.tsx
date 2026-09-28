"use client";

import { useId } from "react";
import { ArrowRight, BookOpen, Headphones, Images } from "lucide-react";
import Image from "next/image";
import type { BookConnection as BookConnectionData } from "@/lib/course-types";
import { bookReviewForNumber } from "@/lib/book-reviews";

export default function BookConnection({
  connection,
  onOpenChapterReview,
}: {
  connection: BookConnectionData;
  onOpenChapterReview: (chapterNumber: number) => void;
}) {
  const titleId = useId();
  const chapterMatch = connection.chapter.match(/^CHAPTER ([1-9])\b/);
  const chapterNumber = chapterMatch ? Number(chapterMatch[1]) : null;
  const review = chapterNumber ? bookReviewForNumber(chapterNumber) : null;

  function stopOtherAudio(current: HTMLAudioElement) {
    window.dispatchEvent(new Event("stigen:stop-audio"));
    document.querySelectorAll<HTMLAudioElement>("audio.book-audio").forEach((item) => {
      if (item !== current) item.pause();
    });
  }

  return (
    <section className="book-connection" aria-labelledby={titleId}>
      <header>
        <BookOpen size={22} />
        <div>
          <p className="eyebrow">BOOK CONNECTION · {connection.chapter}</p>
          <h3 id={titleId}>{connection.title}</h3>
          <p>{connection.story}</p>
        </div>
      </header>

      {(connection.image || connection.audio?.length) && (
        <div className={"book-connection-media " + (!connection.image ? "audio-only" : "")}>
          {connection.image && (
            <figure>
              <div className="book-image-frame">
                <Image
                  src={connection.image.src}
                  alt={connection.image.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 520px"
                />
              </div>
              {connection.image.caption && (
                <figcaption>{connection.image.caption}</figcaption>
              )}
            </figure>
          )}
          {!!connection.audio?.length && (
            <div className="book-audio-list">
              <p className="book-audio-heading">
                <Headphones size={17} /> Original chapter audio
              </p>
              {connection.audio.map((track) => (
                <div className="book-audio-track" key={track.src}>
                  <b>{track.label}</b>
                  {track.description && <p>{track.description}</p>}
                  <audio
                    className="book-audio"
                    controls
                    preload="metadata"
                    aria-label={track.label}
                    onPlay={(event) => stopOtherAudio(event.currentTarget)}
                  >
                    <source src={track.src} type="audio/mpeg" />
                    Your browser does not support this audio recording.
                  </audio>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="book-connection-task">
        <b>Bring it into Alex&apos;s story</b>
        <ol>
          {connection.activities.map((activity) => (
            <li key={activity}>{activity}</li>
          ))}
        </ol>
        {connection.answerSupport && (
          <details>
            <summary>Check the listening support</summary>
            <p>{connection.answerSupport}</p>
          </details>
        )}
      </div>

      {!!connection.gallery?.length && (
        <details className="book-gallery">
          <summary>
            <Images size={17} /> Explore {connection.gallery.length} original book
            {connection.gallery.length === 1 ? " image" : " images"}
          </summary>
          <div className="book-gallery-grid">
            {connection.gallery.map((item) => (
              <figure key={item.src}>
                <div className="book-gallery-image">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 620px) 80vw, (max-width: 960px) 38vw, 260px"
                  />
                </div>
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </details>
      )}

      <div className="book-source-links">
        {review && (
          <button
            type="button"
            className="text-button"
            onClick={() => onOpenChapterReview(review.number)}
          >
            <BookOpen size={14} /> Open Chapter {String(review.number).padStart(2, "0")} inside your path
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </section>
  );
}
