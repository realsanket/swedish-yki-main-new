"use client";
/* Timed-attempt recovery intentionally hydrates client state after SSR. */
/* eslint-disable react-hooks/set-state-in-effect */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Mic,
  Sparkles,
  Square,
  RotateCcw,
  Lightbulb,
} from "lucide-react";
import { SKILL_CONFIG } from "@/lib/skill-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lessons, examTasks } from "@/lib/curriculum";
import type { CourseLecture } from "@/lib/course-types";
import type { PracticeFeedback } from "@/lib/ai";
import { storyChapters } from "@/lib/story-world";
import AudioButton from "./AudioButton";
import LiveVoice from "./LiveVoice";
import QuestionCard from "./QuestionCard";
import ReadingPassageCard from "./ReadingPassageCard";
import { StoryCast } from "./StoryAvatar";
import styles from "./PracticeStudio.module.css";

type Skill = "listening" | "speaking" | "reading" | "writing";
type Level = "A0" | "A1" | "A2" | "B1";
type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};
type Task = {
  id: string;
  title: string;
  prompt: string;
  help: string | string[];
  model?: string;
  text?: string;
  questions: Question[];
  seconds: number;
};
type AiStatus = {
  configured: boolean;
  signedIn: boolean;
  available: boolean;
  userId?: string | null;
  provider?: "azure" | "openai" | null;
  capabilities?: {
    feedback: boolean;
    transcription: boolean;
    liveVoice: boolean;
  };
};
type Props = {
  initialSkill?: Skill;
  level?: Level;
  onComplete?: (
    skill: string,
    score: number | null,
    minutes: number,
    attemptId?: string,
  ) => void | Promise<void>;
  exam?: boolean;
  lessonId?: string;
  lecture?: CourseLecture;
  initialDraft?: string;
  onDraftChange?: (text: string) => void;
  initialSaved?: boolean;
  /**
   * Adds timed conditions without changing the source material. Unlike `exam`,
   * this continues to use the current lecture's task.
   */
  timed?: boolean;
  /** Overrides the task's normal duration when `timed` is enabled. */
  timeLimitSeconds?: number;
  /** Requires a meaningful second response when an earlier draft is supplied. */
  requireChangedRetry?: boolean;
};
const skills = Object.keys(SKILL_CONFIG) as Skill[];
const practiceArt: Record<Skill, string> = {
  listening: "/images/onboarding/activity-modes/listening.webp",
  speaking: "/images/onboarding/activity-modes/conversation.webp",
  reading: "/images/onboarding/activity-modes/reading.webp",
  writing: "/images/onboarding/activity-modes/writing.webp",
};

function getTasks(
  skill: Skill,
  level: Level,
  exam: boolean,
  lecture?: CourseLecture,
): Task[] {
  // Timing is a presentation condition. Only an actual exam selects generic
  // exam material; timed episode work must retain its lesson-specific task.
  if (exam)
    return examTasks
      .filter((task) => task.skill === skill)
      .map((task) => ({ ...task, questions: task.questions ?? [] }));
  return (
    lecture ? [lecture] : lessons.filter((lesson) => lesson.level === level)
  ).map((lesson) => {
    const exercise = lesson[skill];
    if ("question" in exercise)
      return {
        id: lesson.id,
        title: lesson.title,
        prompt:
          skill === "listening"
            ? "Listen to the Swedish audio. Then choose the best answer."
            : "Read the message and choose the best answer.",
        help: "You do not need to understand every word. Look for the information the question asks for.",
        text: exercise.text,
        questions: [exercise],
        seconds: 240,
      };
    return {
      id: lesson.id,
      title: lesson.title,
      prompt: exercise.prompt,
      help: exercise.help,
      model: exercise.model,
      questions: [],
      seconds: skill === "speaking" ? 120 : 600,
    };
  });
}

function taskTimeLimit(
  taskSeconds: number,
  suppliedLimit?: number,
): number {
  if (
    typeof suppliedLimit === "number" &&
    Number.isFinite(suppliedLimit) &&
    suppliedLimit > 0
  ) {
    return Math.max(1, Math.floor(suppliedLimit));
  }
  return taskSeconds;
}

function formatTimeLimit(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes && remainingSeconds)
    return `${minutes} minute${minutes === 1 ? "" : "s"} and ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`;
  if (minutes) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`;
}

function normaliseRetryText(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[.,!?;:()[\]{}"'`~…–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasMeaningfulTextChange(before: string, after: string): boolean {
  const previous = normaliseRetryText(before);
  const current = normaliseRetryText(after);
  if (current.length < 2 || current === previous) return false;

  const previousWords = previous.split(" ").filter(Boolean);
  const currentWords = current.split(" ").filter(Boolean);
  const changedWord = currentWords.some(
    (word, index) => word.length >= 2 && word !== previousWords[index],
  );
  const removedWord = previousWords.some(
    (word, index) => word.length >= 2 && word !== currentWords[index],
  );

  return changedWord || removedWord || Math.abs(current.length - previous.length) >= 2;
}

type StoredTimedAttempt = {
  version: 1;
  started: boolean;
  deadline: number | null;
  untimed: boolean;
};

function secondsLeftUntil(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function readTimedAttempt(key: string): StoredTimedAttempt | null {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<StoredTimedAttempt>;
    if (parsed.version !== 1 || typeof parsed.started !== "boolean") return null;
    if (typeof parsed.untimed !== "boolean") return null;
    if (
      parsed.deadline !== null &&
      parsed.deadline !== undefined &&
      (typeof parsed.deadline !== "number" || !Number.isFinite(parsed.deadline))
    )
      return null;
    return {
      version: 1,
      started: parsed.started,
      deadline: parsed.deadline ?? null,
      untimed: parsed.untimed,
    };
  } catch {
    return null;
  }
}

