"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BookOpen, Check, Eye, FileText, ListChecks, Mic, MessagesSquare, RotateCcw, Square, Timer } from "lucide-react";
import type { YkiDialoguePart, YkiPromptSetPart, YkiSpeakingPart } from "@/lib/course-types";
import AudioButton from "./AudioButton";
import sourceStyles from "./SourcePagePractice.module.css";
import styles from "./YkiSpeakingPractice.module.css";

const FORMAT_LABEL: Record<YkiPromptSetPart["format"], string> = {
  react: "REACT IN A SITUATION",
  tell: "TELL ABOUT A TOPIC",
  opinion: "GIVE YOUR OPINION",
};

/** A countdown that calls `done` once when it reaches zero. */
function useCountdown() {
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const finish = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    finish.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(
    (seconds: number, done?: () => void) => {
      stop();
      const started = Date.now();
      finish.current = done ?? null;
      setLeft(seconds);
      setRunning(true);
      timer.current = window.setInterval(() => {
        const remaining = seconds - Math.floor((Date.now() - started) / 1000);
        setLeft(Math.max(0, remaining));
        if (remaining <= 0) {
          const callback = finish.current;
          stop();
          callback?.();
        }
      }, 250);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);
  return { left, running, start, stop };
}

type Take = { url: string; blob: Blob; text?: string };

/**
 * Recordings for one practice part: the microphone opens once per run and
 * each answer becomes its own take, so it can be compared with its own cue.
 * Takes stay in this browser; transcription runs only when asked.
 */
function useTakes() {
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const urls = useRef<string[]>([]);
  const [takes, setTakes] = useState<Record<string, Take>>({});
  const [recording, setRecording] = useState<string | null>(null);
  const [micNote, setMicNote] = useState("");
  const [busy, setBusy] = useState(false);

  const closeMic = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  useEffect(
    () => () => {
      closeMic();
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [closeMic],
  );

  async function openMic() {
    if (stream.current) return true;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicNote("Recording is not available in this browser. Answer aloud anyway; the timer still runs.");
      return false;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicNote("");
      return true;
    } catch {
      setMicNote("The microphone is off. Answer aloud anyway; the timer still runs.");
      return false;
    }
  }

  function startTake(key: string) {
    const media = stream.current;
    if (!media) return;
    const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) =>
      MediaRecorder.isTypeSupported(type),
    );
    const next = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
    const chunks: BlobPart[] = [];
    next.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    next.onstop = () => {
      setRecording((current) => (current === key ? null : current));
      const blob = new Blob(chunks, { type: next.mimeType || "audio/webm" });
      if (!blob.size) return;
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      setTakes((current) => ({ ...current, [key]: { url, blob } }));
    };
    recorder.current = next;
    next.start();
    setRecording(key);
  }

  function stopTake() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  function clear() {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current = [];
    setTakes({});
  }

  async function transcribeAll(keys: string[]) {
    setBusy(true);
    for (const key of keys) {
      const take = takes[key];
      if (!take || take.text !== undefined) continue;
      const form = new FormData();
      form.set("audio", take.blob, `yki-answer.${take.blob.type.includes("mp4") ? "mp4" : "webm"}`);
      try {
        const response = await fetch("/api/transcribe", { method: "POST", body: form });
        const result = (await response.json()) as { text?: string; error?: string };
        const text = response.ok && typeof result.text === "string" ? result.text || "(nothing heard)" : `(${result.error ?? "transcription unavailable"})`;
        setTakes((current) => ({ ...current, [key]: { ...current[key], text } }));
      } catch {
        setTakes((current) => ({ ...current, [key]: { ...current[key], text: "(transcription unavailable)" } }));
      }
    }
    setBusy(false);
  }

  return { takes, recording, micNote, busy, openMic, closeMic, startTake, stopTake, clear, transcribeAll };
}

type Takes = ReturnType<typeof useTakes>;

