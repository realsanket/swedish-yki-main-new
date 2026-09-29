"use client";
/* Session timer recovery intentionally hydrates client state after SSR. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Clock3, Headphones, Mic, PenLine } from "lucide-react";
import type { CourseLecture } from "@/lib/course";
import type { Skill } from "@/lib/curriculum";
import AudioButton from "./AudioButton";
import styles from "./YkiWorkshopFirstAttempt.module.css";

type Props = {
  lecture: CourseLecture;
  skill: Skill;
  minutes: number;
  value: string;
  /**
   * A revised workshop may move the first attempt to a different skill slot.
   * The value is still valid learner evidence; this flag explains why earlier
   * work is appearing in the new slot.
   */
  recoveredFromLegacySlot?: boolean;
  onChange: (value: string) => void;
};

type StoredTimer = {
  version: 1;
  started: boolean;
  deadline: number | null;
  untimed: boolean;
};

function secondsLeft(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function readStoredTimer(key: string): StoredTimer | null {
  try {
    const value = sessionStorage.getItem(key);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<StoredTimer>;
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

function writeStoredTimer(key: string, value: StoredTimer) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Timed attempts still work when session storage is unavailable. */
  }
}

function taskFor(lecture: CourseLecture, skill: Skill) {
  if (skill === "listening") {
    return {
      icon: Headphones,
      title: "Timed listening first attempt",
      instruction:
        "Listen without text support. State the main point, one detail and the action you would take.",
      prompt: lecture.listening.question,
      audio: lecture.listening.text,
      label: "What you heard (a few keywords are enough)",
    };
  }
  if (skill === "reading") {
    return {
      icon: PenLine,
      title: "Timed reading first attempt",
      instruction:
        "Read for purpose and action, not every unknown word. Write a short plain-language answer before opening any help.",
      prompt: lecture.reading.question,
      text: lecture.reading.text,
      label: "Your short answer",
    };
  }
  if (skill === "writing") {
    return {
      icon: PenLine,
      title: "Timed writing first attempt",
      instruction:
        "Write from the task points without opening a model. Save your first version so you can compare it with the retry.",
      prompt: lecture.writing.prompt,
      label: "Your first written response",
    };
  }
  return {
    icon: Mic,
    title: "Timed production first attempt",
    instruction:
      "Use keywords, not a script. Speak first, then type the words or keywords you used so you can improve the response later.",
    prompt: lecture.speaking.prompt,
    label: "What you said (or the keywords you used)",
  };
}

export default function YkiWorkshopFirstAttempt({
  lecture,
  skill,
  minutes,
  value,
  recoveredFromLegacySlot = false,
  onChange,
}: Props) {
  const task = taskFor(lecture, skill);
  const Icon = task.icon;
  const duration = minutes * 60;
  const timerKey = `stigen:timed-workshop:first-attempt:${lecture.id}`;
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(duration);
  const [untimed, setUntimed] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [restoredTimerKey, setRestoredTimerKey] = useState<string | null>(null);
  const timerRestored = restoredTimerKey === timerKey;
  const expired = started && !untimed && remaining === 0;
  const hasSavedAttempt = value.trim().length >= 2;

  useEffect(() => {
    const stored = readStoredTimer(timerKey);
    if (!stored?.started) {
      // Saved work may predate this timer. Open it as an untimed review instead
      // of hiding it behind a brand-new first-attempt clock.
      setStarted(hasSavedAttempt);
      setUntimed(hasSavedAttempt);
      setDeadline(null);
      setRemaining(duration);
      setRestoredTimerKey(timerKey);
      return;
    }

    setStarted(true);
    setUntimed(stored.untimed);
    if (stored.untimed) {
      setDeadline(null);
      setRemaining(duration);
    } else {
      // A missing or corrupted deadline must never create a fresh timed
      // attempt. Treat it as expired and keep the learner's typed evidence.
      const restoredDeadline = stored.deadline ?? Date.now();
      setDeadline(restoredDeadline);
      setRemaining(secondsLeft(restoredDeadline));
    }
    setRestoredTimerKey(timerKey);
  }, [duration, hasSavedAttempt, timerKey]);

  useEffect(() => {
    if (!timerRestored) return;
    if (!started) {
      try {
        sessionStorage.removeItem(timerKey);
      } catch {
        /* Storage is optional. */
      }
      return;
    }
    writeStoredTimer(timerKey, {
      version: 1,
      started: true,
      deadline: untimed ? null : deadline,
      untimed,
    });
  }, [deadline, started, timerKey, timerRestored, untimed]);

  useEffect(() => {
    const activeDeadline = deadline;
    if (
      !timerRestored ||
      !started ||
      untimed ||
      activeDeadline === null ||
      remaining === 0
    )
      return;
    const timerDeadline: number = activeDeadline;
    const tick = () => setRemaining(secondsLeft(timerDeadline));
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [deadline, remaining, started, timerRestored, untimed]);

  function startAttempt() {
    const nextDeadline = Date.now() + duration * 1000;
    // Write synchronously as well as through the effect so a navigation right
    // after Start cannot turn an active first attempt into a fresh one.
    writeStoredTimer(timerKey, {
      version: 1,
      started: true,
      deadline: nextDeadline,
      untimed: false,
    });
    setStarted(true);
    setUntimed(false);
    setDeadline(nextDeadline);
    setRemaining(duration);
  }

  function continueUntimed() {
    writeStoredTimer(timerKey, {
      version: 1,
      started: true,
      deadline: null,
      untimed: true,
    });
    setUntimed(true);
    setDeadline(null);
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span>FIRST ATTEMPT · NO MODEL OR TEXT SUPPORT</span>
        <div className={styles.timer} role="timer" aria-live="off">
          <Clock3 size={15} />
          {!timerRestored
            ? "Restoring…"
            : untimed
            ? "Untimed review"
            : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </div>
      </div>
      <Icon className={styles.icon} size={25} aria-hidden="true" />
      <h3>{task.title}</h3>
      <p>{task.instruction}</p>
      {!timerRestored ? (
        <p className={styles.resumeStatus} role="status">
          Restoring your timed attempt…
        </p>
      ) : !started ? (
        <button type="button" className="primary" onClick={startAttempt}>
          Start {minutes}-minute first attempt <Clock3 size={16} />
        </button>
      ) : expired ? (
        <div className={styles.timeUp} role="status">
          <b>Time is up.</b>
          <p>Your first attempt is still useful evidence. Continue untimed only if you need to finish it.</p>
          <button type="button" className="secondary" onClick={continueUntimed}>
            Continue untimed
          </button>
        </div>
      ) : (
        <>
          {task.audio && (
            <div className={styles.audio}>
              <AudioButton text={task.audio} label="Listen once" />
              <AudioButton text={task.audio} label="Listen slowly" slow />
            </div>
          )}
          {task.text && <p className={styles.source} lang="sv">{task.text}</p>}
          <p className={styles.prompt}>{task.prompt}</p>
          <label htmlFor={`workshop-attempt-${lecture.number}`}>
            {task.label}
            <textarea
              id={`workshop-attempt-${lecture.number}`}
              className="field"
              rows={5}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Kirjoita muutama sana tai lyhyt vastaus…"
              lang="sv"
            />
          </label>
          <small>
            {value.trim().length >= 2
              ? recoveredFromLegacySlot
                ? "Earlier workshop work is shown here. Edit or continue it; your updated work will save with this first-attempt task."
                : "First attempt saved. You will use a changed version in Timed retry."
              : "A short answer is enough to show your independent first attempt."}
          </small>
        </>
      )}
    </section>
  );
}