function writeTimedAttempt(key: string, value: StoredTimedAttempt) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* The attempt remains usable when browser storage is unavailable. */
  }
}

function clearTimedAttempt(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage is optional. */
  }
}

export default function PracticeStudio({
  initialSkill = "listening",
  level: requestedLevel = "A0",
  onComplete,
  exam = false,
  lessonId,
  lecture,
  initialDraft,
  onDraftChange,
  initialSaved = false,
  timed = false,
  timeLimitSeconds,
  requireChangedRetry = false,
}: Props) {
  const level = lecture?.level ?? requestedLevel;
  const embedded = Boolean(lecture || lessonId);
  const [selectedSkill, setSkill] = useState<Skill>(initialSkill);
  const skill = embedded ? initialSkill : selectedSkill;
  const [index, setIndex] = useState(0);
  const tasks = getTasks(skill, level, exam, lecture).filter(
    (task) => lecture || !lessonId || task.id === lessonId,
  );
  const taskIndex = Math.min(index, Math.max(0, tasks.length - 1));
  const task = tasks[taskIndex];
  const chapter = lecture ? storyChapters[lecture.module] : null;
  return (
    <section className={styles.studio} data-embedded={embedded}>
      <Tabs
        value={skill}
        onValueChange={(value) => {
          setSkill(value as Skill);
          setIndex(0);
        }}
      >
        {!embedded && (
          <TabsList aria-label="Practice skill" className={styles.tabs}>
            {skills.map((item) => {
              const Icon = SKILL_CONFIG[item].icon;
              return (
                <TabsTrigger key={item} value={item} className={styles.tab}>
                  <Icon size={17} />
                  <span>{SKILL_CONFIG[item].title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}
        {skills.map((item) => (
          <TabsContent key={item} value={item}>
            {task && item === skill ? (
              <>
                {lecture && chapter && (
                  <div className={styles.storyBridge}>
                    <div className={styles.storyBridgeCopy}>
                      <span className={styles.eyebrow}>
                        YOUR MISSION · EPISODE {lecture.number}
                      </span>
                      <h2>{lecture.route.expectedOutput}</h2>
                      <p>
                        Stay in {chapter.setting.toLocaleLowerCase()}. Try it
                        first, use support only when you need it, then change
                        one detail for a second attempt.
                      </p>
                      <ul className={styles.missionChecks}>
                        {lecture.route.successChecks.slice(0, 3).map((check) => (
                          <li key={check}>{check}</li>
                        ))}
                      </ul>
                      <StoryCast
                        names={chapter.cast}
                        label="In the scene"
                        compact
                      />
                    </div>
                    <Image
                      src={practiceArt[skill]}
                      alt={SKILL_CONFIG[skill].title + " story practice"}
                      width={280}
                      height={280}
                      sizes="(max-width: 600px) 120px, 180px"
                    />
                  </div>
                )}
                <div className={styles.intro}>
                  <div>
                    <span className={styles.eyebrow}>
                      {SKILL_CONFIG[skill].swedish} ·{" "}
                      {exam
                        ? "B1 exam preparation"
                        : lecture
                          ? "Episode " + lecture.number + " practice"
                          : level + " practice"}
                    </span>
                    <h2>
                      {lecture
                        ? SKILL_CONFIG[skill].title + ": complete your mission"
                        : SKILL_CONFIG[skill].title + " studio"}
                    </h2>
                    <p>
                      {lecture
                        ? `First attempt: ${lecture.route.expectedOutput}`
                        : SKILL_CONFIG[skill].description}
                    </p>
                  </div>
                  {!embedded && (
                    <label className={styles.taskSelect}>
                      Choose an exercise
                      <select
                        className="field"
                        value={taskIndex}
                        onChange={(event) =>
                          setIndex(Number(event.target.value))
                        }
                      >
                        {tasks.map((item, itemIndex) => (
                          <option key={item.id} value={itemIndex}>
                            {itemIndex + 1}. {item.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <Exercise
                  key={`${skill}-${level}-${exam}-${task.id}-${timed ? "timed" : "open"}-${timeLimitSeconds ?? "task"}-${requireChangedRetry ? "retry" : "first"}`}
                  task={task}
                  skill={skill}
                  level={level}
                  exam={exam}
                  timed={timed}
                  timeLimitSeconds={timeLimitSeconds}
                  requireChangedRetry={requireChangedRetry}
                  embedded={embedded}
                  lecture={lecture}
                  initialDraft={initialDraft}
                  onDraftChange={onDraftChange}
                  initialSaved={initialSaved}
                  onComplete={onComplete}
                  onNext={() => setIndex((taskIndex + 1) % tasks.length)}
                />
              </>
            ) : item === skill ? (
              <div className="panel">
                No exercises are available for this level yet.
              </div>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function Exercise({
  task,
  skill,
  level,
  exam,
  timed,
  timeLimitSeconds,
  requireChangedRetry,
  embedded,
  lecture,
  onComplete,
  onNext,
  initialDraft,
  onDraftChange,
  initialSaved = false,
}: {
  task: Task;
  skill: Skill;
  level: Level;
  exam: boolean;
  timed: boolean;
  timeLimitSeconds?: number;
  requireChangedRetry: boolean;
  embedded: boolean;
  lecture?: CourseLecture;
  onComplete?: Props["onComplete"];
  onNext: () => void;
  initialDraft?: string;
  onDraftChange?: Props["onDraftChange"];
  initialSaved?: boolean;
}) {
  const isProductive = skill === "speaking" || skill === "writing";
  const isTimed = exam || timed;
  const timeLimit = taskTimeLimit(task.seconds, timeLimitSeconds);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [selfChecks, setSelfChecks] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [draftLoaded, setDraftLoaded] = useState(initialDraft !== undefined);
  const suppliedDraft = useRef(initialDraft);
  const draftPublisher = useRef(onDraftChange);
  const publishedDraft = useRef(initialDraft ?? "");
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [busy, setBusy] = useState<"feedback" | "transcription" | null>(null);
  const [error, setError] = useState("");
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [savedHere, setSaved] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const saved = (initialSaved && !repeating) || savedHere;
  const [saving, setSaving] = useState(false);
  const savePending = useRef(false);
  const attemptId = useRef<string | null>(null);
  const [started, setStarted] = useState(!isTimed || initialSaved);
  const [remaining, setRemaining] = useState(timeLimit);
  const [untimed, setUntimed] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [restoredTimedSessionKey, setRestoredTimedSessionKey] = useState<
    string | null
  >(null);
  const [recording, setRecording] = useState(false);
  const [micPending, setMicPending] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingExtension, setRecordingExtension] = useState("webm");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recordedBlob = useRef<Blob | null>(null);
  const recordingPlayback = useRef<HTMLAudioElement | null>(null);
  const url = useRef("");
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStarted = useRef(0);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);
  const sessionStarted = useRef(0);
  // Keep the independent first attempt as a stable value. A state snapshot is
  // render-safe and lets the retry check compare against the original answer.
  const [initialRetryDraft] = useState(() => initialDraft ?? "");
  const draftMode = exam ? "exam" : timed ? `timed-${timeLimit}` : level;
  const draftKey = `stigen:practice-draft:${draftMode}:${skill}:${task.id}`;
  const timedSessionKey = isTimed
    ? `stigen:timed-practice:v1:${exam ? "exam" : "episode"}:${encodeURIComponent(lecture?.id ?? task.id)}:${skill}:${encodeURIComponent(task.id)}:${timeLimit}`
    : null;
  const timerRestored =
    !isTimed || restoredTimedSessionKey === timedSessionKey;
  const storageKey = useRef<string | null>(null);
  const expired = isTimed && started && remaining === 0 && !untimed;
  const locked = (isTimed && (!timerRestored || !started)) || expired || saved;
  const canFeedback = Boolean(ai?.signedIn && ai.capabilities?.feedback);
  const canTranscribe = Boolean(ai?.signedIn && ai.capabilities?.transcription);
  const canLiveVoice = Boolean(ai?.signedIn && ai.capabilities?.liveVoice);
  const feedbackProvider =
    ai?.provider === "azure" ? "Azure Foundry" : "the configured AI provider";
  const handleLiveActiveChange = useCallback((active: boolean) => {
    if (active) recordingPlayback.current?.pause();
    setLiveActive(active);
  }, []);
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const hasFirstAttempt =
    isProductive && (draft.trim().length >= 2 || Boolean(recordingUrl));
  const retryIsRequired =
    isProductive &&
    requireChangedRetry &&
    normaliseRetryText(initialRetryDraft).length > 0;
  const hasChangedTypedRetry =
    retryIsRequired && hasMeaningfulTextChange(initialRetryDraft, draft);
  const hasChangedRecordingRetry =
    retryIsRequired && Boolean(recordingUrl) && recordedSeconds >= 1;
  const changedRetryReady =
    !retryIsRequired || hasChangedTypedRetry || hasChangedRecordingRetry;
  const timerStillProtectsFirstAttempt =
    isTimed && timerRestored && !untimed && !expired && !saved;
  const feedbackAvailableNow =
    canFeedback && (!isTimed || expired || untimed || saved);
  const quizScore = task.questions.length
    ? Math.round(
        (task.questions.filter((q, i) => answers[i] === q.options[q.answer]).length /
          task.questions.length) *
          100,
      )
    : 0;
  const checklist =
    skill === "speaking"
      ? [
          "I answered all parts of the prompt.",
          recordingUrl
            ? "I listened back and could understand my message."
            : "I said my response out loud and checked its meaning.",
          "I tried the answer again using one improvement.",
        ]
      : [
          "I answered all parts of the prompt.",
          "I checked my verbs, endings, and word order.",
          "My message has a clear beginning and ending.",
        ];

  useEffect(() => {
    let active = true;
    mounted.current = true;
    sessionStarted.current = Date.now();
    const controller = new AbortController();
    const statusTimeout = setTimeout(() => controller.abort(), 10_000);
    function hydrate(status: AiStatus | null) {
      if (!active || !mounted.current) return;
      setAi(status ?? { configured: false, signedIn: false, available: false });
      // Keep drafts isolated between signed-in users. When identity cannot be
      // checked, keep the draft in memory rather than opening another user's draft.
      storageKey.current = status
        ? `${draftKey}:${encodeURIComponent(status.userId ?? "guest")}`
        : null;
      try {
        if (suppliedDraft.current === undefined && storageKey.current)
          setDraft(sessionStorage.getItem(storageKey.current) ?? "");
      } catch {
        /* Storage is optional. */
      }
      setDraftLoaded(true);
    }
    fetch("/api/ai-status", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        const status = result as Partial<AiStatus> | null;
        hydrate(
          status &&
            typeof status.available === "boolean" &&
            typeof status.configured === "boolean" &&
            typeof status.signedIn === "boolean"
            ? (status as AiStatus)
            : null,
        );
      })
      .catch(() => hydrate(null))
      .finally(() => clearTimeout(statusTimeout));
    return () => {
      active = false;
      mounted.current = false;
      clearTimeout(statusTimeout);
      controller.abort();
      request.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, [draftKey]);

  // Publishing and hydration have separate effects: an inline parent callback
  // must not tear down a microphone, overwrite edits, or re-read tab storage.
  useEffect(() => {
    draftPublisher.current = onDraftChange;
  }, [onDraftChange]);
  useEffect(() => {
    if (!draftLoaded || draft === publishedDraft.current) return;
    publishedDraft.current = draft;
    draftPublisher.current?.(draft);
  }, [draft, draftLoaded]);

  useEffect(() => {
    if (draftLoaded && storageKey.current) {
      try {
        sessionStorage.setItem(storageKey.current, draft);
      } catch {
        /* Keep the in-memory draft usable. */
      }
    }
  }, [draft, draftKey, draftLoaded]);

  // A timed task is a deadline, not a decrementing counter. Saving the
  // deadline in this browser session means a route change, reload, or brief
  // detour cannot quietly offer the learner a new first attempt.
  useEffect(() => {
    if (!isTimed || !timedSessionKey) return;
    if (initialSaved && !repeating) {
      setStarted(true);
      setUntimed(false);
      setDeadline(null);
      setRemaining(timeLimit);
      setRestoredTimedSessionKey(timedSessionKey);
      return;
    }

    const stored = readTimedAttempt(timedSessionKey);
    if (!stored?.started) {
      setStarted(false);
      setUntimed(false);
      setDeadline(null);
      setRemaining(timeLimit);
      setRestoredTimedSessionKey(timedSessionKey);
      return;
    }

    setStarted(true);
    setUntimed(stored.untimed);
    if (stored.untimed) {
      setDeadline(null);
      setRemaining(timeLimit);
    } else {
      // Do not replace an incomplete saved timer with a fresh duration. If a
      // stored deadline is missing, safely surface an expired attempt instead.
      const restoredDeadline = stored.deadline ?? Date.now();
      setDeadline(restoredDeadline);
      setRemaining(secondsLeftUntil(restoredDeadline));
    }
    setRestoredTimedSessionKey(timedSessionKey);
  }, [
    initialSaved,
    isTimed,
    repeating,
    timeLimit,
    timedSessionKey,
  ]);

  useEffect(() => {
    if (!isTimed || !timedSessionKey || !timerRestored || saved) return;
    if (!started) {
      clearTimedAttempt(timedSessionKey);
      return;
    }
    writeTimedAttempt(timedSessionKey, {
      version: 1,
      started: true,
      deadline: untimed ? null : deadline,
      untimed,
    });
  }, [
    deadline,
    isTimed,
    saved,
    started,
    timedSessionKey,
    timerRestored,
    untimed,
  ]);

  useEffect(() => {
    const activeDeadline = deadline;
    if (!timerRestored || activeDeadline === null || untimed || saved) return;
    const timerDeadline: number = activeDeadline;
    function tick() {
      const left = secondsLeftUntil(timerDeadline);
      setRemaining(left);
      if (!left && recorder.current?.state === "recording")
        recorder.current.stop();
    }
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [deadline, saved, timerRestored, untimed]);

  function startTimedAttempt() {
    if (!timedSessionKey) return;
    const nextDeadline = Date.now() + timeLimit * 1000;
    // Persist immediately as well as in the state effect. This closes the
    // small gap between pressing Start and navigating to another route.
    writeTimedAttempt(timedSessionKey, {
      version: 1,
      started: true,
      deadline: nextDeadline,
      untimed: false,
    });
    setStarted(true);
    setUntimed(false);
    setDeadline(nextDeadline);
    setRemaining(timeLimit);
    sessionStarted.current = Date.now();
  }

  function continueTimedAttemptUntimed() {
    if (timedSessionKey) {
      writeTimedAttempt(timedSessionKey, {
        version: 1,
        started: true,
        deadline: null,
        untimed: true,
      });
    }
    setUntimed(true);
    setDeadline(null);
  }

  async function startRecording() {
    setError("");
    setMicPending(true);
    recordingPlayback.current?.pause();
    window.dispatchEvent(new Event("stigen:stop-audio"));
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Recording is unavailable in this browser. You can still practise out loud and type your answer below.",
      );
      setMicPending(false);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      if (deadline && !untimed && Date.now() >= deadline) {
        media.getTracks().forEach((track) => track.stop());
        setError(
          "The task timer ended while the microphone was opening. Continue untimed to record your answer.",
        );
        return;
      }
      stream.current = media;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      rec.onstop = () => {
        media.getTracks().forEach((track) => track.stop());
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        if (!mounted.current) return;
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        recordedBlob.current = blob;
        if (url.current) URL.revokeObjectURL(url.current);
        url.current = URL.createObjectURL(blob);
        setRecordingUrl(url.current);
        setRecordingExtension(blob.type.includes("mp4") ? "mp4" : "webm");
        setRecording(false);
      };
      rec.onerror = () => {
        media.getTracks().forEach((track) => track.stop());
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        if (mounted.current) {
          setRecording(false);
          setError(
            "Recording stopped unexpectedly. Please try again or type your answer.",
          );
        }
      };
      rec.start();
      setRecording(true);
      setRecordedSeconds(0);
      recordingStarted.current = Date.now();
      recordingTimer.current = setInterval(() => {
        const seconds = Math.floor(
          (Date.now() - recordingStarted.current) / 1000,
        );
        setRecordedSeconds(seconds);
        if (seconds >= 180 && rec.state === "recording") rec.stop();
      }, 300);
    } catch {
      if (mounted.current) {
        setError(
          "The microphone could not open. Allow microphone access in browser settings, or type what you want to say below.",
        );
        stream.current?.getTracks().forEach((track) => track.stop());
      }
    } finally {
      if (mounted.current) setMicPending(false);
    }
  }

  async function getFeedback() {
    if (!draft.trim() || busy || !feedbackAvailableNow) return;
    setError("");
    setBusy("feedback");
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => {
      controller.abort();
      if (mounted.current)
        setError("Feedback took too long. Your draft is safe; please retry.");
    }, 55_000);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, skill, text: draft, exam }),
        signal: controller.signal,
      });
      const result = (await response.json()) as {
        error?: string;
        feedback?: PracticeFeedback;
      };
      if (!response.ok)
        throw new Error(
          result.error || "Feedback was unavailable. Your draft is safe.",
        );
      if (!result.feedback)
        throw new Error(
          "The feedback response was incomplete. Your draft is safe; please try again.",
        );
      if (mounted.current) setFeedback(result.feedback);
    } catch (caught) {
      if (
        mounted.current &&
        !(caught instanceof Error && caught.name === "AbortError")
      )
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to connect. Your draft is safe.",
        );
    } finally {
      clearTimeout(timeout);
      if (mounted.current) setBusy(null);
    }
  }

  async function transcribe() {
    if (!recordedBlob.current || busy) return;
    setError("");
    setBusy("transcription");
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => {
      controller.abort();
      if (mounted.current)
        setError(
          "Transcription took too long. Your recording is still here; please retry.",
        );
    }, 55_000);
    const form = new FormData();
    const extension = recordedBlob.current.type.includes("mp4")
      ? "mp4"
      : "webm";
    form.set("audio", recordedBlob.current, `finnish-practice.${extension}`);
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const result = (await response.json()) as {
        error?: string;
        text?: string;
      };
      if (!response.ok)
        throw new Error(
          result.error ||
            "Transcription unavailable. Type what you said below.",
        );
      if (typeof result.text !== "string")
        throw new Error(
          "The transcript was incomplete. Your recording is safe; please try again.",
        );
      if (mounted.current) {
        const updated = draft.trim() ? `${draft}\n${result.text}` : result.text;
        if (updated.length > 5000)
          setError(
            "This transcript would exceed the 5,000-character draft limit. Your current draft and recording are preserved; type a shorter excerpt instead.",
          );
        else {
          setDraft(updated);
          setFeedback(null);
        }
      }
    } catch (caught) {
      if (
        mounted.current &&
        !(caught instanceof Error && caught.name === "AbortError")
      )
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to connect. Your recording is safe.",
        );
    } finally {
      clearTimeout(timeout);
      if (mounted.current) setBusy(null);
    }
  }

  function addLiveTranscript(text: string): boolean {
    const updated = draft.trim() ? `${draft}\n\n${text}` : text;
    if (updated.length > 5000) {
      setError(
        "Adding this conversation would exceed the 5,000-character draft limit. Your draft is unchanged; copy a shorter part of your words from the conversation above.",
      );
      return false;
    }
    setDraft(updated);
    setFeedback(null);
    setSelfChecks([false, false, false]);
    setError("");
    return true;
  }

  async function save() {
    if (saved || savePending.current) return;
    if (retryIsRequired && !changedRetryReady) {
      setError(
        "Keep your first response, then add a meaningfully changed typed answer or make a fresh recording before you save this retry.",
      );
      return;
    }
    savePending.current = true;
    setSaving(true);
    setError("");
    attemptId.current ??= crypto.randomUUID();
    if (recorder.current?.state === "recording") recorder.current.stop();
    try {
      await onComplete?.(
        skill,
        isProductive ? null : quizScore,
        Math.max(1, Math.round((Date.now() - sessionStarted.current) / 60000)),
        attemptId.current,
      );
      if (mounted.current) setSaved(true);
    } catch {
      if (mounted.current)
        setError(
          "Your practice could not be saved. Your answer is still here; please try saving again.",
        );
    } finally {
      savePending.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return (
    <div className={styles.layout}>
      <article className={`panel ${styles.exercise}`}>
        <div className={styles.exerciseHeader}>
          <span className="badge">
            {exam
              ? "YKI-style task"
              : isTimed
                ? "Timed episode mission"
              : lecture
                ? "Your turn in the scene"
                : "Build your confidence"}
          </span>
          {isTimed && (
            <span
              className={`${styles.timer} ${expired ? styles.timerExpired : ""}`}
              role="timer"
              aria-live="off"
              aria-label={
                untimed
                  ? "Timer is off; you are continuing untimed"
                  : expired
                    ? "Time is up"
                    : `${formatTimeLimit(remaining)} remaining`
              }
            >
              <Clock3 size={15} />
              {!timerRestored
                ? "Restoring…"
                : untimed
                ? "Untimed practice"
                : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
            </span>
          )}
        </div>
        <h3>{task.title}</h3>
        <p className={styles.prompt}>{task.prompt}</p>
        {lecture && (
          <div className={styles.transferPlan}>
            <span className={styles.eyebrow}>AFTER YOUR FIRST ATTEMPT</span>
            <p>
              Read only the one or two useful corrections, then retry with this
              changed condition: <b>{lecture.route.transferPrompt}</b>
            </p>
          </div>
        )}
        {retryIsRequired && (
          <div
            id={`retry-guidance-${task.id}`}
            className={styles.retryGuidance}
            data-ready={changedRetryReady}
            role="status"
            aria-live="polite"
          >
            <span className={styles.eyebrow}>CHANGED RETRY</span>
            <strong>
              {changedRetryReady
                ? "Your changed retry is ready to save."
                : "Add a real change before you save this retry."}
            </strong>
            <p>
              {changedRetryReady
                ? "Stigen has not cleared your first draft. Use the new response as evidence of what you changed."
                : "Your first draft stays in the text box. Add a changed version after a blank line, or make a fresh recording. Changing only punctuation will not unlock saving."}
            </p>
          </div>
        )}
        {isTimed && !timerRestored && (
          <div className={styles.notice} role="status">
            Restoring your timed attempt…
          </div>
        )}
        {isTimed && timerRestored && !started && (
          <div className={styles.notice} role="status">
            <p>
              {exam
                ? "This is original YKI-style practice, not an official exam paper. The timer starts when you are ready."
                : "This episode keeps its own scene and task. Start the timer when you are ready to make an independent first attempt."}
            </p>
            <p className={styles.timedCondition}>
              You have {formatTimeLimit(timeLimit)}. Live conversation and
              model answers stay off while the timer is
              running. You can record or type your own response.
            </p>
            <button
              className="primary"
              onClick={startTimedAttempt}
            >
              {exam ? "Start timed task" : "Start timed mission"} <ArrowRight size={16} />
            </button>
          </div>
        )}
        {expired && !saved && (
          <div className={styles.notice} role="status">
            <strong>Time is up. Your work is still here.</strong>
            <p>Review your current answer or continue without the timer.</p>
            <div className={styles.actions}>
              <button
                className="primary"
                disabled={saving || Boolean(busy) || !changedRetryReady}
                onClick={() => {
                  if (!isProductive) setChecked(true);
                  void save();
                }}
              >
                {saving ? "Saving…" : "Finish and review"}
              </button>
              <button
                className="secondary"
                disabled={saving}
                onClick={continueTimedAttemptUntimed}
              >
                Continue untimed
              </button>
            </div>
          </div>
        )}
        {(!isTimed || started) && (
          <div className="exercise-body">
            {skill === "listening" && (
              <div className={styles.listening}>
                <div className={styles.audioGraphic} aria-hidden="true">
                  {[
                    18, 30, 21, 43, 30, 54, 37, 22, 46, 59, 34, 19, 43, 27, 48,
                    22, 37, 53, 26, 17,
                  ].map((height, i) => (
                    <span key={i} style={{ height }} />
                  ))}
                </div>
                <p>Listen for meaning. A second listen is welcome.</p>
                <div className={styles.actions}>
                  <AudioButton
                    text={task.text ?? ""}
                    label="Play Swedish audio"
                  />
                  <AudioButton
                    text={task.text ?? ""}
                    label="Play slowly"
                    slow
                  />
                </div>
                <small>Swedish text-to-speech · replay at your own pace</small>
                <button
                  className="text-button"
                  onClick={() => setShowTranscript(!showTranscript)}
                  aria-expanded={showTranscript}
                >
                  {showTranscript
                    ? "Hide transcript"
                    : "Show transcript / audio alternative"}
                </button>
                {showTranscript && (
                  <p lang="sv" className={styles.passage}>
                    {task.text}
                  </p>
                )}
              </div>
            )}
            {skill === "reading" && lecture?.reading_passage && (
              <ReadingPassageCard passage={lecture.reading_passage} />
            )}
            {skill === "reading" && task.text && (
              <div className={styles.passage} lang="sv">
                {task.text}
              </div>
            )}
            {!isProductive && (
              <div className={styles.questions}>
                {task.questions.map((question, questionIndex) => (
                  <QuestionCard
                    key={questionIndex}
                    id={`${task.id}-q${questionIndex}`}
                    prompt={question.question}
                    options={question.options}
                    value={answers[questionIndex] ?? ""}
                    onChange={(v) => setAnswers({ ...answers, [questionIndex]: v })}
                    checked={checked}
                    correct={answers[questionIndex] === question.options[question.answer]}
                    explanation={question.explanation}
                    correctOption={question.options[question.answer]}
                    disabled={locked || checked}
                    index={task.questions.length > 1 ? questionIndex : undefined}
                  />
                ))}
                {!checked ? (
                  <button
                    className="primary"
                    disabled={
                      locked ||
                      Object.keys(answers).length !== task.questions.length
                    }
                    onClick={() => setChecked(true)}
                  >
                    Check {task.questions.length === 1 ? "answer" : "answers"}{" "}
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <p className={styles.score}>
                    <CheckCircle2 size={18} />
                    {
                      task.questions.filter((q, i) => answers[i] === q.options[q.answer])
                        .length
                    }{" "}
                    of {task.questions.length} correct · Take a moment to read
                    the explanation.
                  </p>
                )}
              </div>
            )}
            {skill === "speaking" && !isTimed && (
              <LiveVoice
                contextId={task.id}
                available={canLiveVoice}
                signedIn={Boolean(ai?.signedIn)}
                disabled={
                  locked ||
                  recording ||
                  micPending ||
                  Boolean(busy) ||
                  saving ||
                  !draftLoaded
                }
                onTranscript={addLiveTranscript}
                onActiveChange={handleLiveActiveChange}
              />
            )}
            {skill === "speaking" && (
              <div className={styles.recorder}>
                <div
                  className={`${styles.micCircle} ${recording ? styles.recording : ""}`}
                >
                  <Mic size={27} />
                </div>
                <strong>
                  {recording
                    ? "Recording your Swedish…"
                    : recordingUrl
                      ? "Your voice, your progress"
                      : "Ready when you are"}
                </strong>
                <p>
                  {recording
                    ? `${Math.floor(recordedSeconds / 60)}:${String(recordedSeconds % 60).padStart(2, "0")} · 3-minute recording limit`
                    : isTimed
                      ? "Live conversation is paused for this timed attempt. Record a short answer or type it below."
                      : "Find a quiet spot. A few simple sentences are enough."}
                </p>
                <button
                  className={recording ? "secondary" : "primary"}
                  disabled={locked || micPending || Boolean(busy) || liveActive}
                  onClick={() =>
                    recording ? recorder.current?.stop() : void startRecording()
                  }
                >
                  {micPending ? (
                    <Loader2 size={17} className={styles.spinner} />
                  ) : recording ? (
                    <Square size={16} />
                  ) : (
                    <Mic size={17} />
                  )}
                  {micPending
                    ? "Opening microphone…"
                    : recording
                      ? "Stop recording"
                      : recordingUrl
                        ? "Record again"
                        : "Start recording"}
                </button>
                {recordingUrl && !recording && !liveActive && (
                  <div className={styles.recordingPlayback}>
                    <audio
                      ref={recordingPlayback}
                      controls
                      src={recordingUrl}
                      aria-label="Your Swedish recording"
                    />
                    <a
                      href={recordingUrl}
                      download={`finnish-${task.id}.${recordingExtension}`}
                      className="text-button"
                    >
                      Download recording
                    </a>
                    {canTranscribe && (
                      <button
                        className="secondary"
                        onClick={transcribe}
                        disabled={Boolean(busy) || recording || locked}
                      >
                        {busy === "transcription" ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        {busy === "transcription"
                          ? "Transcribing…"
                          : "Transcribe with AI"}
                      </button>
                    )}
                  </div>
                )}
                <small>
                  {canTranscribe
                    ? "Recording stays in this tab until you choose AI transcription. Download it to keep a copy."
                    : "Recordings stay in this tab. Download a copy and type what you said below; file transcription is not connected."}
                </small>
              </div>
            )}
            {isProductive && (
              <>
                <label
                  className={styles.draftLabel}
                  htmlFor={`draft-${task.id}`}
                >
                  {skill === "speaking"
                    ? "What did you say?"
                    : "Your Swedish response"}
                  <span>
                    {skill === "speaking"
                      ? "Type your words, edit a transcript, or add your words from a live conversation."
                      : "Start small. Being understood matters more than being perfect."}
                  </span>
                </label>
                <textarea
                  id={`draft-${task.id}`}
                  className={`field ${styles.draft}`}
                  value={draft}
                  maxLength={5000}
                  rows={skill === "speaking" ? 5 : 8}
                  placeholder={
                    level === "A0" ? "Hej! Jag heter…" : "Skriv här…"
                  }
                  disabled={!draftLoaded || locked || Boolean(busy)}
                  aria-describedby={
                    retryIsRequired ? `retry-guidance-${task.id}` : undefined
                  }
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setFeedback(null);
                    setError("");
                  }}
                  spellCheck
                  lang="sv"
                />
                <div className={styles.draftMeta}>
                  <span>
                    {wordCount} {wordCount === 1 ? "word" : "words"} ·{" "}
                    {draft.length}/5,000 characters
                  </span>
                  <span>
                    {onDraftChange ? "Lecture draft" : "Draft kept in this tab"}
                  </span>
                </div>
                <div className={styles.aiState}>
                  <Sparkles size={17} />
                  <div>
                    <strong>
                      {ai === null
                        ? "Checking AI availability…"
                        : canFeedback && !feedbackAvailableNow
                          ? "Your feedback coach unlocks after the timed attempt"
                          : canFeedback
                          ? "Your Swedish feedback coach is connected"
                          : ai.configured && !ai.signedIn
                            ? "Sign in to use your AI coach"
                            : "Guided self-review is ready"}
                    </strong>
                    <p>
                      {canFeedback
                        ? !feedbackAvailableNow
                          ? "Work independently while the timer runs. You can review your response with AI after time is up or when you continue untimed."
                          : `${skill === "speaking" ? "Feedback covers your transcript’s language and task completion, not pronunciation." : "Get specific corrections, an improved version, and your next step."} Your response is sent to ${feedbackProvider} only when you ask for feedback.`
                        : "AI feedback is currently unavailable. Compare with the model answer and use the checklist below."}
                    </p>
                    {ai?.configured && !ai.signedIn && (
                      <a
                        href="/signin-with-chatgpt?return_to=/"
                        className="text-button"
                      >
                        Sign in with ChatGPT
                      </a>
                    )}
                  </div>
                </div>
                {canFeedback && feedbackAvailableNow && (
                  <button
                    className="primary"
                    disabled={
                      draft.trim().length < 2 ||
                      Boolean(busy) ||
                      locked ||
                      recording ||
                      liveActive
                    }
                    onClick={getFeedback}
                  >
                    {busy === "feedback" ? (
                      <Loader2 size={17} className={styles.spinner} />
                    ) : (
                      <Sparkles size={17} />
                    )}
                    {busy === "feedback"
                      ? "Reviewing your Swedish…"
                      : "Get AI feedback"}
                  </button>
                )}

                {feedback && (
                  <div
                    className={`feedback-box ${styles.feedback}`}
                    aria-live="polite"
                  >
                    <span className={styles.eyebrow}>
                      Your AI learning feedback
                    </span>
                    <h4>{feedback.summary}</h4>
                    <p className={styles.disclaimer}>
                      Learning feedback, not an official YKI assessment.
                    </p>
                    <ul>
                      {feedback.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                    <div className={styles.rubric}>
                      {feedback.rubric.map((item, index) => (
                        <div key={index}>
                          <strong>{item.criterion}</strong>
                          <span className="badge">{item.assessment}</span>
                          <p>{item.note}</p>
                        </div>
                      ))}
                    </div>
                    {feedback.corrections.length > 0 && (
                      <>
                        <h4>A few helpful corrections</h4>
                        {feedback.corrections.map((correction, index) => (
                          <div key={index} className={styles.correction}>
                            <p>
                              <del lang="sv">{correction.original}</del>
                              <ArrowRight size={14} />
                              <strong lang="sv">{correction.corrected}</strong>
                            </p>
                            <span>{correction.explanation}</span>
                          </div>
                        ))}
                      </>
                    )}
                    <h4>A more natural version</h4>
                    <p lang="sv" className={styles.passage}>
                      {feedback.improvedVersion}
                    </p>
                    <p>
                      <strong>Try next:</strong> {feedback.nextStep}
                    </p>
                  </div>
                )}
                <div className={styles.selfReview}>
                  <h4>
                    <CheckCircle2 size={19} /> Make it stick
                  </h4>
                  <p>
                    Use these checks after you compare your response with the
                    example.
                  </p>
                  {checklist.map((item, index) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={selfChecks[index]}
                        disabled={saved}
                        onChange={(event) =>
                          setSelfChecks(
                            selfChecks.map((value, i) =>
                              i === index ? event.target.checked : value,
                            ),
                          )
                        }
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </>
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {(saved ||
              checked ||
              (isProductive &&
                hasFirstAttempt &&
                (Boolean(feedback) || selfChecks.every(Boolean)))) && (
              <div className={styles.finish}>
                {saved ? (
                  <>
                    <p role="status">
                      <CheckCircle2 size={19} /> Practice saved. Another small
                      step forward.
                    </p>
                    {!embedded && (
                      <button className="primary" onClick={onNext}>
                        Next exercise <ArrowRight size={16} />
                      </button>
                    )}
                    <button
                      className="secondary"
                      onClick={() => {
                        setRepeating(true);
                        setSaved(false);
                        setChecked(false);
                        setAnswers({});
                        setFeedback(null);
                        setSelfChecks([false, false, false]);
                        setError("");
                        attemptId.current = null;
                        sessionStarted.current = Date.now();
                        if (isTimed) {
                          if (timedSessionKey)
                            clearTimedAttempt(timedSessionKey);
                          setStarted(false);
                          setRemaining(timeLimit);
                          setDeadline(null);
                          setUntimed(false);
                          setRestoredTimedSessionKey(timedSessionKey);
                        }
                      }}
                    >
                      <RotateCcw size={15} />
                      Practise again
                    </button>
                  </>
                ) : (
                  <button
                    className="primary"
                    disabled={
                      saving ||
                      Boolean(busy) ||
                      recording ||
                      liveActive ||
                      (isTimed && !started) ||
                      !changedRetryReady
                    }
                    onClick={save}
                  >
                    {saving ? (
                      <Loader2 size={17} className={styles.spinner} />
                    ) : (
                      <Check size={17} />
                    )}
                    {saving
                      ? "Saving…"
                      : embedded
                        ? "Save this attempt"
                        : "Save practice"}
                  </button>
                )}
                {!saved && checked && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setChecked(false);
                      setAnswers({});
                    }}
                  >
                    <RotateCcw size={15} /> Try again
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </article>
      <aside className={styles.side}>
        <div className={`panel ${styles.support}`}>
          <div className={styles.tipIcon}>
            <Lightbulb size={20} />
          </div>
          <span className={styles.eyebrow}>A little support</span>
          <h3>You don’t need perfect Swedish.</h3>
          {Array.isArray(task.help) ? (
            <ul>
              {task.help.map((help, index) => (
                <li key={index}>{help}</li>
              ))}
            </ul>
          ) : (
            <p>{task.help}</p>
          )}
          {isProductive && task.model && (
            hasFirstAttempt && !timerStillProtectsFirstAttempt ? (
              <>
                <button
                  className="secondary"
                  onClick={() => setShowModel(!showModel)}
                  aria-expanded={showModel}
                >
                  {showModel ? "Hide model answer" : "See a model answer"}
                  <BookOpen size={16} />
                </button>
                {showModel && (
                  <div className={styles.model}>
                    <p lang="sv">{task.model}</p>
                    <AudioButton
                      text={task.model}
                      label="Listen to the example"
                      slow={level === "A0" || level === "A1"}
                    />
                    <small>
                      One possible response. Your own ideas are welcome.
                    </small>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.modelUnlock}>
                {timerStillProtectsFirstAttempt
                  ? "The model answer unlocks after the timed attempt, so you can work independently first."
                  : "Make a short first attempt to unlock the model answer."}
              </p>
            )
          )}
        </div>
        <div className={styles.gentleTip}>
          <span>PIENIN ASKELIN</span>
          <p>
            {skill === "speaking"
              ? "Speak a little today. It will feel a little easier tomorrow."
              : skill === "listening"
                ? "You’re training your ear, not testing your worth."
                : skill === "writing"
                  ? "A message that gets your meaning across is a good beginning."
                  : "Recognising one more word is progress."}
          </p>
          <small>Small steps, every day.</small>
        </div>
      </aside>
    </div>
  );
}
