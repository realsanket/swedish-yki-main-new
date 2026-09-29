"use client";

import Image from "next/image";
import { BookOpenText, EyeOff, Headphones, Volume2 } from "lucide-react";
import { useState } from "react";
import type { SourcePagePractice as SourcePagePracticeData } from "@/lib/course-types";
import { storyCharacterForSpeaker } from "@/lib/story-world";
import AudioButton from "./AudioButton";

type PracticeMode = "listen" | "read" | "recall";

const modes: Array<{ id: PracticeMode; label: string; icon: typeof Headphones }> = [
  { id: "listen", label: "Look & listen", icon: Headphones },
  { id: "read", label: "Read the turns", icon: BookOpenText },
  { id: "recall", label: "Cover & recall", icon: EyeOff },
];

export default function SourcePagePractice({ practice }: { practice: SourcePagePracticeData }) {
  const [mode, setMode] = useState<PracticeMode>("listen");
  const segments = practice.lines.map((line) => ({
    text: line.fi,
    speaker: storyCharacterForSpeaker(line.voice)?.name ?? "Henrik",
    language: "sv" as const,
  }));

  return (
    <section className="source-page-practice" aria-labelledby="source-page-practice-title">
      <header>
        <div>
          <span>TEXTBOOK PAGE PRACTICE</span>
          <h3 id="source-page-practice-title">{practice.title}</h3>
          <p>Use the original page after the adapted Elin–Alex scene. Listen first, read second, then cover the dialogue and rebuild it from meaning.</p>
        </div>
        <AudioButton
          text={practice.lines.map((line) => line.fi).join(" ")}
          segments={segments}
          label="Hear the textbook dialogue"
          className="secondary"
        />
      </header>

      <nav aria-label="Textbook page practice modes">
        {modes.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.id}
              className={mode === item.id ? "active" : ""}
              aria-current={mode === item.id ? "step" : undefined}
              onClick={() => setMode(item.id)}
            >
              <span>{index + 1}</span>
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className={`source-page-practice-layout mode-${mode}`}>
        <figure>
          <Image
            src={practice.image}
            alt={practice.imageAlt}
            width={1067}
            height={1667}
            sizes="(max-width: 760px) 92vw, 390px"
          />
          {mode === "recall" && (
            <div className="source-page-cover">
              <EyeOff size={28} aria-hidden="true" />
              <b>Page covered</b>
              <span>Rebuild the conversation from the six cues.</span>
            </div>
          )}
          <figcaption>Private course reference · textbook physical page 4</figcaption>
        </figure>

        <div className="source-page-practice-work">
          {mode === "listen" && (
            <div className="source-listen-task">
              <span>FIRST PASS</span>
              <h4>Listen without following every word.</h4>
              <ol>
                <li>Who speaks first?</li>
                <li>What compliment do you hear?</li>
                <li>Which person lives in Finland now?</li>
              </ol>
              <div className="source-focus-list">
                <b>Sound clues printed on the page</b>
                <div>{practice.focus.map((item) => <span key={item}>{item}</span>)}</div>
              </div>
            </div>
          )}

          {mode === "read" && (
            <div className="source-dialogue-lines">
              {practice.lines.map((line, index) => (
                <article key={`${line.speaker}-${index}`}>
                  <span>{line.speaker}</span>
                  <div>
                    <p lang="sv">{line.fi}</p>
                    <details>
                      <summary>English</summary>
                      <p>{line.en}</p>
                    </details>
                  </div>
                  <AudioButton
                    text={line.fi}
                    speaker={storyCharacterForSpeaker(line.voice)?.name ?? "Henrik"}
                    language="sv"
                    label={`Hear ${line.speaker}'s line`}
                    className="icon-button"
                  />
                </article>
              ))}
            </div>
          )}

          {mode === "recall" && (
            <div className="source-recall-cues">
              <span>NO TEXT · USE THE MEANING</span>
              <h4>Rebuild the six turns aloud.</h4>
              <ol>
                {practice.recallCues.map((cue) => <li key={cue}>{cue}</li>)}
              </ol>
              <AudioButton
                text={practice.lines.map((line) => line.fi).join(" ")}
                segments={segments}
                label="Check by listening again"
                className="secondary"
              />
            </div>
          )}

          {practice.note && (
            <p className="source-language-note"><Volume2 size={15} aria-hidden="true" /><span><b>Produce naturally:</b> {practice.note}</span></p>
          )}
        </div>
      </div>
    </section>
  );
}
