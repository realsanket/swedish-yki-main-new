"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  Mic,
  PenLine,
  Square,
} from "lucide-react";
import type { Skill } from "@/lib/course-types";
import {
  parseYkiTargetedReturn,
  serializeYkiTargetedReturn,
} from "@/lib/yki-mocks";
import type {
  YkiMockListeningTask,
  YkiMockReadingTask,
  YkiMockSet,
  YkiMockSpeakingTask,
  YkiMockWritingTask,
} from "@/lib/yki-mocks";
import AudioButton from "./AudioButton";
import styles from "./YkiMockFlow.module.css";

type Stage = "listening" | "reading" | "production" | "diagnosis";
type ReceptiveTask = YkiMockListeningTask | YkiMockReadingTask;
type ProductionTask = YkiMockSpeakingTask | YkiMockWritingTask;

type ReceptiveEvidence = {
  kind: "yki-receptive";
  answers: Record<string, string>;
  checked: string[];
};

type ProductionEvidence = {
  kind: "yki-production";
  responses: Record<string, string>;
};

/**
 * A pre-redesign mock used one plain-text draft per productive skill. Keep
 * that learner work available in the interface without pretending it is a
 * response to one of the new, named mock tasks.
 */
type ParsedProductionEvidence = ProductionEvidence & {
  legacyContent?: string;
};

type SavedPractice = Partial<
  Record<Skill, { attemptId: string; score: number | null }>
>;

type Props = {
  mock: YkiMockSet;
  stage: Stage;
  drafts: Partial<Record<Skill, string>>;
  savedPractice: SavedPractice;
  onDraftChange: (skill: Skill, value: string) => void;
  onComplete: (skill: Skill, score: number | null, minutes: number) => Promise<void>;
  /** Stored in the existing course `assignment` field, never shown raw. */
  returnPlan: string;
  onReturnPlanChange: (value: string) => void;
};

const emptyReceptive = (): ReceptiveEvidence => ({
  kind: "yki-receptive",
  answers: {},
  checked: [],
});

const emptyProduction = (): ProductionEvidence => ({
  kind: "yki-production",
  responses: {},
});

function parseReceptive(raw?: string): ReceptiveEvidence {
  if (!raw) return emptyReceptive();
  try {
    const value = JSON.parse(raw) as Partial<ReceptiveEvidence>;
    if (value.kind !== "yki-receptive") return emptyReceptive();
    return {
      kind: "yki-receptive",
      answers:
        value.answers && typeof value.answers === "object"
          ? Object.fromEntries(
              Object.entries(value.answers).filter(
                ([, answer]) => typeof answer === "string",
              ),
            )
          : {},
      checked: Array.isArray(value.checked)
        ? value.checked.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return emptyReceptive();
  }
}

function parseProduction(raw?: string): ParsedProductionEvidence {
  if (!raw) return emptyProduction();
  try {
    const value = JSON.parse(raw) as Partial<ProductionEvidence> & {
      legacyContent?: unknown;
    };
    if (!value || typeof value !== "object" || Array.isArray(value))
      return { ...emptyProduction(), legacyContent: raw };
    if (value.kind !== "yki-production")
      return { ...emptyProduction(), legacyContent: raw };
    return {
      kind: "yki-production",
      responses:
        value.responses && typeof value.responses === "object"
          ? Object.fromEntries(
              Object.entries(value.responses).filter(
                ([, response]) => typeof response === "string",
              ),
            )
          : {},
      // Once an older free-form draft is opened in the redesigned mock, keep
      // it alongside the named responses. It remains a separate recovery
      // note, not a shortcut through the new task requirements.
      legacyContent:
        typeof value.legacyContent === "string" && value.legacyContent.trim()
          ? value.legacyContent
          : undefined,
    };
  } catch {
    return { ...emptyProduction(), legacyContent: raw };
  }
}

function serializeProduction(evidence: ParsedProductionEvidence) {
  const legacyContent = evidence.legacyContent?.trim()
    ? evidence.legacyContent
    : undefined;
  return JSON.stringify({
    kind: "yki-production",
    responses: evidence.responses,
    ...(legacyContent ? { legacyContent } : {}),
  });
}

function taskComplete(task: ReceptiveTask, evidence: ReceptiveEvidence) {
  return task.questions.every((question) => evidence.answers[question.id]);
}

function correctAnswers(tasks: ReceptiveTask[], evidence: ReceptiveEvidence) {
  const questions = tasks.flatMap((task) => task.questions);
  return questions.filter(
    (question) => evidence.answers[question.id] === question.options[question.answerIndex],
  ).length;
}

function formatMinutes(minutes: number) {
  return `${minutes} min`;
}

function stageLabel(stage: Stage) {
  if (stage === "listening") return "Timed listening";
  if (stage === "reading") return "Timed reading";
  if (stage === "production") return "Timed production";
  return "Diagnose by skill";
}

type BlockTimerStatus = "idle" | "timed" | "expired" | "review";
type StoredBlockTimer = {
  status: Exclude<BlockTimerStatus, "idle">;
  endsAt?: number;
};

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function blockTimerKey(mockId: string, block: string) {
  return `stigen-yki-mock-timer:${mockId}:${block}`;
}

function readBlockTimer(
  key: string,
  hasSavedWork: boolean,
): StoredBlockTimer | { status: "idle"; endsAt?: undefined } {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return hasSavedWork ? { status: "review" } : { status: "idle" };
    const stored = JSON.parse(raw) as Partial<StoredBlockTimer>;
    if (stored.status === "timed" && typeof stored.endsAt === "number") {
      return stored.endsAt > Date.now()
        ? { status: "timed", endsAt: stored.endsAt }
        : { status: "expired" };
    }
    if (stored.status === "expired" || stored.status === "review") {
      return { status: stored.status };
    }
  } catch {
    // A timer is purely a local condition. A bad local value must not hide a
    // saved answer or block a learner from reviewing it.
  }

  return hasSavedWork ? { status: "review" } : { status: "idle" };
}

