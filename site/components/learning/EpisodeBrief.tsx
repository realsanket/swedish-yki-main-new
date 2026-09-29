import Image from "next/image";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { CourseLecture } from "@/lib/course";
import {
  storyArtForLecture,
  storyObjectForLecture,
  type StoryChapter,
} from "@/lib/story-world";
import AudioButton from "./AudioButton";
import { StoryAvatar, StoryCast } from "./StoryAvatar";

type Props = {
  lecture: CourseLecture;
  chapter: StoryChapter;
  previousTitle?: string;
};

export default function EpisodeBrief({
  lecture,
  chapter,
  previousTitle,
}: Props) {
  const mission = lecture.objectives[0] ?? lecture.summary;
  const ruleSection = lecture.sections.find((section) => section.kind === "rule");
  const isPhrase = (fi: string) => /[\s!?.]/.test(fi);
  const phraseCount = lecture.words.filter((word) => isPhrase(word.fi)).length;
  const ruleCount = lecture.sections.filter((section) => section.kind === "rule").length;
  const byTheEnd = lecture.route?.expectedOutput ?? lecture.takeaways[0];
  const previouslyText = previousTitle
    ? `The last episode was “${previousTitle}.”`
    : lecture.number === 1
      ? "First lesson. Nothing to bring back yet — begin with four introduction chunks, then hear the sound patterns in familiar words."
      : "Alex has arrived at the first community Swedish class.";

  if (lecture.number === 1) {
    const chunks = [
      ["NAME", "Jag heter …", "My name is …"],
      ["HOME NOW", "Jag bor i …", "I live in …"],
      ["ORIGIN", "Jag kommer från …", "I come from …"],
      ["LANGUAGES", "Jag talar …", "I speak …"],
    ] as const;

    return (
      <section className="lesson-one-brief" aria-labelledby="episode-brief-title">
        <div className="lesson-one-brief-main">
          <div className="lesson-one-brief-copy">
            <div className="lesson-one-brief-meta">
              <span>LEKTION 1</span>
              <span>13 APRIL 2026</span>
            </div>
            <p className="lesson-one-kicker">YOUR FIRST SWEDISH CONVERSATION</p>
            <h1 id="episode-brief-title">Hej! Vad heter du?</h1>
            <p className="lesson-one-lede">
              Hear it, understand it, then make it yours. Grammar names can wait.
            </p>
            <div className="lesson-one-start-line">
              <div>
                <span>START WITH ONE LINE</span>
                <p lang="sv">Hej! Jag heter Alex.</p>
                <small>Hello! My name is Alex.</small>
              </div>
              <AudioButton
                text="Hej! Jag heter Alex. Vad heter du?"
                label="Hear the first line"
                className="icon-button"
              />
            </div>
          </div>
          <div className="lesson-one-people" aria-label="Aino and Alex meet for the first time">
            <div className="lesson-one-person lesson-one-person-aino">
              <StoryAvatar name="Aino" size={96} />
              <span>Aino</span>
              <p lang="sv">Vad heter du?</p>
            </div>
            <div className="lesson-one-meets" aria-hidden="true">
              <span>HEJ!</span>
              <ArrowRight size={22} />
            </div>
            <div className="lesson-one-person lesson-one-person-alex">
              <StoryAvatar name="Alex" size={96} />
              <span>Alex</span>
              <p lang="sv">Jag heter Alex.</p>
            </div>
          </div>
        </div>
        <div className="lesson-one-chunks" aria-label="Four lines to learn today">
          {chunks.map(([label, swedish, english], index) => (
            <div key={label}>
              <span>{String(index + 1).padStart(2, "0")} · {label}</span>
              <b lang="sv">{swedish}</b>
              <small>{english}</small>
            </div>
          ))}
        </div>
        <footer className="lesson-one-brief-footer">
          <p><b>Today’s finish line:</b> {byTheEnd}</p>
          <div>
            <span>Speak first</span>
            <span>One sound at a time</span>
            <span>{lecture.minutes} min · pause anytime</span>
          </div>
        </footer>
      </section>
    );
  }

  return (
    <section className="episode-brief" aria-labelledby="episode-brief-title">
      <div className="episode-brief-copy">
        <div className="episode-brief-meta">
          <span>CHAPTER {String(chapter.number).padStart(2, "0")}</span>
          <span>
            EPISODE {String(lecture.number).padStart(2, "0")} OF 60 · {lecture.minutes} MIN
          </span>
        </div>
        <p className="eyebrow">{chapter.title}</p>
        <h1 id="episode-brief-title">{lecture.title}</h1>
        <dl className="episode-brief-beats">
          <div>
            <dt>Previously</dt>
            <dd>{previouslyText}</dd>
          </div>
          <div>
            <dt>Now</dt>
            <dd>{chapter.summary}</dd>
          </div>
          <div>
            <dt>Your mission</dt>
            <dd>{mission}</dd>
          </div>
          {ruleSection && (
            <div>
              <dt>Today&rsquo;s rule</dt>
              <dd>{ruleSection.title}</dd>
            </div>
          )}
          {byTheEnd && (
            <div>
              <dt>By the end</dt>
              <dd>{byTheEnd}</dd>
            </div>
          )}
        </dl>
        <ul className="episode-brief-stats" aria-label="What this episode contains">
          {ruleCount > 0 && (
            <li>
              <b>{ruleCount}</b>
              <span>{ruleCount === 1 ? "rule to learn" : "rules to learn"}</span>
            </li>
          )}
          {phraseCount > 0 && (
            <li>
              <b>{phraseCount}</b>
              <span>{phraseCount === 1 ? "phrase to use" : "phrases to use"}</span>
            </li>
          )}
          <li>
            <b>{lecture.minutes}</b>
            <span>min · split as needed</span>
          </li>
        </ul>
      </div>
      <figure className="episode-brief-art">
        <Image
          src={storyArtForLecture(lecture.number)}
          alt={`Illustrated scene for Episode ${lecture.number}: ${lecture.title}`}
          fill
          priority={lecture.number <= 2}
          sizes="(max-width: 850px) 100vw, 55vw"
        />
        <figcaption>
          <span>
            <MapPin size={14} /> {chapter.setting}
          </span>
          <span>
            <Sparkles size={14} /> {storyObjectForLecture(lecture.number)}
          </span>
        </figcaption>
        <div className="episode-brief-cast">
          <StoryCast names={chapter.cast} label="In this chapter" compact />
        </div>
      </figure>
    </section>
  );
}
