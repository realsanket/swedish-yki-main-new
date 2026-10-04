"use client";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lessons } from "@/lib/curriculum";
import { courseWords as words, coreWords, lectures } from "@/lib/course";
import type { CourseProgressData } from "@/lib/course-progress";
import type { ProgressData } from "@/lib/progress";
import AudioButton from "./AudioButton";
import PhraseReview from "./PhraseReview";
import MemoryChart from "./MemoryChart";
import { cardUnlocked, dueCards, memoryByLecture, phraseCardsByLecture, type ReviewCard } from "@/lib/review-cards";
export default function WordBank({
  data,
  course,
  onReview,
}: {
  data: ProgressData;
  course?: CourseProgressData;
  onReview: (
    wordId: string,
    rating: "again" | "hard" | "good" | "easy",
    id: string,
  ) => Promise<void>;
}) {
  const [query, setQuery] = useState(""),
    [level, setLevel] = useState("all"),
    [reviewing, setReviewing] = useState(false),
    [revealed, setRevealed] = useState(false),
    [session, setSession] = useState<string[]>([]),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [theme, setTheme] = useState("all");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const requestId = useRef<string | null>(null);
  // Phrase and return cards are fixed for one session so a rating does not
  // reshuffle the queue under the learner.
  const [phraseSession, setPhraseSession] = useState<ReviewCard[] | null>(null);
  const duePhrases = dueCards(course, data.reviews, now);
  const memory = memoryByLecture(course, data.reviews, now);
  const learned = new Set(
    lessons
      .filter((l) => data.completed.includes(l.id))
      .flatMap((l) => l.words.map((w) => w.id)),
  );
  lectures
    .filter((l) => course?.lectures[l.id]?.completedParts.includes("teach"))
    .forEach((l) => l.words.forEach((w) => learned.add(w.id)));
  const due = words.filter(
    (w) =>
      (learned.has(w.id) || data.reviews[w.id]) &&
      (!data.reviews[w.id] || data.reviews[w.id].due <= now),
  );
  const filtered = words.filter(
    (w) =>
      (level === "all" || w.level === level) &&
      [w.fi, w.en].some((x) => x.toLowerCase().includes(query.toLowerCase())),
  );
  const current = words.find((w) => w.id === session[index]);
  const coreThemes = [...new Set(coreWords.map((w) => w.theme))].sort();
  const coreStarted = coreWords.filter((w) => data.reviews[w.id]).length;
  const coreFresh = coreWords.filter((w) => !data.reviews[w.id] && (theme === "all" || w.theme === theme));
  const LIST_LIMIT = 200;
  function begin(ids: string[]) {
    requestId.current = null;
    setSession(ids);
    setIndex(0);
    setRevealed(false);
    setReviewing(true);
    setError("");
  }
  async function rate(rating: "again" | "hard" | "good" | "easy") {
    if (!current) return;
    setBusy(true);
    setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      await onReview(current.id, rating, requestId.current);
      requestId.current = null;
      if (rating === "again") setSession((s) => [...s, current.id]);
      setIndex((i) => i + 1);
      setRevealed(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SANASTO · WORD BY WORD</p>
          <h1>Make the words stay with you.</h1>
          <p>
            Recall first, reveal second. We’ll bring words back when they need
            you.
          </p>
        </div>
      </div>
      {reviewing ? (
        <section className="panel flashcard-panel">
          <button className="text-button" onClick={() => setReviewing(false)}>
            ← Back to word bank
          </button>
          {current ? (
            <>
              <div className="section-heading">
                <span className="badge">{current.level}</span>
                <span className="help-text">
                  Card {index + 1} of {session.length}
                </span>
              </div>
              <div className="flashcard">
                <span className="small-label">WHAT DOES THIS MEAN?</span>
                <h2 lang="sv">{current.fi}</h2>
                <AudioButton text={current.fi} label="Listen to word" />
                {revealed ? (
                  <>
                    <h3>{current.en}</h3>
                    <p lang="sv">{current.example}</p>
                    <span>{current.translation}</span>
                  </>
                ) : (
                  <button
                    className="secondary"
                    onClick={() => setRevealed(true)}
                  >
                    Reveal meaning
                  </button>
                )}
              </div>
              {revealed && (
                <>
                  <p className="help-text centered">
                    How easily did you remember?
                  </p>
                  <div className="review-ratings">
                    {(["again", "hard", "good", "easy"] as const).map((r) => (
                      <button
                        key={r}
                        className={r === "good" ? "primary" : "secondary"}
                        disabled={busy}
                        onClick={() => rate(r)}
                      >
                        {r === "again"
                          ? "Again"
                          : r === "hard"
                            ? "With effort"
                            : r === "good"
                              ? "Got it"
                              : "Easy"}
                        <small>
                          {r === "again"
                            ? "Repeat now"
                            : r === "hard"
                              ? "Sooner"
                              : r === "good"
                                ? "Space it out"
                                : "Later"}
                        </small>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className="completion">
              <CheckCircle2 size={46} />
              <h2>All caught up. Bra!</h2>
              <p>You gave those words another chance to stick.</p>
              <button className="primary" onClick={() => setReviewing(false)}>
                Back to my words
              </button>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="panel phrase-review-panel" aria-labelledby="phrase-review-heading">
            <div className="phrase-review-panel-head">
              <div>
                <p className="eyebrow">SAY IT IN SWEDISH · SPACED REVIEW</p>
                <h2 id="phrase-review-heading">
                  {duePhrases.length
                    ? `${duePhrases.length} ${duePhrases.length === 1 ? "phrase is" : "phrases are"} ready to say again`
                    : "No phrases due right now"}
                </h2>
                <p className="help-text">
                  You see the English and say the Swedish aloud before you check it. Phrases
                  come back just before you would forget them, and a finished lecture&rsquo;s
                  task comes back to be said from memory.
                </p>
              </div>
              {!phraseSession && duePhrases.length > 0 && (
                <button className="primary" onClick={() => setPhraseSession(duePhrases)}>
                  Start phrase review <ArrowRight size={17} />
                </button>
              )}
            </div>
            {!phraseSession && (
              <ul className="phrase-lecture-list">
                {phraseCardsByLecture().map((group) => {
                  const joined = group.cards.filter((card) => cardUnlocked(card, course, data.reviews)).length;
                  return (
                    <li key={group.lectureId}>
                      <span>
                        <b>Lecture {group.number}</b> · {group.title}
                        <small>
                          {joined === group.cards.length
                            ? `All ${group.cards.length} phrases are in your review.`
                            : joined
                              ? `${joined} of ${group.cards.length} phrases in your review. The rest join after “Build it step by step”, or practise them now.`
                              : `${group.cards.length} phrases. They join your review after “Build it step by step” in this lecture, or practise them now.`}
                        </small>
                      </span>
                      <button className="secondary" onClick={() => setPhraseSession(group.cards)}>
                        Practise these now
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {phraseSession && (
              <PhraseReview
                cards={phraseSession}
                onReview={(cardId, rating, id) => onReview(cardId, rating, id)}
                onDone={() => setPhraseSession(null)}
              />
            )}
            {memory.length > 0 && <MemoryChart rows={memory} />}
          </section>
          <div className="review-banner">
            <span className="section-symbol">
              <Layers />
            </span>
            <div>
              <h2>
                {due.length
                  ? `${due.length} words ready for a revisit`
                  : "Your word collection starts here"}
              </h2>
              <p>
                {due.length
                  ? "A few minutes of recall will make a difference."
                  : "Study a lecture or start with six beginner words."}
              </p>
            </div>
            <button
              className="primary"
              onClick={() =>
                begin(
                  (due.length
                    ? due
                    : words.filter((w) => w.level === "A0").slice(0, 6)
                  ).map((w) => w.id),
                )
              }
            >
              {due.length ? "Review due words" : "Learn first words"}
              <ArrowRight size={17} />
            </button>
          </div>
          {coreWords.length > 0 && (
            <section className="panel core-words-panel" aria-labelledby="core-words-heading">
              <p className="eyebrow">CORE WORDS · A1-B1 FREQUENCY LIST</p>
              <h2 id="core-words-heading">
                {coreStarted} of {coreWords.length} core words started
              </h2>
              <p className="help-text">
                Frequent Swedish words that the lectures do not teach, from the Swedish Kelly list
                (Språkbanken). Ten new words a day takes you through the list in about a year; started
                words come back with your other reviews. Easier words come first.
              </p>
              <div className="core-words-controls">
                <label>
                  Topic{" "}
                  <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                    <option value="all">All topics</option>
                    {coreThemes.map((value) => (
                      <option value={value} key={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="primary"
                  disabled={!coreFresh.length}
                  onClick={() => begin(coreFresh.slice(0, 10).map((w) => w.id))}
                >
                  Learn 10 new core words <ArrowRight size={17} />
                </button>
              </div>
            </section>
          )}
          <div className="filter-bar">
            <Tabs value={level} onValueChange={setLevel}>
              <TabsList>
                {["all", "A0", "A1", "A2", "B1"].map((l) => (
                  <TabsTrigger value={l} key={l}>
                    {l === "all" ? "All words" : l}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <label className="search-field">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a Swedish or English word"
                aria-label="Search vocabulary"
              />
            </label>
          </div>
          <p className="help-text result-count">
            {filtered.length} words · {learned.size} introduced in your learning
            {filtered.length > LIST_LIMIT && ` · showing the first ${LIST_LIMIT}; search to find any word`}
          </p>
          <div className="word-list">
            {filtered.slice(0, LIST_LIMIT).map((w) => (
              <article className="word-row" key={w.id}>
                <div>
                  <span className="badge">{w.level}</span>
                  <button
                    className="word-term"
                    onClick={() => begin([w.id])}
                    lang="sv"
                  >
                    {w.fi}
                  </button>
                  <p>{w.en}</p>
                </div>
                <div className="word-example">
                  <p lang="sv">{w.example}</p>
                  <small>{w.translation}</small>
                </div>
                <AudioButton
                  text={w.fi}
                  className="icon-button"
                  label={"Listen to " + w.fi}
                />
                <button
                  className="text-button"
                  aria-label={"Practise " + w.fi}
                  onClick={() => begin([w.id])}
                >
                  <RotateCcw size={16} />
                  <span>Practise</span>
                </button>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="panel empty-state">
              <Search size={30} />
              <h2>No matching words</h2>
              <p>Try another spelling or change the level filter.</p>
              <button
                className="secondary"
                onClick={() => {
                  setQuery("");
                  setLevel("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