function writeBlockTimer(key: string, value: StoredBlockTimer) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session storage is an enhancement only. The actual mock evidence stays
    // in the existing progress draft fields.
  }
}

function MockBlockTimer({
  mockId,
  block,
  minutes,
  hasSavedWork,
  complete,
  children,
}: {
  mockId: string;
  block: "listening" | "reading" | "production";
  minutes: number;
  hasSavedWork: boolean;
  complete: boolean;
  children: (state: { timed: boolean; reviewing: boolean }) => ReactNode;
}) {
  const totalSeconds = minutes * 60;
  const storageKey = blockTimerKey(mockId, block);
  const [timer, setTimer] = useState<StoredBlockTimer | { status: "idle" }>(
    () => (hasSavedWork ? { status: "review" } : { status: "idle" }),
  );
  const [remaining, setRemaining] = useState(totalSeconds);

  // A mock block has one clock. It survives a route revisit in this browser;
  // saved or partial work opens as review instead of quietly starting a new
  // timed attempt.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const restored = readBlockTimer(storageKey, hasSavedWork);
      setTimer(restored);
      setRemaining(
        restored.status === "timed" && restored.endsAt
          ? Math.max(0, Math.ceil((restored.endsAt - Date.now()) / 1000))
          : totalSeconds,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasSavedWork, storageKey, totalSeconds]);

  useEffect(() => {
    if (timer.status !== "timed" || !timer.endsAt) return;

    const tick = () => {
      const next = Math.max(0, Math.ceil((timer.endsAt! - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        const expired: StoredBlockTimer = { status: "expired" };
        setTimer(expired);
        writeBlockTimer(storageKey, expired);
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [storageKey, timer]);

  function startTimedBlock() {
    const next: StoredBlockTimer = {
      status: "timed",
      endsAt: Date.now() + totalSeconds * 1000,
    };
    setTimer(next);
    setRemaining(totalSeconds);
    writeBlockTimer(storageKey, next);
  }

  function finishTimedBlock() {
    const next: StoredBlockTimer = { status: "review" };
    setTimer(next);
    writeBlockTimer(storageKey, next);
  }

  const inTimedAttempt = timer.status === "timed";
  const reviewing = timer.status === "review";

  return (
    <div className={styles.blockTimer}>
      <div className={styles.timerRow}>
        <span
          className={styles.timer}
          role="timer"
          aria-live="off"
          aria-label={
            inTimedAttempt
              ? `${formatCountdown(remaining)} remaining in the ${formatMinutes(minutes)} ${block} block`
              : `${formatMinutes(minutes)} ${block} block`
          }
        >
          <Clock3 size={15} />
          {inTimedAttempt
            ? formatCountdown(remaining)
            : timer.status === "expired"
              ? "Time is up"
              : reviewing
                ? "Review saved work"
                : "Not started"}
        </span>
        <small>{formatMinutes(minutes)} timed {block} block</small>
      </div>

      {timer.status === "idle" && (
        <div className={styles.startCard}>
          <p>
            Start when you are ready. This one clock covers the whole {formatMinutes(minutes)} block;
            support and feedback stay closed during the first attempt.
          </p>
          <button type="button" className="primary" onClick={startTimedBlock}>
            Start {formatMinutes(minutes)} {block} block <Clock3 size={16} />
          </button>
        </div>
      )}

      {timer.status === "expired" && (
        <div className={styles.timeUp} role="status">
          <b>Time is up.</b>
          <p>Your first attempt is kept. Continue untimed to finish or review it; this will not start another clock.</p>
          <button type="button" className="secondary" onClick={finishTimedBlock}>
            Continue untimed
          </button>
        </div>
      )}

      {(inTimedAttempt || reviewing) && children({ timed: inTimedAttempt, reviewing })}

      {inTimedAttempt && complete && (
        <button type="button" className={styles.finishBlock} onClick={finishTimedBlock}>
          Finish this timed block and review <Check size={16} />
        </button>
      )}
    </div>
  );
}

function ReceptiveTaskCard({
  task,
  mode,
  evidence,
  canRevealSupport,
  onChange,
  onCheck,
}: {
  task: ReceptiveTask;
  mode: "listening" | "reading";
  evidence: ReceptiveEvidence;
  canRevealSupport: boolean;
  onChange: (questionId: string, answer: string) => void;
  onCheck: (taskId: string) => void;
}) {
  const checked = evidence.checked.includes(task.id);
  const ready = taskComplete(task, evidence);
  const [showTextSupport, setShowTextSupport] = useState(false);
  const listeningTask = mode === "listening" ? (task as YkiMockListeningTask) : null;
  const readingTask = mode === "reading" ? (task as YkiMockReadingTask) : null;

  return (
    <article className={styles.taskCard}>
      <div className={styles.taskHeader}>
        <span className={styles.taskNumber}>{task.title}</span>
        {checked && <CheckCircle2 size={18} aria-label="Feedback reviewed" />}
      </div>
      <p className={styles.instruction}>{task.instruction}</p>
      <div className={styles.taskBody}>
        {mode === "listening" ? (
          <div className={styles.listenBox}>
            <Headphones size={25} aria-hidden="true" />
            <p>Listen for the situation first, then for the detail the question asks about.</p>
            <div>
              <AudioButton text={listeningTask!.listeningText} label="Listen once" />
              <AudioButton text={listeningTask!.listeningText} label="Listen slowly" slow />
            </div>
            {(checked || canRevealSupport) && (
              <button
                type="button"
                className="text-button"
                onClick={() => setShowTextSupport((value) => !value)}
                aria-expanded={showTextSupport}
              >
                {showTextSupport ? "Hide transcript" : "Show transcript after your attempt"}
              </button>
            )}
            {showTextSupport && (
              <p className={styles.sourceText} lang="sv">{listeningTask!.listeningText}</p>
            )}
          </div>
        ) : (
          <div className={styles.readBox} lang="sv">{readingTask!.text}</div>
        )}
        <QuestionList
          questions={task.questions}
          answers={evidence.answers}
          checked={checked}
          disabled={false}
          onChange={onChange}
        />
        {!checked ? (
          <button
            type="button"
            className="primary"
            disabled={!ready}
            onClick={() => onCheck(task.id)}
          >
            Check this task <Check size={16} />
          </button>
        ) : (
          <TaskFeedback task={task} evidence={evidence} />
        )}
      </div>
    </article>
  );
}

function QuestionList({
  questions,
  answers,
  checked,
  disabled,
  onChange,
}: {
  questions: ReceptiveTask["questions"];
  answers: Record<string, string>;
  checked: boolean;
  disabled: boolean;
  onChange: (questionId: string, answer: string) => void;
}) {
  return (
    <div className={styles.questions}>
      {questions.map((question) => {
        const answer = answers[question.id];
        const correct = answer === question.options[question.answerIndex];
        return (
          <fieldset className={styles.question} key={question.id}>
            <legend>{question.prompt}</legend>
            {question.options.map((option) => (
              <label
                key={option}
                className={[
                  styles.option,
                  answer === option ? styles.selected : "",
                  checked && option === question.options[question.answerIndex]
                    ? styles.correct
                    : "",
                  checked && answer === option && !correct ? styles.incorrect : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  disabled={disabled || checked}
                  onChange={() => onChange(question.id, option)}
                />
                <span>{option}</span>
              </label>
            ))}
            {checked && <small>{question.explanation}</small>}
          </fieldset>
        );
      })}
    </div>
  );
}

function TaskFeedback({ task, evidence }: { task: ReceptiveTask; evidence: ReceptiveEvidence }) {
  const correct = correctAnswers([task], evidence);
  return (
    <p className={styles.feedback} role="status">
      <CheckCircle2 size={18} /> {correct}/{task.questions.length} correct. Read the explanations, then carry one useful detail into the next task.
    </p>
  );
}

function ReceptiveStage({
  mock,
  skill,
  tasks,
  rawEvidence,
  onDraftChange,
}: {
  mock: YkiMockSet;
  skill: "listening" | "reading";
  tasks: ReceptiveTask[];
  rawEvidence?: string;
  onDraftChange: Props["onDraftChange"];
}) {
  const [evidence, setEvidence] = useState(() => parseReceptive(rawEvidence));
  const stageComplete = tasks.every((task) => evidence.checked.includes(task.id));
  const hasSavedWork =
    evidence.checked.length > 0 || Object.keys(evidence.answers).length > 0;
  const correct = correctAnswers(tasks, evidence);
  const total = tasks.flatMap((task) => task.questions).length;
  const minutes = mock.timing.find((block) => block.id === skill)?.minutes ?? 10;

  function update(next: ReceptiveEvidence) {
    setEvidence(next);
    onDraftChange(skill, JSON.stringify(next));
  }

  return (
    <section className={styles.stage}>
      <MockHeader mock={mock} stage={skill} />
      <div className={styles.stageContract}>
        <b>{skill === "listening" ? "Predict → listen → answer → reveal support → replay" : "Read for purpose → locate detail → answer → check evidence"}</b>
        <p>Complete both original tasks before moving to the next timed block.</p>
      </div>
      <MockBlockTimer
        mockId={mock.id}
        block={skill}
        minutes={minutes}
        hasSavedWork={hasSavedWork}
        complete={stageComplete}
      >
        {({ reviewing }) => (
          <>
            {tasks.map((task) => (
              <ReceptiveTaskCard
                key={task.id}
                task={task}
                mode={skill}
                evidence={evidence}
                canRevealSupport={reviewing}
                onChange={(questionId, answer) =>
                  update({
                    ...evidence,
                    answers: { ...evidence.answers, [questionId]: answer },
                  })
                }
                onCheck={(taskId) =>
                  update({
                    ...evidence,
                    checked: [...new Set([...evidence.checked, taskId])],
                  })
                }
              />
            ))}
            <p className={stageComplete ? styles.stageReady : styles.stageWaiting} role="status">
              {stageComplete
                ? `${skill === "listening" ? "Listening" : "Reading"} first attempt complete: ${correct}/${total}. Save the score as evidence during Timed production.`
                : "Finish and check both tasks to unlock the next timed block."}
            </p>
          </>
        )}
      </MockBlockTimer>
    </section>
  );
}

function MockSpeakingRecorder({
  taskId,
}: {
  taskId: string;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const mounted = useRef(true);
  const previousUrl = useRef("");

  function clearRecordingTimer() {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }

  useEffect(() => {
    return () => {
      mounted.current = false;
      clearRecordingTimer();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stopTracks();
      if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
    };
  }, []);

  async function startRecording() {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Recording is not available in this browser. Speak aloud, then type keywords below instead.");
      return;
    }

    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (type) => MediaRecorder.isTypeSupported(type),
      );
      const nextRecorder = new MediaRecorder(
        media,
        mimeType ? { mimeType } : undefined,
      );
      recorder.current = nextRecorder;
      chunks.current = [];
      nextRecorder.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      nextRecorder.onstop = () => {
        clearRecordingTimer();
        stopTracks();
        if (!mounted.current) return;
        const blob = new Blob(chunks.current, {
          type: nextRecorder.mimeType || "audio/webm",
        });
        if (blob.size) {
          if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
          const nextUrl = URL.createObjectURL(blob);
          previousUrl.current = nextUrl;
          setRecordingUrl(nextUrl);
        }
        setRecording(false);
      };
      nextRecorder.onerror = () => {
        clearRecordingTimer();
        stopTracks();
        if (!mounted.current) return;
        setRecording(false);
        setError("The recording stopped before it could be saved. Type keywords below instead.");
      };
      startedAt.current = Date.now();
      setSeconds(0);
      nextRecorder.start();
      setRecording(true);
      timer.current = window.setInterval(() => {
        if (mounted.current) {
          setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
        }
      }, 1000);
    } catch {
      stopTracks();
      if (mounted.current) {
        setRecording(false);
        setError("Microphone access was not available. You can still speak aloud and type keywords below.");
      }
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  return (
    <div className={styles.speakingRecorder}>
      <div className={styles.recorderCopy}>
        <b>Optional microphone attempt</b>
        <p>Record only in this browser. No audio is sent anywhere; type keywords below as your saved fallback.</p>
      </div>
      <div className={styles.recorderControls}>
        <button
          type="button"
          className={recording ? "secondary" : "primary"}
          onClick={() => (recording ? stopRecording() : void startRecording())}
          aria-pressed={recording}
        >
          {recording ? <Square size={15} /> : <Mic size={15} />}
          {recording ? "Stop recording" : recordingUrl ? "Record again" : "Record my answer"}
        </button>
        {recording && <span className={styles.recordingState}>Recording {formatCountdown(seconds)}</span>}
      </div>
      {recordingUrl && !recording && (
        <audio className={styles.recordingPlayback} controls src={recordingUrl} aria-label={`Your recording for ${taskId}`} />
      )}
      {error && <p className={styles.recorderError} role="alert">{error}</p>}
    </div>
  );
}

function ProductionTaskCard({
  task,
  skill,
  response,
  onChange,
}: {
  task: ProductionTask;
  skill: "speaking" | "writing";
  response: string;
  onChange: (value: string) => void;
}) {
  const speakingTask = skill === "speaking" ? (task as YkiMockSpeakingTask) : null;
  const writingTask = skill === "writing" ? (task as YkiMockWritingTask) : null;
  return (
    <article className={styles.taskCard}>
      <div className={styles.taskHeader}>
        <span className={styles.taskNumber}>{task.title}</span>
        <small>{formatMinutes(task.minutes)}</small>
      </div>
      <div className={styles.taskBody}>
        {speakingTask && <p className={styles.scenario}>{speakingTask.scenario}</p>}
        <p className={styles.instruction}>{speakingTask?.task ?? writingTask!.prompt}</p>
        {speakingTask?.followUp && (
          <p className={styles.followUp}>
            <b>Unexpected follow-up:</b> {speakingTask.followUp}
          </p>
        )}
        {writingTask && (
          <dl className={styles.writerBrief}>
            <div><dt>Reader</dt><dd>{writingTask.reader}</dd></div>
            <div><dt>Purpose</dt><dd>{writingTask.purpose}</dd></div>
            <div><dt>Suggested length</dt><dd>{writingTask.suggestedLength}</dd></div>
          </dl>
        )}
        {speakingTask && <MockSpeakingRecorder taskId={task.id} />}
        <label className={styles.responseLabel} htmlFor={`mock-${task.id}`}>
          {skill === "speaking" ? "What you said (or keywords you used)" : "Your Swedish response"}
          <textarea
            id={`mock-${task.id}`}
            rows={skill === "speaking" ? 5 : 8}
            className="field"
            value={response}
            onChange={(event) => onChange(event.target.value)}
            placeholder={skill === "speaking" ? "Speak first, then type your words or keywords…" : "Kirjoita vastaus tähän…"}
            lang="sv"
          />
        </label>
        <p className={styles.taskChecks}>
          <b>Before you finish:</b> {task.successChecks.join(" · ")}
        </p>
      </div>
    </article>
  );
}

function EvidenceSave({
  skill,
  label,
  ready,
  saved,
  score,
  minutes,
  onSave,
}: {
  skill: Skill;
  label: string;
  ready: boolean;
  saved: boolean;
  score: number | null;
  minutes: number;
  onSave: (skill: Skill, score: number | null, minutes: number) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function saveEvidence() {
    setSaving(true);
    setError("");
    try {
      await onSave(skill, score, minutes);
    } catch {
      setError("Could not save this evidence yet. Your answers remain here; try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className={styles.evidenceSave}>
      <div>
        <b>{label}</b>
        <small>{saved ? "Evidence saved" : ready ? "Ready to record" : "Complete every task first"}</small>
      </div>
      {saved ? (
        <CheckCircle2 size={20} aria-label={`${label} saved`} />
      ) : (
        <button type="button" className="secondary" disabled={!ready || saving} onClick={() => void saveEvidence()}>
          {saving ? "Saving…" : `Record ${label.toLocaleLowerCase()}`} <Check size={15} />
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function ProductionStage({
  mock,
  drafts,
  savedPractice,
  onDraftChange,
  onComplete,
}: Pick<
  Props,
  "mock" | "drafts" | "savedPractice" | "onDraftChange" | "onComplete"
>) {
  const listeningEvidence = useMemo(() => parseReceptive(drafts.listening), [drafts.listening]);
  const readingEvidence = useMemo(() => parseReceptive(drafts.reading), [drafts.reading]);
  const [activeSkill, setActiveSkill] = useState<"speaking" | "writing">("speaking");
  const raw = drafts[activeSkill];
  const [evidence, setEvidence] = useState(() => parseProduction(raw));
  const tasks = activeSkill === "speaking" ? mock.speaking : mock.writing;
  const activeComplete = tasks.every((task) => (evidence.responses[task.id] ?? "").trim().length >= 10);
  const speakingEvidence = activeSkill === "speaking" ? evidence : parseProduction(drafts.speaking);
  const writingEvidence = activeSkill === "writing" ? evidence : parseProduction(drafts.writing);
  const speakingComplete = mock.speaking.every(
    (task) => (speakingEvidence.responses[task.id] ?? "").trim().length >= 10,
  );
  const writingComplete = mock.writing.every(
    (task) => (writingEvidence.responses[task.id] ?? "").trim().length >= 10,
  );
  const hasProductionWork =
    Object.keys(speakingEvidence.responses).length > 0 ||
    Object.keys(writingEvidence.responses).length > 0 ||
    Boolean(speakingEvidence.legacyContent?.trim()) ||
    Boolean(writingEvidence.legacyContent?.trim()) ||
    Boolean(savedPractice.speaking) ||
    Boolean(savedPractice.writing);
  const productionMinutes =
    (mock.timing.find((block) => block.id === "speaking")?.minutes ?? 0) +
    (mock.timing.find((block) => block.id === "writing")?.minutes ?? 0);

  function update(next: ParsedProductionEvidence) {
    setEvidence(next);
    onDraftChange(activeSkill, serializeProduction(next));
  }

  const listeningReady = mock.listening.every((task) => listeningEvidence.checked.includes(task.id));
  const readingReady = mock.reading.every((task) => readingEvidence.checked.includes(task.id));
  const listeningTotal = mock.listening.flatMap((task) => task.questions).length;
  const readingTotal = mock.reading.flatMap((task) => task.questions).length;

  return (
    <section className={styles.stage}>
      <MockHeader mock={mock} stage="production" />
      <div className={styles.evidenceGrid}>
        <EvidenceSave
          skill="listening"
          label={`Listening · ${correctAnswers(mock.listening, listeningEvidence)}/${listeningTotal}`}
          ready={listeningReady}
          saved={Boolean(savedPractice.listening)}
          score={Math.round((correctAnswers(mock.listening, listeningEvidence) / listeningTotal) * 100)}
          minutes={mock.timing.find((block) => block.id === "listening")?.minutes ?? 10}
          onSave={onComplete}
        />
        <EvidenceSave
          skill="reading"
          label={`Reading · ${correctAnswers(mock.reading, readingEvidence)}/${readingTotal}`}
          ready={readingReady}
          saved={Boolean(savedPractice.reading)}
          score={Math.round((correctAnswers(mock.reading, readingEvidence) / readingTotal) * 100)}
          minutes={mock.timing.find((block) => block.id === "reading")?.minutes ?? 10}
          onSave={onComplete}
        />
      </div>
      <MockBlockTimer
        mockId={mock.id}
        block="production"
        minutes={productionMinutes}
        hasSavedWork={hasProductionWork}
        complete={speakingComplete && writingComplete}
      >
        {() => (
          <>
            <div className={styles.productionTabs} role="tablist" aria-label="Timed production skill">
              {(["speaking", "writing"] as const).map((skill) => (
                <button
                  type="button"
                  key={skill}
                  role="tab"
                  aria-selected={activeSkill === skill}
                  className={activeSkill === skill ? styles.activeTab : ""}
                  onClick={() => {
                    setActiveSkill(skill);
                    setEvidence(parseProduction(drafts[skill]));
                  }}
                >
                  {skill === "speaking" ? <Mic size={16} /> : <PenLine size={16} />}
                  {skill}
                  {savedPractice[skill] && <Check size={15} />}
                </button>
              ))}
            </div>
            <div className={styles.stageContract}>
              <b>{activeSkill === "speaking" ? "Speak from keywords; type what you said as a durable record." : "Write for this reader and purpose; check task coverage before accuracy."}</b>
              <p>Models stay out of this original mock. Use the diagnosis step for one focused return afterwards.</p>
            </div>
            {evidence.legacyContent && (
              <section className={styles.stageContract} aria-label="Earlier saved mock draft">
                <b>Earlier saved mock draft</b>
                <p>
                  This is work saved before the mock used named tasks. Keep it here,
                  or reuse its ideas in a task below. It does not replace the current
                  task-specific response.
                </p>
                <label className={styles.responseLabel} htmlFor={`legacy-mock-${activeSkill}`}>
                  Keep or revise your earlier draft
                  <textarea
                    id={`legacy-mock-${activeSkill}`}
                    rows={5}
                    className="field"
                    value={evidence.legacyContent}
                    onChange={(event) =>
                      update({ ...evidence, legacyContent: event.target.value })
                    }
                    lang="sv"
                  />
                </label>
              </section>
            )}
            {tasks.map((task) => (
              <ProductionTaskCard
                key={task.id}
                task={task}
                skill={activeSkill}
                response={evidence.responses[task.id] ?? ""}
                onChange={(value) =>
                  update({
                    ...evidence,
                    responses: { ...evidence.responses, [task.id]: value },
                  })
                }
              />
            ))}
            <EvidenceSave
              skill={activeSkill}
              label={activeSkill === "speaking" ? "Speaking evidence" : "Writing evidence"}
              ready={activeComplete}
              saved={Boolean(savedPractice[activeSkill])}
              score={null}
              minutes={mock.timing.find((block) => block.id === activeSkill)?.minutes ?? 10}
              onSave={onComplete}
            />
          </>
        )}
      </MockBlockTimer>
    </section>
  );
}

function DiagnosisStage({
  mock,
  drafts,
  savedPractice,
  returnPlan,
  onReturnPlanChange,
}: Pick<
  Props,
  "mock" | "drafts" | "savedPractice" | "returnPlan" | "onReturnPlanChange"
>) {
  const listening = parseReceptive(drafts.listening);
  const reading = parseReceptive(drafts.reading);
  const listeningTotal = mock.listening.flatMap((task) => task.questions).length;
  const readingTotal = mock.reading.flatMap((task) => task.questions).length;
  const productionCount = (skill: "speaking" | "writing") =>
    Object.values(parseProduction(drafts[skill]).responses).filter(
      (response) => response.trim().length >= 10,
    ).length;
  const evidence = {
    listening: `${correctAnswers(mock.listening, listening)}/${listeningTotal} answers checked`,
    reading: `${correctAnswers(mock.reading, reading)}/${readingTotal} answers checked`,
    speaking: `${productionCount("speaking")}/${mock.speaking.length} responses recorded`,
    writing: `${productionCount("writing")}/${mock.writing.length} responses recorded`,
  } as const;
  const selectedReturn = parseYkiTargetedReturn(returnPlan);

  return (
    <section className={styles.stage}>
      <MockHeader mock={mock} stage="diagnosis" />
      <div className={styles.diagnosisLead}>
        <b>Keep the four skills separate.</b>
        <p>Finish the task first. Then choose one next drill for the skill that needs it most—not one vague overall score.</p>
      </div>
      <div className={styles.diagnosisGrid}>
        {mock.diagnosis.map((item) => (
          <article key={item.skill}>
            <div>
              <h3>{item.title}</h3>
              <span className={savedPractice[item.skill] ? styles.saved : styles.unsaved}>
                {savedPractice[item.skill] ? "Evidence saved" : "Evidence not yet saved"}
              </span>
            </div>
            <p>{evidence[item.skill]}</p>
            <ul>
              {item.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
            </ul>
            <p className={styles.nextDrill}><b>Next drill:</b> {item.nextDrillPrompt}</p>
          </article>
        ))}
      </div>
      <section className={styles.returnPlan} aria-labelledby="mock-return-plan-heading">
        <div>
          <span>CHOOSE YOUR NEXT DRILL</span>
          <h3 id="mock-return-plan-heading">Save one short practice move</h3>
          <p>
            Choose the skill you most want to strengthen next. You can change
            this later without losing your mock evidence.
          </p>
        </div>
        <div className={styles.returnChoices}>
          {mock.diagnosis.map((item) => {
            const selected =
              selectedReturn?.source === "structured" &&
              selectedReturn.skill === item.skill;
            return (
              <button
                type="button"
                key={item.skill}
                className={selected ? styles.returnChoiceSelected : styles.returnChoice}
                aria-pressed={selected}
                onClick={() =>
                  onReturnPlanChange(
                    serializeYkiTargetedReturn(item.skill, item.nextDrillPrompt),
                  )
                }
              >
                <b>{item.title}</b>
                <span>{item.nextDrillPrompt}</span>
                {selected && (
                  <small>
                    <Check size={14} aria-hidden="true" /> Saved as your next drill
                  </small>
                )}
              </button>
            );
          })}
        </div>
        {selectedReturn?.source === "legacy" && (
          <p className={styles.legacyReturn}>
            An earlier saved reminder is still kept: “{selectedReturn.drill}”.
            Choose a skill above if you want to replace it with a targeted drill.
          </p>
        )}
      </section>
    </section>
  );
}

function MockHeader({ mock, stage }: { mock: YkiMockSet; stage: "listening" | "reading" | "production" | "diagnosis" }) {
  const minutes =
    stage === "production"
      ? (mock.timing.find((block) => block.id === "speaking")?.minutes ?? 0) +
        (mock.timing.find((block) => block.id === "writing")?.minutes ?? 0)
      : mock.timing.find((block) => block.id === stage)?.minutes ?? 0;
  return (
    <header className={styles.mockHeader}>
      <div>
        <span>ORIGINAL COMPRESSED PRACTICE · {mock.totalMinutes} MINUTES TOTAL</span>
        <h2>{stageLabel(stage)}</h2>
        <p>{mock.theme} · {formatMinutes(minutes)}</p>
      </div>
      <small>{mock.originalPracticeNotice}</small>
    </header>
  );
}

export default function YkiMockFlow({
  mock,
  stage,
  drafts,
  savedPractice,
  onDraftChange,
  onComplete,
  returnPlan,
  onReturnPlanChange,
}: Props) {
  if (stage === "listening") {
    return (
      <ReceptiveStage
        mock={mock}
        skill="listening"
        tasks={mock.listening}
        rawEvidence={drafts.listening}
        onDraftChange={onDraftChange}
      />
    );
  }
  if (stage === "reading") {
    return (
      <ReceptiveStage
        mock={mock}
        skill="reading"
        tasks={mock.reading}
        rawEvidence={drafts.reading}
        onDraftChange={onDraftChange}
      />
    );
  }
  if (stage === "production") {
    return (
      <ProductionStage
        mock={mock}
        drafts={drafts}
        savedPractice={savedPractice}
        onDraftChange={onDraftChange}
        onComplete={onComplete}
      />
    );
  }
  return (
    <DiagnosisStage
      mock={mock}
      drafts={drafts}
      savedPractice={savedPractice}
      returnPlan={returnPlan}
      onReturnPlanChange={onReturnPlanChange}
    />
  );
}
