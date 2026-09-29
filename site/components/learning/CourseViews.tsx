"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  FileDown,
  Layers,
  MapPin,
  NotebookPen,
  Printer,
  Search,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  lectures,
  courseModules,
  routeProfileForLecture,
  type CourseLecture,
} from "@/lib/course";
import type { CourseProgressData } from "@/lib/course-progress";
import type { ProgressData } from "@/lib/progress";
import type { Skill } from "@/lib/curriculum";
import { SKILL_CONFIG } from "@/lib/skill-config";
import { storyArtForLecture, storyChapterForModule } from "@/lib/story-world";
import { bookReviews } from "@/lib/book-reviews";
import { StoryCast } from "./StoryAvatar";

export function nextLecture(
  data: CourseProgressData,
): CourseLecture | undefined {
  return (
    lectures.find((l) => !data.lectures[l.id]?.completedAt) ??
    lectures.at(-1)
  );
}

const availableCourseModules = courseModules.filter((module) =>
  lectures.some((lecture) => lecture.module === module.number),
);
export function CourseHome({
  data,
  progress,
  start,
  navigate,
  openOrientation,
}: {
  data: CourseProgressData;
  progress: ProgressData;
  start: (l: CourseLecture) => void;
  navigate: (v: string) => void;
  openOrientation: () => void;
}) {
  const [now] = useState(() => Date.now());
  const next = nextLecture(data);
  const state = next && data.lectures[next.id];
  const bookmark = next && state?.revision && !state.completedAt
    ? routeProfileForLecture(next).steps.find((step) => step.part === state.part)
    : undefined;
  const done = lectures.filter((l) => data.lectures[l.id]?.completedAt).length;
  const currentModule = courseModules.find((m) => m.number === next?.module);
  const chapter = storyChapterForModule(next?.module ?? 1);
  const chapterLectures = lectures.filter(
    (lecture) => lecture.module === next?.module,
  );
  const completion = lectures.length ? (done / lectures.length) * 100 : 0;
  const newToCourse = done === 0 && !state?.revision;
  const due = Object.values(progress.reviews).filter(
    (r) => r.due <= now,
  ).length;
  return (
    <div className="course-space story-home">
      <div className="page-heading story-home-heading">
        <div>
          <p className="eyebrow">I DAG · TODAY ON STIGEN</p>
          <h1>Ready for the next scene?</h1>
          <p>
            Your Swedish grows inside one connected story. Pick up exactly
            where you left off.
          </p>
        </div>
        <span className="course-edition">
          YOUR PATH
          <br />
          <b>{done} / {lectures.length}</b>
        </span>
      </div>
      <div className="classroom-grid">
        <section className="course-cover story-course-cover">
          <div className="story-cover-art">
            <Image
              src={chapter.art}
              alt={"Illustrated scene for " + chapter.title}
              fill
              priority
              sizes="(max-width: 950px) 100vw, 760px"
            />
            <span className="story-art-label">
              CHAPTER {chapter.number} · {chapter.title}
            </span>
            <StoryCast names={chapter.cast} label="In this chapter" compact />
          </div>
          <div className="cover-copy">
            <div className="story-episode-meta">
              <span>
                YOUR NEXT LECTURE ·{" "}
                {String(next?.number ?? 1).padStart(2, "0")}
              </span>
              {next && (
                <span>
                  {next.level} · {next.minutes} MIN
                </span>
              )}
            </div>
            <p className="course-kicker">{currentModule?.title}</p>
            <h2>{next?.title}</h2>
            <p>{next?.summary}</p>
            <div className="story-mission">
              <Target size={18} />
              <span>
                <small>YOUR MISSION</small>
                <b>{next?.objectives[0] ?? currentModule?.outcome}</b>
              </span>
            </div>
            {next?.level === "A0" && (
              <div className="course-a0-signal">
                <AudioLines size={16} />
                <span>
                  <b>A sound coach is here when you want it</b>
                  <small>
                    Listen, ask one focused question, or practise a phrase
                    aloud.
                  </small>
                </span>
              </div>
            )}
            <button
              type="button"
              className="primary lime"
              disabled={!next && !newToCourse}
              onClick={() =>
                newToCourse ? openOrientation() : next && start(next)
              }
            >
              {newToCourse
                ? "Meet the cast and begin"
                : state?.completedAt
                ? "Revisit this episode"
                : state?.revision
                  ? "Continue the story"
                  : "Begin Lecture " + next?.number}
              <ArrowRight size={18} />
            </button>
            {newToCourse && next && (
              <button
                type="button"
                className="cover-skip-tour"
                onClick={() => start(next)}
              >
                Skip the introduction and begin Lecture 1
              </button>
            )}
            {state?.revision && !state.completedAt && (
              <span className="resume-note">
                Your bookmark: {bookmark?.label ?? "Current step"}
              </span>
            )}
          </div>
        </section>
        <aside className="course-companion story-companion">
          <p className="eyebrow">YOUR STORY COMPASS</p>
          <h2>Small steps. Connected learning.</h2>
          <p>{chapter.summary}</p>
          <div className="story-place">
            <MapPin size={16} />
            <span>{chapter.setting}</span>
          </div>
          <div className="course-total">
            <b>
              {done}
              <small> / {lectures.length}</small>
            </b>
            <span>{lectures.length === 1 ? "lesson completed" : "lessons completed"}</span>
          </div>
          <Progress
            value={completion}
            aria-label={`${done} of ${lectures.length} live lessons completed`}
          />
          <button
            type="button"
            className="text-button"
            onClick={() => navigate("Course")}
          >
            Open the story path <ArrowRight size={16} />
          </button>
          <p className="course-caption">
            No daily deadline. Split an episode across sessions whenever you
            need.
          </p>
        </aside>
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">CHAPTER {chapter.number}</p>
          <h2>
            {chapterLectures.length} episode
            {chapterLectures.length === 1 ? "" : "s"} in{" "}
            {chapter.title.toLocaleLowerCase()}
          </h2>
        </div>
        <span className="help-text">{chapter.summary}</span>
      </div>
      <div className="module-preview">
        {chapterLectures.map((l) => (
            <button
              type="button"
              className={
                "module-preview-row " + (l.id === next?.id ? "current" : "")
              }
              key={l.id}
              onClick={() => start(l)}
            >
              <span className="lecture-number">
                {data.lectures[l.id]?.completedAt ? (
                  <Check size={18} />
                ) : (
                  String(l.number).padStart(2, "0")
                )}
              </span>
              <span>
                <small>
                  {(() => {
                    const profile = routeProfileForLecture(l);
                    if (profile.id === "clinic") return "CHAPTER CLINIC";
                    if (profile.id === "checkpoint") return "SKILL CHECKPOINT";
                    if (profile.id === "yki-workshop") return "YKI-STYLE WORKSHOP";
                    if (profile.id === "yki-mock") return "TIMED YKI-STYLE PRACTICE";
                    return "LECTURE " + l.number;
                  })()}
                </small>
                <b>{l.title}</b>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
      </div>
      <div className="course-tools">
        <button type="button" onClick={() => navigate("Notebook")}>
          <NotebookPen />
          <span>
            <b>Your story notebook</b>
            <small>Teaching notes, useful patterns, and your own words.</small>
          </span>
          <ArrowRight size={18} />
        </button>
        <button type="button" onClick={() => navigate("Word bank")}>
          <Layers />
          <span>
            <b>
              {due
                ? `${due} words ready to revisit`
                : "Keep useful words close"}
            </b>
            <small>Spaced recall supports what you learn in Stigen.</small>
          </span>
          <ArrowRight size={18} />
        </button>
      </div>
      <div className="course-note">
        <Target size={20} />
        <p>
          This workshop develops one first Swedish conversation and its core
          sound patterns. Completing it records what you have practised; it
          does not certify a language level, predict a YKI grade, or replace
          an official assessment.
        </p>
      </div>
    </div>
  );
}
function LectureDetail({ l }: { l: CourseLecture }) {
  return (
    <div className="syllabus-detail">
      {l.objectives.length > 1 && (
        <div className="detail-section">
          <p className="detail-label">All objectives</p>
          <ul>
            {l.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </div>
      )}
      {l.sections.length > 0 && (
        <div className="detail-section">
          <p className="detail-label">Topics covered</p>
          <ul>
            {l.sections.map((section) => (
              <li key={section.title}>{section.title}</li>
            ))}
          </ul>
        </div>
      )}
      {l.words.length > 0 && (
        <div className="detail-section">
          <p className="detail-label">Vocabulary ({l.words.length} words)</p>
          <p className="detail-words">
            {l.words.map((word) => word.fi).join(" · ")}
          </p>
        </div>
      )}
      {l.takeaways.length > 0 && (
        <div className="detail-section">
          <p className="detail-label">Key takeaways</p>
          <ul>
            {l.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CourseSyllabus({
  data,
  start,
  legacyCompleted,
  openOrientation,
  openChapterReview,
}: {
  data: CourseProgressData;
  start: (l: CourseLecture) => void;
  legacyCompleted: string[];
  openOrientation: () => void;
  openChapterReview: (chapterNumber: number) => void;
}) {
  const router = useRouter();
  const [level, setLevel] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const next = nextLecture(data);

  function toggleExpand(id: string) {
    setExpanded((current) => (current === id ? null : id));
  }

  function printDetailedCurriculum() {
    const printable = window.open("/curriculum?print=1", "_blank");
    if (printable) {
      printable.opener = null;
      return;
    }
    router.push("/curriculum");
  }

  return (
    <div className="course-space story-syllabus">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DIN BERÄTTELSESTIG · YOUR STORY PATH</p>
          <h1>
            One chapter, built one lesson at a time.
          </h1>
          <p>
            Each lecture begins with a useful conversation and then teaches
            its patterns in small steps. The level label describes the
            starting point, not a certified result.
          </p>
        </div>
        <div className="syllabus-heading-actions">
          <button
            type="button"
            className="print-curriculum-btn"
            onClick={printDetailedCurriculum}
          >
            <Printer size={16} /> Print detailed index
          </button>
          <a
            className="print-curriculum-btn curriculum-export-btn"
            href="/curriculum.md"
            download
          >
            <FileDown size={16} /> Export Markdown
          </a>
        </div>
      </div>
      {availableCourseModules.length > 1 && (
        <div className="course-levels" aria-label="Filter course level">
          {["all", "A0", "A1", "A2", "B1"].map((l) => (
            <button
              type="button"
              className={level === l ? "chosen" : ""}
              aria-pressed={level === l}
              onClick={() => setLevel(l)}
              key={l}
            >
              {l === "all"
                ? "All chapters"
                : l === "A0"
                  ? "A0 · Foundations"
                  : l}
            </button>
          ))}
        </div>
      )}
      <div className="course-note">
        <BookOpen size={20} />
        <p>
          Work through each lecture’s six steps in order. English support stays
          available while you listen, notice, speak, and retrieve the core
          lines. A0 means our complete-beginner starting point (Pre-A1).
        </p>
      </div>
      <button
        type="button"
        className="orientation-entry-card"
        onClick={openOrientation}
      >
        <span className="orientation-entry-icon">
          <BookOpen size={22} />
        </span>
        <span>
          <small>BEFORE LECTURE 1 · OPTIONAL</small>
          <b>Preview your first conversation and practice loop</b>
          <span>A focused two-minute introduction to Lecture 1. Revisit it anytime.</span>
        </span>
        <ArrowRight size={18} />
      </button>
      {availableCourseModules
        .filter((m) => level === "all" || m.level === level)
        .map((m) => {
          const chapter = storyChapterForModule(m.number);
          const moduleLectures = lectures.filter(
            (lecture) => lecture.module === m.number,
          );
          const firstEpisode = moduleLectures.at(0)?.number ?? m.first;
          const lastEpisode = moduleLectures.at(-1)?.number ?? m.last;
          const chapterCompanions = bookReviews.filter(
            (review) =>
              review.anchorEpisode >= firstEpisode &&
              review.anchorEpisode <= lastEpisode,
          );
          const completedInModule = moduleLectures.filter(
            (lecture) => data.lectures[lecture.id]?.completedAt,
          ).length;

          return (
            <section
              className="syllabus-module story-chapter-card"
              key={m.number}
            >
              <header>
                <div className="syllabus-chapter-art">
                  <Image
                    src={chapter.art}
                    alt={`Illustrated chapter setting: ${chapter.setting}`}
                    fill
                    sizes="(max-width: 700px) 100vw, 280px"
                  />
                  <span>CHAPTER {String(m.number).padStart(2, "0")}</span>
                </div>
                <span className="module-index">
                  {String(m.number).padStart(2, "0")}
                </span>
                <div>
                  <p className="eyebrow">
                    {firstEpisode === lastEpisode
                      ? `${m.level} · LECTURE ${firstEpisode}`
                      : `${m.level} · EPISODES ${firstEpisode}–${lastEpisode}`}
                  </p>
                  <span className="module-storyline">
                    CHAPTER {m.number} · {chapter.title}
                  </span>
                  <h2>{m.title}</h2>
                  <p>{m.description}</p>
                  <span className="module-setting">
                    <MapPin size={13} /> {chapter.setting}
                  </span>
                  <StoryCast names={chapter.cast} label="Story cast" compact />
                  {m.level === "A0" && (
                    <span className="module-feature">
                      <AudioLines size={14} /> A0 sound coach in this lesson
                    </span>
                  )}
                </div>
                <span
                  className="module-counter"
                  aria-label={`${completedInModule} of ${moduleLectures.length} live lessons completed`}
                >
                  {completedInModule}/{moduleLectures.length}
                </span>
              </header>
              <div>
                {moduleLectures.map((l) => {
                  const state = data.lectures[l.id];
                  const isExpanded = expanded === l.id;
                  const detailId = `episode-${l.id}-details`;
                  return (
                    <div
                      className={
                        "syllabus-row-wrap " +
                        (l.id === next?.id ? "recommended" : "")
                      }
                      key={l.id}
                    >
                      <div className="syllabus-row">
                        <button
                          type="button"
                          className="syllabus-expand"
                          aria-expanded={isExpanded}
                          aria-controls={detailId}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} episode ${l.number} details`}
                          onClick={() => toggleExpand(l.id)}
                        >
                          <span
                            className={
                              "lecture-number " +
                              (state?.completedAt ? "complete" : "")
                            }
                          >
                            {state?.completedAt ? <Check size={18} /> : l.number}
                          </span>
                          {isExpanded ? (
                            <ChevronDown size={14} className="expand-icon" />
                          ) : (
                            <ChevronRightIcon
                              size={14}
                              className="expand-icon"
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          className="syllabus-main"
                          onClick={() => start(l)}
                        >
                          <span className="syllabus-copy">
                            <b>{l.title}</b>
                            <span>{l.objectives[0]}</span>
                            {legacyCompleted.includes(l.legacyLessonId ?? "") && (
                              <small>
                                Related earlier activity already practised ·
                                new teaching is available
                              </small>
                            )}
                          </span>
                          <span className="lecture-status">
                            {state?.completedAt
                              ? "Completed"
                              : state?.revision
                                ? "In progress"
                                : l.id === next?.id
                                  ? "Start here"
                                  : (() => {
                                      const profile = routeProfileForLecture(l);
                                      if (profile.id === "clinic") return "Clinic";
                                      if (profile.id === "checkpoint") return "Checkpoint";
                                      if (profile.id === "yki-workshop") return "YKI-style workshop";
                                      if (profile.id === "yki-mock") return "Timed YKI-style practice";
                                      return `${l.minutes} min`;
                                    })()}
                          </span>
                          <ArrowRight size={17} />
                        </button>
                      </div>
                      <div
                        id={detailId}
                        className={isExpanded ? "" : "syllabus-detail-hidden"}
                        hidden={!isExpanded}
                      >
                        <LectureDetail l={l} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <footer>
                <CheckCircle2 size={16} />
                <span>By the end: {m.outcome}</span>
              </footer>
              {chapterCompanions.length > 0 && (
                <div className="story-chapter-companions">
                  <div>
                    <p className="eyebrow">COMPANION SCENES · OPTIONAL</p>
                    <p>
                      Keep the numbered episodes first. These source scenes are
                      ready when their language becomes useful, without leaving
                      your path.
                    </p>
                  </div>
                  <div className="story-chapter-companion-links">
                    {chapterCompanions.map((review) => (
                      <button
                        type="button"
                        key={review.number}
                        onClick={() => openChapterReview(review.number)}
                      >
                        <BookOpen size={15} />
                        <span>
                          <small>
                            Source chapter {String(review.number).padStart(2, "0")} · after episode {review.anchorEpisode}
                          </small>
                          <b>{review.title}</b>
                        </span>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
    </div>
  );
}
export function CourseNotebook({
  data,
  start,
}: {
  data: CourseProgressData;
  start: (l: CourseLecture) => void;
}) {
  const [query, setQuery] = useState("");
  const [mine, setMine] = useState(false);
  const selected = lectures.filter((l) => {
    const state = data.lectures[l.id];
    return (
      (!mine || state?.notes || state?.assignment) &&
      [
        l.title,
        ...l.takeaways,
        ...l.sections.flatMap((s) => [s.title, ...s.body]),
        state?.notes ?? "",
        state?.assignment ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  return (
    <div className="course-space">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ANTECKNINGAR · YOUR NOTEBOOK</p>
          <h1>A place to connect the dots.</h1>
          <p>
            Find a pattern again, revisit an example, and keep your own notes
            alongside it.
          </p>
        </div>
      </div>
      <div className="filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a topic or your notes"
            aria-label="Search notebook"
          />
        </label>
        <label className="notebook-toggle">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
          />
          Only episodes with my notes or assignments
        </label>
      </div>
      <p className="help-text result-count" role="status">
        {selected.length} episode {selected.length === 1 ? "entry" : "entries"}
      </p>
      <div className="notebook-grid">
        {selected.map((l) => {
          const state = data.lectures[l.id];
          return (
            <article className="notebook-entry" key={l.id}>
              <div className="notebook-entry-art">
                <Image
                  src={storyArtForLecture(l.number)}
                  alt={`Illustrated moment from Episode ${l.number}`}
                  fill
                  sizes="(max-width: 767px) 100vw, 350px"
                />
              </div>
              <span className="eyebrow">
                EPISODE {l.number} · {l.level}
              </span>
              <h2>{l.title}</h2>
              <ul>
                {l.takeaways.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              {state?.notes && (
                <div className="personal-note">
                  <span>MY NOTES</span>
                  <p>{state.notes}</p>
                </div>
              )}
              {state?.assignment && (
                <details>
                  <summary>My follow-up work</summary>
                  <p className="personal-writing">{state.assignment}</p>
                </details>
              )}
              <button
                type="button"
                className="text-button"
                onClick={() => start(l)}
              >
                Open this episode <ArrowRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
      {!selected.length && (
        <div className="panel empty-state">
          <NotebookPen size={30} />
          <h2>{query ? "No matching notes" : "Your notebook is ready"}</h2>
          <p>
            {query
              ? "Try a Swedish word or a broader topic."
              : "Add notes inside any episode. They will appear here with your follow-up work."}
          </p>
        </div>
      )}
    </div>
  );
}
export function CourseProgress({
  data,
  progress,
  start,
}: {
  data: CourseProgressData;
  progress: ProgressData;
  start: (l: CourseLecture) => void;
}) {
  const complete = lectures.filter((l) => data.lectures[l.id]?.completedAt);
  const introduced = lectures.filter((l) =>
    data.lectures[l.id]?.completedParts.includes("teach"),
  );
  const active = lectures.filter(
    (l) =>
      data.lectures[l.id]?.revision && !data.lectures[l.id]?.completedAt,
  );
  const next = nextLecture(data);
  return (
    <div className="course-space">
      <div className="page-heading">
        <div>
          <p className="eyebrow">FRAMSTEG · YOUR PRACTICE EVIDENCE</p>
          <h1>Notice what you can do now.</h1>
          <p>
            Episode completion shows what you have practised. It is not a
            proficiency score or an official assessment.
          </p>
        </div>
      </div>
      <div className="course-stats">
        <div>
          <b>{introduced.length}</b>
          <span>episodes studied</span>
        </div>
        <div>
          <b>
            {complete.length}
            <small>/{lectures.length}</small>
          </b>
          <span>all six parts completed</span>
        </div>
        <div>
          <b>{Object.keys(progress.reviews).length}</b>
          <span>words in spaced review</span>
        </div>
        <div>
          <b>{active.length}</b>
          <span>episodes in progress</span>
        </div>
      </div>
      <section className="panel">
        <h2>Four skills, four strands of evidence</h2>
        <div className="skill-summary">
          {(Object.keys(SKILL_CONFIG) as Skill[]).map((skill) => {
            const Icon = SKILL_CONFIG[skill].icon;
            const count = lectures.filter(
              (l) => data.lectures[l.id]?.practice[skill],
            ).length;
            return (
              <div key={skill}>
                <Icon />
                <h3 className="capitalize">{skill}</h3>
                <b>{count}</b>
                <p>episodes with saved practice</p>
                <small>
                  {skill === "speaking" || skill === "writing"
                    ? "Saved practice and self-review—not an official assessment"
                    : "Practice-item accuracy—not an official YKI result"}
                </small>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <h2>Your story, chapter by chapter</h2>
        {availableCourseModules.map((m) => {
          const moduleLectures = lectures.filter(
            (lecture) => lecture.module === m.number,
          );
          const count = moduleLectures.filter((lecture) =>
            data.lectures[lecture.id]?.completedAt,
          ).length;
          return (
            <div className="level-progress" key={m.number}>
              <div>
                <b>
                  {m.number}. {m.title}
                </b>
                <span>
                  {count}/{moduleLectures.length} completed
                </span>
              </div>
              <Progress
                value={
                  moduleLectures.length
                    ? (count / moduleLectures.length) * 100
                    : 0
                }
                aria-label={`${m.title}: ${count} of ${moduleLectures.length} episodes completed`}
              />
            </div>
          );
        })}
      </section>
      <div className="course-note">
        <Target />
        <p>
          Stigen keeps separate practice evidence for listening, speaking,
          reading, and writing. These counts do not predict a YKI grade or show
          that you are ready for the test. Check current official guidance and
          consider feedback from a qualified teacher when planning your next
          step. Earlier activities are preserved: {progress.completed.length}{" "}
          completed activities and {progress.attempts.length} saved practice
          attempts.
        </p>
      </div>
      {next && (
        <button
          type="button"
          className="primary"
          onClick={() => start(next)}
        >
          Return to episode {next.number}
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}