function TimerBadge({ left, label }: { left: number; label: string }) {
  return (
    <p className={styles.timer} aria-live="off">
      <Timer size={20} aria-hidden="true" />
      <b>{left}s</b>
      <span>{label}</span>
    </p>
  );
}

function TakeReview({ takes, takeKey }: { takes: Takes; takeKey: string }) {
  const take = takes.takes[takeKey];
  if (!take) return <p className={styles.noTake}>No recording for this answer.</p>;
  return (
    <div className={styles.take}>
      <audio controls src={take.url} aria-label="Your answer" />
      {take.text !== undefined && (
        <p lang="sv">
          <small>You said:</small> {take.text}
        </p>
      )}
    </div>
  );
}

function TranscribeButton({ takes, keys }: { takes: Takes; keys: string[] }) {
  const pending = keys.filter((key) => takes.takes[key] && takes.takes[key].text === undefined);
  if (!pending.length) return null;
  return (
    <button type="button" className="secondary" disabled={takes.busy} onClick={() => void takes.transcribeAll(pending)}>
      <FileText size={15} aria-hidden="true" />
      {takes.busy ? "Writing out your answers…" : "Write out what I said"}
    </button>
  );
}

function Stages<T extends string>({
  stages,
  current,
  onChange,
}: {
  stages: { id: T; label: string; icon: typeof Timer }[];
  current: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav aria-label="YKI task stages" style={{ "--stage-count": stages.length } as React.CSSProperties}>
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        return (
          <button
            type="button"
            key={stage.id}
            className={current === stage.id ? "active" : ""}
            aria-current={current === stage.id ? "step" : undefined}
            onClick={() => onChange(stage.id)}
          >
            <span>{index + 1}</span>
            <Icon size={16} aria-hidden="true" />
            {stage.label}
          </button>
        );
      })}
    </nav>
  );
}

function StageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className={sourceStyles.stageIntro}>
      <span>{eyebrow}</span>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

type DialogueStage = "read" | "ready" | "speak" | "compare";
const DIALOGUE_STAGES: { id: DialogueStage; label: string; icon: typeof Timer }[] = [
  { id: "read", label: "Read the card", icon: BookOpen },
  { id: "ready", label: "Get ready", icon: ListChecks },
  { id: "speak", label: "Speak in time", icon: Mic },
  { id: "compare", label: "Compare", icon: Check },
];

