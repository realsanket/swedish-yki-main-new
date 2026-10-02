import Image from "next/image";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { CourseLecture } from "@/lib/course";
import {
  storyArtForLecture,
  storyObjectForLecture,
  storyCastForLecture,
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
  const hero = lecture.presentation?.hero;
  const artwork = storyArtForLecture(lecture);
  const storyObject = storyObjectForLecture(lecture);
  const previouslyText = previousTitle
    ? `The last episode was “${previousTitle}.”`
    : "This is the first live lesson. Begin from its model before analysing the language.";

  if (hero?.variant === "conversation") {
    const [firstSpeaker, secondSpeaker] = hero.speakers;
    return (
      <section className="lecture-conversation-brief" aria-labelledby="episode-brief-title">
        <div className="lecture-conversation-brief-main">
          <div className="lecture-conversation-brief-copy">
            <div className="lecture-conversation-brief-meta">
              {hero.meta.map((item) => <span key={item}>{item}</span>)}
            </div>
            <p className="lecture-conversation-kicker">{hero.kicker}</p>
            <h1 id="episode-brief-title">{hero.title}</h1>
            <p className="lecture-conversation-lede">{hero.lede}</p>
            <div className="lecture-conversation-start-line">
              <div>
                <span>{hero.startLine.label}</span>
                <p lang="sv">{hero.startLine.fi}</p>
                <small>{hero.startLine.en}</small>
              </div>
              <AudioButton
                text={hero.startLine.audioText ?? hero.startLine.fi}
                label="Hear the first line"
                className="icon-button"
              />
            </div>
          </div>
          <div className="lecture-conversation-people" aria-label={hero.encounterLabel ?? "Two speakers meet"}>
            <div className="lecture-conversation-person">
              <StoryAvatar name={firstSpeaker.name} size={96} />
              <span>{firstSpeaker.name}</span>
              <p lang="sv">{firstSpeaker.fi}</p>
            </div>
            <div className="lecture-conversation-meets" aria-hidden="true">
              <span>{hero.connector ?? "HEJ!"}</span>
              <ArrowRight size={22} />
            </div>
            <div className="lecture-conversation-person">
              <StoryAvatar name={secondSpeaker.name} size={96} />
              <span>{secondSpeaker.name}</span>
              <p lang="sv">{secondSpeaker.fi}</p>
            </div>
          </div>
        </div>
        <div className="lecture-conversation-chunks" aria-label="Core lines for this lesson">
          {hero.chunks.map((chunk, index) => (
            <div key={`${chunk.label}-${chunk.fi}`}>
              <span>{String(index + 1).padStart(2, "0")} · {chunk.label}</span>
              <b lang="sv">{chunk.fi}</b>
              <small>{chunk.en}</small>
            </div>
          ))}
        </div>
        <footer className="lecture-conversation-brief-footer">
          <p><b>Today’s finish line:</b> {byTheEnd}</p>
          <div>
            {hero.footerTags?.map((tag) => <span key={tag}>{tag}</span>)}
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
            EPISODE {String(lecture.number).padStart(2, "0")} · {lecture.minutes} MIN
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
        {artwork ? <Image
          src={artwork}
          alt={`Illustrated scene for Episode ${lecture.number}: ${lecture.title}`}
          fill
          priority
          sizes="(max-width: 850px) 100vw, 55vw"
        /> : <StoryCast names={storyCastForLecture(lecture)} label="In this scene" />}
        <figcaption>
          <span>
            <MapPin size={14} /> {chapter.setting}
          </span>
          {storyObject && <span>
            <Sparkles size={14} /> {storyObject}
          </span>}
        </figcaption>
        <div className="episode-brief-cast">
          <StoryCast names={chapter.cast} label="In this chapter" compact />
        </div>
      </figure>
    </section>
  );
}
