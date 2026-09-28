import Image from "next/image";
import { MapPin, Sparkles } from "lucide-react";
import type { CourseLecture } from "@/lib/course";
import {
  storyArtForLecture,
  storyObjectForLecture,
  type StoryChapter,
} from "@/lib/story-world";
import { StoryCast } from "./StoryAvatar";

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
      ? "First lesson. Nothing to bring back yet — you meet Swedish for the very first time, one sound rule and three useful phrases at a time."
      : "Alex has arrived at the first community Swedish class.";

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
