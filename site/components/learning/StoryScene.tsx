"use client";

import { MessageCircleMore, Volume2 } from "lucide-react";
import { useId, useState } from "react";
import type { CourseLecture } from "@/lib/course";
import { storyCharacterForSpeaker, type StoryChapter } from "@/lib/story-world";
import AudioButton from "./AudioButton";
import { StoryAvatar } from "./StoryAvatar";

export default function StoryScene({
  dialogue,
  chapter,
  title = "Listen before you read",
  eyebrow = "LISTEN & NOTICE",
  instructions,
  initiallyOpen = false,
}: {
  dialogue: NonNullable<CourseLecture["dialogue"]>;
  chapter?: StoryChapter;
  title?: string;
  eyebrow?: string;
  instructions?: string;
  initiallyOpen?: boolean;
}) {
  const titleId = useId();
  const [showTextSupport, setShowTextSupport] = useState(initiallyOpen);

  return (
    <section className="story-scene" aria-labelledby={titleId}>
      <header className="story-scene-header">
        <span className="story-scene-icon" aria-hidden="true">
          <MessageCircleMore size={22} />
        </span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 id={titleId}>{title}</h3>
          <p>
            {instructions ?? (chapter
              ? `${chapter.setting}. Predict the situation, listen once for the main idea, then listen again for one detail.`
              : "Predict the situation, listen once for the main idea, then listen again for one detail.")}
          </p>
        </div>
        <div className="story-scene-actions">
          <AudioButton
            text={dialogue.map((line) => line.fi).join(" ")}
            segments={dialogue.map((line) => ({
              text: line.fi,
              speaker: storyCharacterForSpeaker(line.speaker)?.name ?? "Henrik",
              language: "sv",
            }))}
            label="Listen once"
            className="story-scene-play"
          />
          <button
            type="button"
            className="text-button"
            aria-expanded={showTextSupport}
            onClick={() => setShowTextSupport((visible) => !visible)}
          >
            {showTextSupport ? "Hide text support" : "Show text support"}
          </button>
        </div>
      </header>
      {showTextSupport ? (
        <div className="story-scene-lines">
          {dialogue.map((line, index) => (
            <article className="story-line" key={`${line.speaker}-${index}`}>
              <StoryAvatar name={line.speaker} size={50} />
              <div className="story-line-copy">
                <span>{line.speaker}</span>
                <p lang="sv">{line.fi}</p>
                <details>
                  <summary>English support</summary>
                  <div className="story-line-translation">
                    <p>{line.en}</p>
                    <AudioButton
                      text={line.en}
                      speaker={storyCharacterForSpeaker(line.speaker)?.name ?? "Henrik"}
                      language="en"
                      label={`Hear ${line.speaker} in English`}
                      className="icon-button"
                    />
                  </div>
                </details>
              </div>
              <AudioButton
                text={line.fi}
                speaker={storyCharacterForSpeaker(line.speaker)?.name ?? "Henrik"}
                language="sv"
                label={`Hear ${line.speaker}'s line`}
                className="icon-button"
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="story-scene-predict">
          <b>Before the text:</b> Who is speaking? Where might they be? What is one word or detail you hear?
        </div>
      )}
      <p className="story-scene-tip">
        <Volume2 size={15} /> Replay after text support, then answer one turn
        aloud before opening the English.
      </p>
    </section>
  );
}