function DialoguePractice({ part }: { part: YkiDialoguePart }) {
  const [stage, setStage] = useState<DialogueStage>("read");
  const [run, setRun] = useState<"idle" | "running" | "done">("idle");
  const [index, setIndex] = useState(0);
  const [hideText, setHideText] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const read = useCountdown();
  const answer = useCountdown();
  const takes = useTakes();
  const learnerKeys = part.turns.flatMap((turn, turnIndex) => (turn.who === "learner" ? [`turn-${turnIndex}`] : []));
  const nextStage = DIALOGUE_STAGES[DIALOGUE_STAGES.findIndex((item) => item.id === stage) + 1];

  function enter(turnIndex: number) {
    if (turnIndex >= part.turns.length) {
      answer.stop();
      takes.closeMic();
      setRun("done");
      return;
    }
    setIndex(turnIndex);
    const turn = part.turns[turnIndex];
    if (turn.who === "learner") {
      takes.startTake(`turn-${turnIndex}`);
      answer.start(turn.seconds, () => {
        takes.stopTake();
        enter(turnIndex + 1);
      });
    }
  }

  async function startRun() {
    takes.clear();
    await takes.openMic();
    setRun("running");
    enter(0);
  }

  function finishTurn() {
    answer.stop();
    takes.stopTake();
    enter(index + 1);
  }

  const turn = part.turns[index];

  return (
    <>
      <Stages stages={DIALOGUE_STAGES} current={stage} onChange={setStage} />
      <div className={styles.work}>
        {stage === "read" && (
          <>
            <StageIntro eyebrow="STAGE 1 · THE SITUATION CARD" title="Read the card as in the test">
              In the test you get {part.readSeconds} seconds to read the situation. Find who you talk to and what each cue asks you to do.
            </StageIntro>
            <div className={styles.card}>
              <p className={styles.situation} lang="sv">{part.situation.fi}</p>
              {showMeaning ? (
                <p className={styles.meaning}>{part.situation.en}</p>
              ) : (
                <button type="button" className="text-button" onClick={() => setShowMeaning(true)}>
                  <Eye size={15} aria-hidden="true" /> Show the meaning
                </button>
              )}
              <ol className={styles.cues}>
                {part.turns.map((item, turnIndex) =>
                  item.who === "learner" ? (
                    <li key={turnIndex}>
                      <span lang="sv">{item.cue.fi}</span>
                      <small>{item.cue.en} · {item.seconds} s</small>
                    </li>
                  ) : null,
                )}
              </ol>
            </div>
            <div className={sourceStyles.audioRow}>
              {read.running ? (
                <TimerBadge left={read.left} label="reading time" />
              ) : (
                <button type="button" className="secondary" onClick={() => read.start(part.readSeconds)}>
                  <Timer size={16} aria-hidden="true" /> Time my {part.readSeconds}-second read
                </button>
              )}
            </div>
          </>
        )}

        {stage === "ready" && (
          <>
            <StageIntro eyebrow="STAGE 2 · USEFUL LINES" title="Get ready with a few phrases">
              Short answers are fine. Use your own words, not the words of the cue, and answer what the cue asks.
            </StageIntro>
            {part.phrases?.length ? (
              <ul className={styles.phrases}>
                {part.phrases.map((phrase) => (
                  <li key={phrase.fi}>
                    <span lang="sv">{phrase.fi}</span>
                    <small>{phrase.en}</small>
                    <AudioButton text={phrase.fi} speaker="Henrik" label={`Hear ${phrase.fi}`} className="icon-button" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.meaning}>Plan one sentence for each cue on the card.</p>
            )}
          </>
        )}

        {stage === "speak" && (
          <>
            <StageIntro eyebrow="STAGE 3 · TIMED RUN" title="Answer each turn before the time runs out">
              Your partner ({part.partner.role}) speaks, then your time starts. Each answer is recorded in this browser so you can compare it afterwards.
            </StageIntro>
            {run === "idle" && (
              <div className={styles.card}>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={hideText} onChange={(event) => setHideText(event.target.checked)} />
                  Exam style: hide your partner&apos;s words
                </label>
                <button type="button" className="primary" onClick={() => void startRun()}>
                  <Mic size={16} aria-hidden="true" /> Start the dialogue
                </button>
              </div>
            )}
            {run === "running" && turn && (
              <div className={styles.card}>
                <span className="badge">Turn {index + 1} of {part.turns.length}</span>
                {turn.who === "partner" ? (
                  <div className={styles.turn}>
                    <div className={sourceStyles.bubble}>
                      <b>{part.partner.role}</b>
                      {!hideText && <p lang="sv">{turn.fi}</p>}
                    </div>
                    <AudioButton key={`partner-${index}`} autoPlay text={turn.fi} speaker={part.partner.voice} label="Hear it again" className="secondary" />
                    <button type="button" className="primary" onClick={() => enter(index + 1)}>
                      My turn →
                    </button>
                  </div>
                ) : (
                  <div className={styles.turn}>
                    <p className={styles.cue} lang="sv">
                      {turn.cue.fi} <small>{turn.cue.en}</small>
                    </p>
                    <TimerBadge left={answer.left} label={takes.recording ? "recording" : "answer aloud"} />
                    <button type="button" className="primary" onClick={finishTurn}>
                      <Square size={15} aria-hidden="true" /> I answered
                    </button>
                  </div>
                )}
              </div>
            )}
            {run === "done" && (
              <div className={styles.card} role="status">
                <p className={sourceStyles.done}>
                  <Check size={17} aria-hidden="true" /> Dialogue finished. Compare your answers with the models.
                </p>
                <div className={sourceStyles.audioRow}>
                  <button type="button" className="primary" onClick={() => setStage("compare")}>Compare my answers →</button>
                  <button type="button" className="secondary" onClick={() => { setHideText(true); setRun("idle"); }}>
                    <RotateCcw size={15} aria-hidden="true" /> Again, exam style
                  </button>
                </div>
              </div>
            )}
            {takes.micNote && <p className={styles.noTake} role="status">{takes.micNote}</p>}
          </>
        )}

        {stage === "compare" && (
          <>
            <StageIntro eyebrow="STAGE 4 · COMPARE" title="Did you do what each cue asked?">
              Check two things for every turn: you did what the cue asked, and you used your own words. The models are only examples.
            </StageIntro>
            <div className={sourceStyles.audioRow}>
              <TranscribeButton takes={takes} keys={learnerKeys} />
            </div>
            <ol className={styles.compare}>
              {part.turns.map((item, turnIndex) =>
                item.who === "partner" ? (
                  <li key={turnIndex} className={styles.partnerLine}>
                    <b>{part.partner.role}:</b> <span lang="sv">{item.fi}</span> <small>{item.en}</small>
                  </li>
                ) : (
                  <li key={turnIndex}>
                    <p className={styles.cue} lang="sv">
                      {item.cue.fi} <small>{item.cue.en}</small>
                    </p>
                    <TakeReview takes={takes} takeKey={`turn-${turnIndex}`} />
                    {item.models.map((model, modelIndex) => (
                      <div key={model} className={styles.model}>
                        <small>{item.models.length > 1 ? (modelIndex === 0 ? "Short model" : "Fuller model") : "Model"}</small>
                        <span lang="sv">{model}</span>
                        <AudioButton text={model} speaker="Alex" label="Hear the model" className="icon-button" />
                      </div>
                    ))}
                    {item.tip && <p className={styles.tip}>{item.tip}</p>}
                  </li>
                ),
              )}
            </ol>
          </>
        )}

        {nextStage && (
          <button type="button" className={`primary ${sourceStyles.nextStage}`} onClick={() => setStage(nextStage.id)}>
            Next stage: {nextStage.label} →
          </button>
        )}
      </div>
    </>
  );
}

type PromptStage = "rules" | "speak" | "compare";
const PROMPT_STAGES: { id: PromptStage; label: string; icon: typeof Timer }[] = [
  { id: "rules", label: "How to answer", icon: ListChecks },
  { id: "speak", label: "Timed round", icon: Mic },
  { id: "compare", label: "Compare", icon: Check },
];

function pickRound(part: YkiPromptSetPart) {
  if (!part.roundSize || part.roundSize >= part.prompts.length) return part.prompts;
  return [...part.prompts].sort(() => Math.random() - 0.5).slice(0, part.roundSize);
}

function PromptPractice({ part }: { part: YkiPromptSetPart }) {
  const [stage, setStage] = useState<PromptStage>("rules");
  const [round, setRound] = useState(() => pickRound(part));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "show" | "prep" | "speak" | "done">("idle");
  const [showMeaning, setShowMeaning] = useState(false);
  const clock = useCountdown();
  const takes = useTakes();
  const prompt = round[index];
  const nextStage = PROMPT_STAGES[PROMPT_STAGES.findIndex((item) => item.id === stage) + 1];

  function speak(promptIndex: number) {
    setPhase("speak");
    takes.startTake(round[promptIndex].id);
    clock.start(part.speakSeconds, () => endAnswer(promptIndex));
  }

  function prepare(promptIndex: number) {
    setPhase("prep");
    clock.start(part.prepSeconds, () => speak(promptIndex));
  }

  function endAnswer(promptIndex: number) {
    clock.stop();
    takes.stopTake();
    if (promptIndex + 1 >= round.length) {
      takes.closeMic();
      setPhase("done");
      return;
    }
    setIndex(promptIndex + 1);
    setShowMeaning(false);
    setPhase("show");
  }

  async function startRound(fresh: boolean) {
    const next = fresh ? pickRound(part) : round;
    if (fresh) setRound(next);
    takes.clear();
    await takes.openMic();
    setIndex(0);
    setShowMeaning(false);
    setPhase("show");
  }

  return (
    <>
      <Stages stages={PROMPT_STAGES} current={stage} onChange={setStage} />
      <div className={styles.work}>
        {stage === "rules" && (
          <>
            <StageIntro eyebrow={`STAGE 1 · ${FORMAT_LABEL[part.format]}`} title="How to answer in the test">
              {part.prepSeconds} seconds to prepare, then {part.speakSeconds} seconds to speak
              {part.roundSize && part.roundSize < part.prompts.length ? `, ${part.roundSize} of ${part.prompts.length} prompts per round` : ""}.
            </StageIntro>
            {part.rules?.length ? (
              <ul className={styles.rules}>
                {part.rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            ) : null}
            {part.frames?.length ? (
              <ul className={styles.phrases}>
                {part.frames.map((frame) => (
                  <li key={frame.fi}>
                    <span lang="sv">{frame.fi}</span>
                    <small>{frame.en}</small>
                    <AudioButton text={frame.fi.replaceAll("…", "")} speaker="Henrik" label={`Hear ${frame.fi}`} className="icon-button" />
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}

        {stage === "speak" && (
          <>
            <StageIntro eyebrow="STAGE 2 · TIMED ROUND" title="Prepare, then speak until the time runs out">
              Each answer is recorded in this browser. Be more specific than the prompt and use your own words.
            </StageIntro>
            {phase === "idle" && (
              <div className={styles.card}>
                <button type="button" className="primary" onClick={() => void startRound(false)}>
                  <Mic size={16} aria-hidden="true" /> Start the round ({round.length} {round.length === 1 ? "prompt" : "prompts"})
                </button>
              </div>
            )}
            {(phase === "show" || phase === "prep" || phase === "speak") && prompt && (
              <div className={styles.card}>
                <span className="badge">Prompt {index + 1} of {round.length}</span>
                <p className={styles.situation} lang="sv">{prompt.fi}</p>
                {prompt.bullets?.length ? (
                  <ul className={styles.bullets} lang="sv">
                    {prompt.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
                {showMeaning ? (
                  <p className={styles.meaning}>{prompt.en}</p>
                ) : (
                  <button type="button" className="text-button" onClick={() => setShowMeaning(true)}>
                    <Eye size={15} aria-hidden="true" /> Show the meaning
                  </button>
                )}
                <div className={sourceStyles.audioRow}>
                  <AudioButton key={`prompt-${prompt.id}`} autoPlay={phase === "show"} text={prompt.fi} speaker="Elin" label="Hear the prompt" className="secondary" />
                  {phase === "show" && (
                    <button type="button" className="primary" onClick={() => prepare(index)}>
                      <Timer size={16} aria-hidden="true" /> Start my {part.prepSeconds} seconds to prepare
                    </button>
                  )}
                  {phase === "prep" && (
                    <>
                      <TimerBadge left={clock.left} label="prepare" />
                      <button type="button" className="secondary" onClick={() => speak(index)}>I am ready</button>
                    </>
                  )}
                  {phase === "speak" && (
                    <>
                      <TimerBadge left={clock.left} label={takes.recording ? "recording" : "speak now"} />
                      <button type="button" className="primary" onClick={() => endAnswer(index)}>
                        <Square size={15} aria-hidden="true" /> I finished
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {phase === "done" && (
              <div className={styles.card} role="status">
                <p className={sourceStyles.done}>
                  <Check size={17} aria-hidden="true" /> Round finished. Compare your answers with the models.
                </p>
                <div className={sourceStyles.audioRow}>
                  <button type="button" className="primary" onClick={() => setStage("compare")}>Compare my answers →</button>
                  <button type="button" className="secondary" onClick={() => void startRound(true)}>
                    <RotateCcw size={15} aria-hidden="true" /> New round
                  </button>
                </div>
              </div>
            )}
            {takes.micNote && <p className={styles.noTake} role="status">{takes.micNote}</p>}
          </>
        )}

        {stage === "compare" && (
          <>
            <StageIntro eyebrow="STAGE 3 · COMPARE" title="Did you answer the prompt in your own words?">
              Listen to each answer. Did you do what the prompt asked, add one detail of your own, and keep talking until the time ran out?
            </StageIntro>
            <div className={sourceStyles.audioRow}>
              <TranscribeButton takes={takes} keys={round.map((item) => item.id)} />
            </div>
            <ol className={styles.compare}>
              {round.map((item) => (
                <li key={item.id}>
                  <p className={styles.situation} lang="sv">{item.fi} <small>{item.en}</small></p>
                  <TakeReview takes={takes} takeKey={item.id} />
                  <div className={styles.model}>
                    <small>Model</small>
                    <span lang="sv">{item.model}</span>
                    <small>{item.modelEn}</small>
                    <AudioButton text={item.model} speaker="Alex" label="Hear the model" className="icon-button" />
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        {nextStage && (
          <button type="button" className={`primary ${sourceStyles.nextStage}`} onClick={() => setStage(nextStage.id)}>
            Next stage: {nextStage.label} →
          </button>
        )}
      </div>
    </>
  );
}

function YkiSpeakingPart({ part }: { part: YkiSpeakingPart }) {
  const titleId = useId();
  const eyebrow = part.type === "dialogue" ? "YKI SPEAKING · DIALOGUE" : `YKI SPEAKING · ${FORMAT_LABEL[part.format]}`;
  return (
    <section className="source-page-practice yki-speaking-practice" aria-labelledby={titleId}>
      <header>
        <div>
          <span>{eyebrow}</span>
          <h3 id={titleId}>{part.title}</h3>
          {part.intro && <p>{part.intro}</p>}
          {part.bookRef && (
            <p className={styles.bookRef}>
              <BookOpen size={14} aria-hidden="true" /> Book: {part.bookRef}
            </p>
          )}
        </div>
        {part.type === "dialogue" ? <MessagesSquare size={28} aria-hidden="true" /> : <Timer size={28} aria-hidden="true" />}
      </header>
      {part.type === "dialogue" ? <DialoguePractice part={part} /> : <PromptPractice part={part} />}
    </section>
  );
}

export function YkiSpeakingPracticeSet({ parts }: { parts: YkiSpeakingPart[] }) {
  const [index, setIndex] = useState(0);
  if (parts.length === 1) return <YkiSpeakingPart part={parts[0]} />;
  return (
    <div className={sourceStyles.pageSet}>
      <div className={sourceStyles.pageTabs} role="group" aria-label="YKI tasks for this lesson">
        <span className={sourceStyles.eyebrow}>YKI TASKS FOR THIS LESSON</span>
        {parts.map((part, partIndex) => (
          <button
            type="button"
            key={part.id}
            aria-pressed={index === partIndex}
            className={`${sourceStyles.level} ${index === partIndex ? sourceStyles.levelActive : ""}`}
            onClick={() => setIndex(partIndex)}
          >
            <span>{partIndex + 1}</span>
            {part.title}
          </button>
        ))}
      </div>
      <YkiSpeakingPart part={parts[index]} key={parts[index].id} />
    </div>
  );
}
