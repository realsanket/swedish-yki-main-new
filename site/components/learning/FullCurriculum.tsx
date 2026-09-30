import { ArrowRight, BookOpen, MapPin } from "lucide-react";
import {
  courseModules,
  lectures,
  routeProfileForLecture,
  type CourseLecture,
} from "@/lib/course";
import { bookReviews } from "@/lib/book-reviews";
import { storyChapterForModule } from "@/lib/story-world";
import { getYkiMock } from "@/lib/yki-mocks";

type FullCurriculumProps = {
  mode: "screen" | "standalone";
  start?: (lecture: CourseLecture) => void;
  openOrientation?: () => void;
};

const liveModules = courseModules.filter((module) =>
  lectures.some((lecture) => lecture.module === module.number),
);

const plannedModules = courseModules.filter(
  (module) => !lectures.some((lecture) => lecture.module === module.number),
);

function episodeLabel(numbers: readonly number[]) {
  if (numbers.length === 1) return `Episode ${numbers[0]}`;
  if (numbers.length === 2) return `Episodes ${numbers[0]} and ${numbers[1]}`;
  return `Episodes ${numbers.join(", ")}`;
}

export function FullCurriculum({
  mode,
  start,
  openOrientation,
}: FullCurriculumProps) {
  const isStandalone = mode === "standalone";

  return (
    <section
      className={`full-curriculum-document${isStandalone ? " standalone-curriculum-document" : ""}`}
    >
      <header className="full-curriculum-heading">
        <div>
          <p className="eyebrow">STIGEN · LIVE CHAPTER 1 CURRICULUM</p>
          <h2>One chapter, developed one lecture at a time.</h2>
          <p>
            {lectures.length} live {lectures.length === 1 ? "lecture" : "lectures"} in {liveModules.length} story{" "}
            {liveModules.length === 1 ? "chapter" : "chapters"}. Later course material is held outside the live app
            until each lesson has been verified against its sources.
          </p>
        </div>
        <dl className="curriculum-facts">
          <div>
            <dt>Live path</dt>
            <dd>{lectures.length} {lectures.length === 1 ? "lecture" : "lectures"}</dd>
          </div>
          <div>
            <dt>Story chapters</dt>
            <dd>{liveModules.length}</dd>
          </div>
          <div>
            <dt>Source companions</dt>
            <dd>{bookReviews.length} optional</dd>
          </div>
        </dl>
      </header>

      <div className="curriculum-principle">
        <BookOpen size={18} />
        <p>
          <b>Use only this live path.</b> Complete each lecture’s steps in
          order. Source documents support the teaching decisions, but they are
          not extra required work.
        </p>
      </div>

      {openOrientation && (
        <button
          type="button"
          className="curriculum-orientation"
          onClick={openOrientation}
        >
          <span>BEFORE LECTURE 1 · OPTIONAL</span>
          <b>Preview the first conversation and practice loop</b>
          <small>A focused two-minute introduction to Lecture 1. Revisit it any time.</small>
          <ArrowRight size={17} />
        </button>
      )}

      <div className="curriculum-chapters">
        {liveModules.map((module) => {
          const chapter = storyChapterForModule(module.number);
          const moduleLectures = lectures.filter(
            (lecture) => lecture.module === module.number,
          );
          const firstEpisode = moduleLectures.at(0)?.number ?? module.first;
          const lastEpisode = moduleLectures.at(-1)?.number ?? module.last;
          const sourceThreads = bookReviews
            .map((review) => ({
              review,
              episodes: review.touchpoints.filter(
                (episode) =>
                  episode >= firstEpisode && episode <= lastEpisode,
              ),
            }))
            .filter(({ review, episodes }) =>
              episodes.length > 0 ||
              (review.anchorEpisode >= firstEpisode &&
                review.anchorEpisode <= lastEpisode),
            );

          return (
            <article className="curriculum-chapter" key={module.number}>
              <header>
                <span className="curriculum-chapter-number">
                  {String(module.number).padStart(2, "0")}
                </span>
                <div>
                  <p className="eyebrow">
                    {firstEpisode === lastEpisode
                      ? `${module.level} · LECTURE ${firstEpisode}`
                      : `${module.level} · EPISODES ${firstEpisode}–${lastEpisode}`}
                  </p>
                  <span className="curriculum-story-title">
                    CHAPTER {module.number} · {chapter.title}
                  </span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  {module.vocabularyTargets && (
                    <p>
                      <b>Vocabulary path:</b> Active: {module.vocabularyTargets.active}{" "}
                      Recognition: {module.vocabularyTargets.recognition}{" "}
                      Functional chunks: {module.vocabularyTargets.functional}{" "}
                      Recycled: {module.vocabularyTargets.recycled}
                    </p>
                  )}
                  <span className="curriculum-setting">
                    <MapPin size={13} /> {chapter.setting}
                  </span>
                </div>
                <p className="curriculum-outcome">
                  <span>BY THE END</span>
                  {module.outcome}
                </p>
              </header>

              <ol className="curriculum-episodes" start={firstEpisode}>
                {moduleLectures.map((lecture) => {
                  const routeProfile = routeProfileForLecture(lecture);
                  const content = (
                    <>
                      <span className="curriculum-episode-number">
                        {String(lecture.number).padStart(2, "0")}
                      </span>
                      <span>
                        <b>{lecture.title}</b>
                        <small>{lecture.objectives[0]}</small>
                      </span>
                      <em>
                        {routeProfile.id === "standard"
                          ? `${lecture.minutes} min`
                          : `${routeProfile.label.replace(" route", "")} · ${lecture.minutes} min`}
                      </em>
                    </>
                  );
                  return (
                    <li key={lecture.id}>
                      {start ? (
                        <button
                          type="button"
                          onClick={() => start(lecture)}
                          aria-label={`Open episode ${lecture.number}: ${lecture.title}`}
                        >
                          {content}
                          <ArrowRight size={15} />
                        </button>
                      ) : (
                        <div>{content}</div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <section className="curriculum-teaching-index">
                <header>
                  <p className="eyebrow">TEACHING INDEX · TOPICS AND SUBTOPICS</p>
                  <p>
                    The detail below comes from the teaching sections in each
                    episode—not from titles alone. Use it to review exactly
                    what the course introduces, practises, and carries forward.
                  </p>
                </header>
                <div className="curriculum-teaching-episodes">
                  {moduleLectures.map((lecture) => (
                    <article key={lecture.id} className="curriculum-teaching-episode">
                      <header>
                        <span>{String(lecture.number).padStart(2, "0")}</span>
                        <div>
                          <p className="eyebrow">
                            LECTURE {lecture.number} · BROAD: {lecture.focusSkills.join(" · ")}
                          </p>
                          <small className="curriculum-core-task">
                            Core task: {lecture.route.requiredSkills.join(" + ")} · {lecture.route.expectedOutput}
                          </small>
                          <h4>{lecture.title}</h4>
                        </div>
                      </header>
                      <div className="curriculum-objectives">
                        <p>LEARNING GOALS</p>
                        <ul>
                          {lecture.objectives.map((objective) => (
                            <li key={objective}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="curriculum-topic-list">
                        {lecture.sections.map((section, sectionIndex) => (
                          <section key={section.title}>
                            <h5>
                              <span>{sectionIndex + 1}</span>
                              {section.title}
                            </h5>
                            <ul>
                              {section.body.map((subtopic) => (
                                <li key={subtopic}>{subtopic}</li>
                              ))}
                            </ul>
                            {section.examples.length > 0 && (
                              <div className="curriculum-key-examples">
                                <p>KEY EXAMPLES</p>
                                <ul>
                                  {section.examples.map((example, exampleIndex) => (
                                    <li key={`${lecture.id}-${sectionIndex}-${exampleIndex}`}>
                                      <b lang="sv">{example.fi}</b>
                                      <span>{example.en}</span>
                                      {example.note && <em>{example.note}</em>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {section.table && (
                              <div className="curriculum-pattern-table">
                                <p>PATTERN TABLE</p>
                                <table>
                                  <thead>
                                    <tr>
                                      {section.table.headings.map((heading) => (
                                        <th key={heading}>{heading}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {section.table.rows.map((row, rowIndex) => (
                                      <tr key={`${section.title}-${rowIndex}`}>
                                        {row.map((cell, cellIndex) => (
                                          <td key={`${cell}-${cellIndex}`}>{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </section>
                        ))}
                      </div>
                      <div className="curriculum-carry-forward">
                        <p>CARRY FORWARD</p>
                        <ul>
                          {lecture.takeaways.map((takeaway) => (
                            <li key={takeaway}>{takeaway}</li>
                          ))}
                        </ul>
                      </div>
                      {(() => {
                        const mock = getYkiMock(lecture.number);
                        return mock ? (
                          <div className="curriculum-mock-index">
                            <p>ORIGINAL COMPRESSED MOCK · {mock.totalMinutes} MINUTES</p>
                            <small>
                              {mock.timing
                                .map((block) => `${block.label} ${block.minutes} min`)
                                .join(" · ")}
                            </small>
                            <ul>
                              <li><b>Listening:</b> {mock.listening.map((task) => task.title).join("; ")}</li>
                              <li><b>Reading:</b> {mock.reading.map((task) => task.title).join("; ")}</li>
                              <li><b>Speaking:</b> {mock.speaking.map((task) => task.title).join("; ")}</li>
                              <li><b>Writing:</b> {mock.writing.map((task) => task.title).join("; ")}</li>
                            </ul>
                          </div>
                        ) : null;
                      })()}
                    </article>
                  ))}
                </div>
              </section>

              {sourceThreads.length > 0 && (
                <aside className="curriculum-source-threads">
                  <p className="eyebrow">SOURCE THREADS · OPTIONAL</p>
                  <div>
                    {sourceThreads.map(({ review, episodes }) => {
                      const readyHere =
                        review.anchorEpisode >= firstEpisode &&
                        review.anchorEpisode <= lastEpisode;
                      const content = (
                        <>
                          <BookOpen size={15} />
                          <span>
                            <small>
                              SOURCE {String(review.number).padStart(2, "0")} · {episodeLabel(episodes)}
                            </small>
                            <b>{review.title}</b>
                            <em>
                              {readyHere
                                ? `Full review ready after Episode ${review.anchorEpisode}`
                                : `Returns after the full review opens at Episode ${review.anchorEpisode}`}
                            </em>
                          </span>
                        </>
                      );
                      return <div key={review.number}>{content}</div>;
                    })}
                  </div>
                </aside>
              )}
            </article>
          );
        })}
      </div>

      {bookReviews.length > 0 && (
        <section className="curriculum-source-audit">
          <header>
            <p className="eyebrow">SOURCE CHAPTER AUDIT</p>
            <h3>The original chapter order is not the teaching order.</h3>
            <p>
              Source chapters are placed by what they teach—not by chapter
              number—and remain optional reference material.
            </p>
          </header>
          <div>
            {bookReviews.map((review) => (
              <div key={review.number}>
                <span>{String(review.number).padStart(2, "0")}</span>
                <p>
                  <b>{review.title}</b>
                  <small>{review.focus}</small>
                  <em>Full companion after Episode {review.anchorEpisode}</em>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {plannedModules.map((module) => (
        <aside className="curriculum-planned" key={module.number}>
          <p className="eyebrow">PLANNED NEXT · NOT YET LIVE</p>
          <h3>{module.title}</h3>
          <p>
            {module.description} This chapter is intentionally not counted in
            the {lectures.length}-episode live curriculum until its lesson
            content is ready.
          </p>
        </aside>
      ))}
    </section>
  );
}
