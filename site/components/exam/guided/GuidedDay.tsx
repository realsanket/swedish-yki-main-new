"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Mic, Play, Square, Turtle } from "lucide-react";
import type { ExamUnit } from "@/lib/exam-types";
import { checkNumber, checkPoint, compareLine, type Verdict, type WordMark } from "@/lib/exam-guided";
import { playSpeech, useSpeech } from "../speech";
import { LogPanel, QuickError } from "../DayParts";
import { InlineMarkdown } from "../MarkdownView";
import type { ExamApi } from "../useExam";
import { GUIDED_DAYS, DAY1, DAY2, type GPattern, type GQuestion, type GStep, type GuidedDay as Lesson } from "./guidedDays";
import styles from "./guided.module.css";
import base from "../exam.module.css";

type Speaker = "Elin" | "Maja" | "Henrik" | "Alex";
type Rating = "got" | "slow" | "missed";

/* --------------------------------- small parts --------------------------------- */

function fill(template: string, value?: string): string {
  return value === undefined ? template : template.replace("{}", value);
}

function Filled({ template, value }: { template: string; value?: string }) {
  if (!template.includes("{}") || value === undefined) return <>{template}</>;
  const [a, b] = template.split("{}");
  return <>{a}<strong>{value}</strong>{b}</>;
}

/** A button that plays one Swedish line (normal or slow). */
function Say({ id, text, speaker = "Elin", slow = false, label, about, small = true, onPlayed }: { id: string; text: string; speaker?: Speaker; slow?: boolean; label?: string; about?: string; small?: boolean; onPlayed?: () => void }) {
  const key = `g:${id}:${slow ? "slow" : "n"}`;
  const { state, error } = useSpeech(key);
  const idle = state === "idle";
  return (
    <>
      <button
        type="button"
        className={`secondary ${small ? styles.small : ""}`}
        aria-label={`${idle ? (slow ? "Hear it slowly" : "Hear it") : "Stop"}${about ? `: ${about}` : label && label !== "Hear" && label !== "Slow" ? `: ${label}` : ""}`}
        onClick={() => { onPlayed?.(); void playSpeech(key, { text, speaker, slow }); }}
      >
        {idle ? (slow ? <Turtle size={15} aria-hidden /> : <Play size={15} aria-hidden />) : <Square size={15} aria-hidden />} {label ?? (slow ? "Slow" : "Hear")}
      </button>
      {error ? <span role="status" className={base.chipError}>{error}</span> : null}
    </>
  );
}

function WordChip({ id, sv, en }: { id: string; sv: string; en: string }) {
  const key = `g:${id}:w`;
  const { state } = useSpeech(key);
  return (
    <button type="button" className={styles.word} data-state={state} aria-label={`Hear ${sv}, meaning ${en}`} onClick={() => void playSpeech(key, { text: sv })}>
      {sv}<i>{en}</i>
    </button>
  );
}

function RatingButtons({ value, onChange }: { value?: Rating; onChange: (r: Rating) => void }) {
  const options: [Rating, string][] = [["got", "Got it"], ["slow", "Slowly"], ["missed", "Missed"]];
  return (
    <div className={styles.rate} role="group" aria-label="How did it go?">
      {options.map(([r, label]) => (
        <button key={r} type="button" className={styles.rateBtn} data-r={r} aria-pressed={value === r} onClick={() => onChange(r)}>{label}</button>
      ))}
    </div>
  );
}

function Tally({ done, total, what }: { done: number; total: number; what: string }) {
  return <p className={styles.tally} role="status">{done} of {total} {what}</p>;
}

/** Å Ä Ö buttons that type into whichever field was last focused. */
function useAccent() {
  const last = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const onFocus = useCallback((e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => { last.current = e.currentTarget; }, []);
  const insert = useCallback((ch: string) => {
    const el = last.current;
    if (!el) return;
    el.focus();
    el.setRangeText(ch, el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);
  return { onFocus, insert };
}

function AccentBar({ insert }: { insert: (ch: string) => void }) {
  return (
    <div className={styles.accent} role="group" aria-label="Swedish letters">
      <span className={base.muted}>Letters:</span>
      {["å", "ä", "ö", "Å", "Ä", "Ö"].map((c) => (
        <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(c)} aria-label={`Insert ${c}`}>{c}</button>
      ))}
    </div>
  );
}

function VerdictView({ verdict, marks, model }: { verdict: Verdict; marks: WordMark[]; model: string }) {
  if (verdict === "empty") return <p className={styles.verdict}>Type your answer first.</p>;
  return (
    <p className={styles.verdict} role="status">
      {verdict === "exact" ? <span className={styles.good}>Right. </span> : verdict === "slip" ? <span className={styles.warn}>Almost: check the spelling. </span> : <span className={styles.bad}>Not quite. </span>}
      {verdict !== "exact" ? <>You wrote: {marks.map((m, i) => <span key={i} className={m.ok ? styles.markOk : styles.markBad}>{m.word} </span>)}<br /></> : null}
      {verdict !== "exact" ? <>Model: <b>{model}</b></> : null}
    </p>
  );
}

/* --------------------------------- recorder --------------------------------- */

function Recorder({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const blob = useRef<Blob | null>(null);
  const media = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  async function start() {
    setNote("");
    setTranscript("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setNote("Recording is not available in this browser. Say it out loud and carry on."); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const type = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const rec = new MediaRecorder(s, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        s.getTracks().forEach((t) => t.stop());
        blob.current = new Blob(chunks, { type: rec.mimeType || type || "audio/webm" });
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob.current);
        setUrl(urlRef.current);
        setState("done");
      };
      media.current = rec;
      rec.start();
      setState("recording");
    } catch {
      setNote("The microphone is blocked. Allow it in the browser, or say it out loud and carry on.");
    }
  }

  async function transcribe() {
    if (!blob.current) return;
    setBusy(true);
    setTranscript("");
    const form = new FormData();
    form.set("audio", blob.current, `take.${blob.current.type.includes("mp4") ? "mp4" : "webm"}`);
    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const result = (await response.json()) as { text?: string; error?: string };
      setTranscript(response.ok && result.text ? result.text : `(${result.error ?? "no transcript"})`);
    } catch {
      setTranscript("(transcription is unavailable)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.rec}>
      <div className={styles.btnRow}>
        {state === "recording" ? (
          <button type="button" className="primary" onClick={() => media.current?.stop()}><Square size={16} aria-hidden /> Stop</button>
        ) : (
          <button type="button" className="secondary" onClick={() => void start()} aria-describedby={`${id}-note`}><Mic size={16} aria-hidden /> {state === "done" ? "Record again" : "Record"}</button>
        )}
        {state === "recording" ? <span><span className={styles.recDot} aria-hidden /> Recording…</span> : null}
        {state === "done" ? <button type="button" className="secondary" disabled={busy} onClick={() => void transcribe()}>{busy ? "Transcribing…" : "Show what I said (optional)"}</button> : null}
      </div>
      {url ? <audio controls src={url} aria-label="Your recording" /> : null}
      {transcript ? <p className={styles.transcript}>{transcript}</p> : null}
      <p id={`${id}-note`} className={base.muted}>{note || "Your recording stays in this tab and is not saved. The text check is a hint only: the transcription can mishear you."}</p>
    </div>
  );
}

/* --------------------------------- steps --------------------------------- */

function HearStep({ day, withNumbers }: { day: Lesson; withNumbers: boolean }) {
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [said, setSaid] = useState<Record<string, number>>({});
  const reveal = (id: string) => setShown((s) => new Set(s).add(id));
  return (
    <>
      {day.patterns.map((p) => {
        const sv = fill(p.template, p.slot?.value);
        return (
          <div className={styles.item} key={p.id}>
            <div className={styles.cue}>{fill(p.en, p.slot?.en)}</div>
            <div className={styles.btnRow}>
              <Say id={`${p.id}:h`} text={sv} label="Hear" about={fill(p.en, p.slot?.en)} onPlayed={() => reveal(p.id)} />
              <Say id={`${p.id}:h`} text={sv} slow label="Slow" about={fill(p.en, p.slot?.en)} onPlayed={() => reveal(p.id)} />
              {!shown.has(p.id) ? <button type="button" className="text-button" onClick={() => reveal(p.id)}>Show the text</button> : null}
            </div>
            {shown.has(p.id) ? (
              <>
                <div className={styles.sv}><Filled template={p.template} value={p.slot?.value} /></div>
                <div className={styles.words} aria-label="Word by word">{p.words.map((w) => <WordChip key={w.sv} id={`${p.id}:${w.sv}`} sv={w.sv} en={w.en} />)}</div>
                {p.slot ? <p className={base.muted}>The yellow part changes: <b>{p.slot.label}</b>.{p.swaps?.length ? " You will swap it in the next step." : ""}</p> : null}
                {p.note ? <p className={base.muted}>{p.note}</p> : null}
                <div className={styles.btnRow}>
                  <button type="button" className="secondary" onClick={() => setSaid((s) => ({ ...s, [p.id]: Math.min(3, (s[p.id] ?? 0) + 1) }))}>I said it out loud ({said[p.id] ?? 0}/3)</button>
                </div>
              </>
            ) : <p className={styles.hidden}>Hear it first, then the Swedish appears.</p>}
          </div>
        );
      })}
      {withNumbers && day.numbers ? (
        <div className={styles.item}>
          <div className={styles.cue}>Numbers 0 to 12: tap each one, then say it.</div>
          <div className={styles.numGrid}>
            {day.numbers.words.map((n) => (
              <NumberButton key={n.sv} sv={n.sv} digit={n.en} />
            ))}
          </div>
        </div>
      ) : null}
      <Tally done={shown.size} total={day.patterns.length} what="sentences heard" />
    </>
  );
}

function NumberButton({ sv, digit }: { sv: string; digit: string }) {
  const key = `g:num:${sv}`;
  const { state } = useSpeech(key);
  return (
    <button type="button" className={styles.numBtn} data-state={state} aria-label={`Hear ${sv}, the number ${digit}`} onClick={() => void playSpeech(key, { text: sv })}>
      <b>{digit}</b>{sv}
    </button>
  );
}

function RecallStep({ patterns, withSwaps, onRate }: { patterns: GPattern[]; withSwaps: boolean; onRate?: (p: GPattern, r: Rating) => void }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [rated, setRated] = useState<Record<string, Rating>>({});
  const [swap, setSwap] = useState<Record<string, string>>({});
  const [tried, setTried] = useState<Record<string, Set<string>>>({});
  const got = Object.values(rated).filter((r) => r === "got").length;
  return (
    <>
      {patterns.map((p) => {
        const value = swap[p.id] ?? p.slot?.value;
        const enValue = swap[p.id] ? p.swaps?.find((s) => s.sv === swap[p.id])?.en : p.slot?.en;
        return (
          <div className={styles.item} key={p.id}>
            <div className={styles.cue}>Say in Swedish: <b>{fill(p.en, p.slot?.en)}</b></div>
            {!open.has(p.id) ? (
              <button type="button" className="secondary" onClick={() => setOpen((s) => new Set(s).add(p.id))}>I said it. Show the Swedish</button>
            ) : (
              <>
                <div className={styles.sv}><Filled template={p.template} value={p.slot?.value} /></div>
                <div className={styles.btnRow}><Say id={`${p.id}:r`} text={fill(p.template, p.slot?.value)} label="Hear" /></div>
                <RatingButtons value={rated[p.id]} onChange={(r) => { setRated((x) => ({ ...x, [p.id]: r })); onRate?.(p, r); }} />
              </>
            )}
            {withSwaps && p.slot && p.swaps?.length && open.has(p.id) ? (
              <div className={styles.swaps}>
                <span className={base.muted}>Swap {p.slot.label}:</span>
                {[{ sv: p.slot.value, en: p.slot.en }, ...p.swaps].map((s) => (
                  <button
                    key={s.sv}
                    type="button"
                    className={styles.swapBtn}
                    aria-pressed={value === s.sv}
                    onClick={() => { setSwap((x) => ({ ...x, [p.id]: s.sv })); setTried((t) => ({ ...t, [p.id]: new Set(t[p.id]).add(s.sv) })); void playSpeech(`g:${p.id}:swap`, { text: fill(p.template, s.sv) }); }}
                  >{s.sv}</button>
                ))}
                <span className={styles.sv}><Filled template={p.template} value={value} /></span>
                <span className={base.muted}>({fill(p.en, enValue)}) · swaps tried: {tried[p.id]?.size ?? 0}/3</span>
              </div>
            ) : null}
          </div>
        );
      })}
      <Tally done={got} total={patterns.length} what="got it first time" />
    </>
  );
}

function QuestionsStep({ questions, speaker = "Henrik" }: { questions: GQuestion[]; speaker?: Speaker }) {
  const [textOpen, setTextOpen] = useState<Set<number>>(new Set());
  const [answerOpen, setAnswerOpen] = useState<Set<number>>(new Set());
  const [rated, setRated] = useState<Record<number, Rating>>({});
  const got = Object.values(rated).filter((r) => r === "got").length;
  const add = (set: Set<number>, i: number) => new Set(set).add(i);
  return (
    <>
      {questions.map((q, i) => (
        <div className={styles.item} key={q.sv}>
          <div className={styles.btnRow}>
            <Say id={`q:${q.sv}`} text={q.sv} speaker={speaker} label={`Question ${i + 1}`} onPlayed={() => undefined} />
            <Say id={`q:${q.sv}`} text={q.sv} speaker={speaker} slow label="Slow" />
            <button type="button" className="text-button" onClick={() => setTextOpen((s) => add(s, i))}>{textOpen.has(i) ? "" : "Show the question and its meaning"}</button>
          </div>
          {textOpen.has(i) ? <div><span className={styles.sv}>{q.sv}</span> <span className={base.muted}>{q.en}</span></div> : <p className={styles.hidden}>Listen, then answer out loud in a full sentence.</p>}
          {!answerOpen.has(i) ? (
            <button type="button" className="secondary" onClick={() => { setAnswerOpen((s) => add(s, i)); setTextOpen((s) => add(s, i)); }}>I answered. Show a model answer</button>
          ) : (
            <>
              <div className={styles.sv}>{q.answer} <Say id={`a:${q.sv}`} text={q.answer} label="Hear the answer" /></div>
              <RatingButtons value={rated[i]} onChange={(r) => setRated((x) => ({ ...x, [i]: r }))} />
            </>
          )}
        </div>
      ))}
      <Tally done={got} total={questions.length} what="answered without help" />
    </>
  );
}

function SpeakStep({ day, taskId, exam, unitKey }: { day: Lesson; taskId: string; exam: ExamApi; unitKey: string }) {
  const task = day.speakTasks.find((t) => t.id === taskId)!;
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [model, setModel] = useState(false);
  void exam; void unitKey;
  return (
    <>
      <div className={styles.item}>
        <div className={styles.sv}>{task.prompt}</div>
        <p className={base.muted}>{task.en}</p>
        <p className={base.muted}>Points to cover (tick them as you say them):</p>
        <ul className={styles.points}>
          {task.points.map((p, i) => (
            <li key={p}><label><input type="checkbox" checked={ticked.has(i)} onChange={(e) => setTicked((s) => { const n = new Set(s); if (e.target.checked) n.add(i); else n.delete(i); return n; })} /> {p}</label></li>
          ))}
        </ul>
      </div>
      <Recorder id={`rec-${taskId}`} />
      <p className={base.muted}>Take 1: say it. Listen once. Take 2: say it again, a little smoother. Look at the model only after your first try.</p>
      {!model ? <button type="button" className="secondary" onClick={() => setModel(true)}>I tried. Show the model</button> : (
        <div className={styles.item}>
          <div className={styles.sv}>{task.model}</div>
          <div className={styles.btnRow}><Say id={`${task.id}:model`} text={task.model} label="Hear the model" /><Say id={`${task.id}:model`} text={task.model} slow label="Slow" /></div>
        </div>
      )}
      <Tally done={ticked.size} total={task.points.length} what="points covered" />
    </>
  );
}

function TypeLinesStep({ day, exam, unitKey }: { day: Lesson; exam: ExamApi; unitKey: string }) {
  const accent = useAccent();
  const [values, setValues] = useState<string[]>(day.typeLines.map(() => ""));
  const [results, setResults] = useState<Record<number, { verdict: Verdict; marks: WordMark[] }>>({});
  const [added, setAdded] = useState<Set<number>>(new Set());
  const right = Object.values(results).filter((r) => r.verdict === "exact" || r.verdict === "slip").length;
  return (
    <>
      <AccentBar insert={accent.insert} />
      {day.typeLines.map((line, i) => (
        <div className={styles.item} key={line.en}>
          <div className={styles.cue}>Type in Swedish: <b>{line.en}</b></div>
          <input
            className={styles.input}
            value={values[i]}
            lang="sv"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={`Sentence ${i + 1}`}
            onFocus={accent.onFocus}
            onChange={(e) => setValues((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
            onKeyDown={(e) => { if (e.key === "Enter") setResults((r) => ({ ...r, [i]: compareLine(values[i], line.sv) })); }}
          />
          <div className={styles.btnRow}>
            <button type="button" className="secondary" onClick={() => setResults((r) => ({ ...r, [i]: compareLine(values[i], line.sv) }))}>Check</button>
            {results[i] && results[i].verdict === "different" && !added.has(i) ? (
              <button type="button" className="text-button" onClick={async () => { const problem = await exam.act({ type: "addError", id: `e-${crypto.randomUUID()}`, text: values[i].slice(0, 300), right: line.sv, unitKey }); if (!problem) setAdded((s) => new Set(s).add(i)); }}>Add this mistake to my error list</button>
            ) : null}
            {added.has(i) ? <span className={base.muted}>Added to your error list.</span> : null}
          </div>
          {results[i] ? <VerdictView verdict={results[i].verdict} marks={results[i].marks} model={line.sv} /> : null}
        </div>
      ))}
      <Tally done={right} total={day.typeLines.length} what="right (spelling slips count as right)" />
    </>
  );
}

function WantsStep({ day }: { day: Lesson }) {
  const quiz = [{ ans: "i Esbo", q: "Var?" }, { ans: "Alex", q: "Vad?" }, { ans: "i fem år", q: "Hur länge?" }];
  const [picked, setPicked] = useState<Record<number, string>>({});
  return (
    <>
      <ul className={styles.points}>{day.wants!.map((w) => <li key={w.q}><b>{w.q}</b> asks for {w.wants}</li>)}</ul>
      <p className={base.muted}>Quick check: which question word goes with each answer?</p>
      {quiz.map((item, i) => (
        <div className={styles.item} key={item.ans}>
          <div className={styles.sv}>{item.ans}</div>
          <div className={styles.btnRow}>
            {day.wants!.map((w) => (
              <button key={w.q} type="button" className={styles.rateBtn} aria-pressed={picked[i] === w.q} data-r={picked[i] === w.q ? (w.q === item.q ? "got" : "missed") : undefined} onClick={() => setPicked((p) => ({ ...p, [i]: w.q }))}>{w.q}</button>
            ))}
            {picked[i] ? <span className={picked[i] === item.q ? styles.good : styles.bad}>{picked[i] === item.q ? "Right" : `Not quite: it is ${item.q}`}</span> : null}
          </div>
        </div>
      ))}
    </>
  );
}

function MakeQStep({ day }: { day: Lesson }) {
  const accent = useAccent();
  const [values, setValues] = useState<string[]>(day.makeQ!.map(() => ""));
  const [results, setResults] = useState<Record<number, { verdict: Verdict; marks: WordMark[] }>>({});
  return (
    <>
      <p className={styles.intro}>Part 1: turn each answer into the question you would ask.</p>
      <AccentBar insert={accent.insert} />
      {day.makeQ!.map((pair, i) => (
        <div className={styles.item} key={pair.answer}>
          <div className={styles.cue}>Answer: <span className={styles.sv}>{pair.answer}</span> <Say id={`mq:${pair.answer}`} text={pair.answer} /></div>
          <input className={styles.input} value={values[i]} lang="sv" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label={`Question for answer ${i + 1}`} onFocus={accent.onFocus} onChange={(e) => setValues((v) => v.map((x, k) => (k === i ? e.target.value : x)))} onKeyDown={(e) => { if (e.key === "Enter") setResults((r) => ({ ...r, [i]: compareLine(values[i], pair.question) })); }} />
          <div className={styles.btnRow}><button type="button" className="secondary" onClick={() => setResults((r) => ({ ...r, [i]: compareLine(values[i], pair.question) }))}>Check</button></div>
          {results[i] ? <VerdictView verdict={results[i].verdict} marks={results[i].marks} model={pair.question} /> : null}
        </div>
      ))}
      <p className={styles.intro}>Part 2: answer all six questions out loud.</p>
      <QuestionsStep questions={[...DAY1.understand, ...DAY2.understand]} />
    </>
  );
}

function ConversationStep({ day }: { day: Lesson }) {
  const turns = day.conversation!;
  const [index, setIndex] = useState(0);
  const [model, setModel] = useState(false);
  const turn = turns[index];
  const finished = index >= turns.length;
  return (
    <>
      {!finished ? (
        <div className={styles.item}>
          <p className={base.muted}>Question {index + 1} of {turns.length}{turn.addAndYou ? " · add Och du? at the end" : ""}</p>
          <div className={styles.btnRow}>
            <Say id={`c${index}`} text={turn.voice} speaker="Henrik" label="Hear the question" />
            <Say id={`c${index}`} text={turn.voice} speaker="Henrik" slow label="Slow" />
          </div>
          <p className={styles.hidden}>Answer out loud in a full sentence. Record it if you like.</p>
          <Recorder id={`conv-${index}`} />
          {!model ? <button type="button" className="secondary" onClick={() => setModel(true)}>I answered. Show a model</button> : (
            <div className={styles.sv}>{turn.model} <Say id={`cm${index}`} text={turn.model} label="Hear the model" /></div>
          )}
          <div className={styles.btnRow}>
            <button type="button" className="primary" onClick={() => { setIndex((i) => i + 1); setModel(false); }}>{index === turns.length - 1 ? "Finish the conversation" : "Next question"}</button>
          </div>
        </div>
      ) : (
        <div className={styles.item}>
          <p><b>That was the whole conversation.</b> Now do it once more, with a small change: use a different town, a different job or a different number of years. Then go on to the next step.</p>
          <button type="button" className="secondary" onClick={() => { setIndex(0); setModel(false); }}>Start again</button>
        </div>
      )}
    </>
  );
}

function TypeMsgStep({ day }: { day: Lesson }) {
  const accent = useAccent();
  const m = day.message!;
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [model, setModel] = useState(false);
  return (
    <>
      <div className={styles.item}>
        <div className={styles.sv}>{m.prompt}</div>
        <p className={base.muted}>{m.en}</p>
      </div>
      <AccentBar insert={accent.insert} />
      <textarea className={styles.textarea} value={value} lang="sv" autoCapitalize="sentences" autoCorrect="off" spellCheck={false} aria-label="Your message" onFocus={accent.onFocus} onChange={(e) => { setValue(e.target.value); setChecked(false); }} />
      <div className={styles.btnRow}><button type="button" className="secondary" disabled={!value.trim()} onClick={() => setChecked(true)}>Check the points</button></div>
      {checked ? (
        <ul className={styles.points} role="status">
          {m.points.map((p) => { const ok = checkPoint(p.test, value); return <li key={p.label} className={ok ? styles.good : styles.warn}>{ok ? "✓" : "✗"} {p.label}</li>; })}
          <li className={base.muted}>This checks the shape only. Compare your sentences with the model for word order.</li>
        </ul>
      ) : null}
      {!model ? <button type="button" className="secondary" onClick={() => setModel(true)}>I wrote it. Show the model</button> : (
        <div className={styles.item}><div className={styles.sv}>{m.model}</div><div className={styles.btnRow}><Say id="msg:model" text={m.model} label="Hear the model" /></div></div>
      )}
    </>
  );
}

function DictationStep({ day }: { day: Lesson }) {
  const accent = useAccent();
  const items = day.numbers!.dictation;
  const [values, setValues] = useState<string[]>(items.map(() => ""));
  const [checked, setChecked] = useState(false);
  const right = checked ? items.filter((it, i) => checkNumber(values[i], it.key)).length : 0;
  return (
    <>
      <p className={styles.intro}>Hear each number and write it as digits. You may hear it again.</p>
      {items.map((it, i) => (
        <div className={styles.item} key={it.say + i}>
          <div className={styles.btnRow}>
            <Say id={`dict${i}`} text={it.say} speaker="Henrik" label={`Number ${i + 1}`} />
            <input className={styles.input} style={{ maxWidth: 120 }} inputMode="numeric" value={values[i]} aria-label={`Digits for number ${i + 1}`} onFocus={accent.onFocus} onChange={(e) => { setValues((v) => v.map((x, k) => (k === i ? e.target.value : x))); setChecked(false); }} />
            {checked ? (checkNumber(values[i], it.key) ? <span className={styles.good}>Right</span> : <span className={styles.bad}>It was {it.key} ({it.say})</span>) : null}
          </div>
        </div>
      ))}
      <div className={styles.btnRow}><button type="button" className="secondary" onClick={() => setChecked(true)}>Check all</button></div>
      {checked ? <Tally done={right} total={items.length} what="numbers right" /> : null}
    </>
  );
}

function CardsStep({ day, exam, unitKey }: { day: Lesson; exam: ExamApi; unitKey: string }) {
  const own = day.cards.filter((c) => c.own);
  const [message, setMessage] = useState("");
  const ownAdded = own.every((c) => exam.state?.cards[c.id]);
  return (
    <>
      <p className={styles.intro}>Eight cards today. The first five join your review automatically when you log this day, and come back tomorrow.</p>
      <ul className={styles.cardList}>
        {day.cards.map((c) => (
          <li className={styles.cardRow} key={c.id}>
            <span>{c.front}</span>
            <span><b>{c.back}</b></span>
          </li>
        ))}
      </ul>
      {own.length ? (
        <div className={styles.btnRow}>
          <button
            type="button"
            className="secondary"
            disabled={ownAdded || exam.saving}
            onClick={async () => {
              for (const c of own) {
                const problem = await exam.act({ type: "addCard", id: c.id, front: c.front, back: c.back, unitKey });
                if (problem) { setMessage(problem); return; }
              }
              setMessage("Added. They will come back in your review.");
            }}
          >{ownAdded ? "The extra cards are in your review" : `Add the ${own.length} extra cards to my review`}</button>
          {message ? <span role="status" className={base.muted}>{message}</span> : null}
        </div>
      ) : null}
      <QuickError unit={{ key: unitKey } as ExamUnit} exam={exam} />
    </>
  );
}

/* --------------------------------- the day --------------------------------- */

function useElapsedMinutes(): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => { if (document.visibilityState === "visible") setSeconds((s) => s + 5); }, 5000);
    return () => window.clearInterval(id);
  }, []);
  return Math.round(seconds / 60);
}

export const GUIDED_KEYS = new Set(Object.keys(GUIDED_DAYS));

export default function GuidedDay({ unit, units, exam, openDay, back }: { unit: ExamUnit; units: ExamUnit[]; exam: ExamApi; openDay: (key: string) => void; back: () => void }) {
  const day = GUIDED_DAYS[unit.key];
  const ticked = new Set(exam.state?.steps[unit.key] ?? []);
  const firstOpen = day.steps.findIndex((s) => !ticked.has(s.id));
  const [picked, setPicked] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");
  const elapsed = useElapsedMinutes();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  const total = day.steps.length;
  const index = picked ?? (firstOpen === -1 ? total : firstOpen);
  const onLog = index >= total;
  const step: GStep | undefined = day.steps[index];
  const idx = units.findIndex((u) => u.key === unit.key);
  const prev = units[idx - 1];
  const next = units[idx + 1];
  const minutesLeft = day.steps.slice(index).reduce((n, s) => n + s.minutes, 0);

  async function finishStep() {
    if (!step) return;
    const problem = await exam.act({ type: "tickStep", unitKey: unit.key, stepId: step.id, done: true });
    setSaveError(problem);
    if (!problem) setPicked(index + 1);
  }

  let body: ReactNode = null;
  if (step) {
    switch (step.kind) {
      case "hear": body = <HearStep day={day} withNumbers={unit.key === "2"} />; break;
      case "recall":
        body = unit.key === "2"
          ? <RecallStep patterns={DAY1.patterns} withSwaps={false} onRate={(p, r) => { if (exam.state?.cards[p.id]) void exam.act({ type: "reviewCard", cardId: p.id, rating: r === "got" ? "good" : r === "slow" ? "hard" : "again", eventId: `rv-${p.id}-${crypto.randomUUID()}` }); }} />
          : <RecallStep patterns={day.patterns} withSwaps />;
        break;
      case "questions": body = <QuestionsStep questions={day.understand} />; break;
      case "speak": body = <SpeakStep day={day} taskId={step.id} exam={exam} unitKey={unit.key} />; break;
      case "typelines": body = <TypeLinesStep day={day} exam={exam} unitKey={unit.key} />; break;
      case "wants": body = <WantsStep day={day} />; break;
      case "makeq": body = <MakeQStep day={day} />; break;
      case "conversation": body = <ConversationStep day={day} />; break;
      case "typemsg": body = <TypeMsgStep day={day} />; break;
      case "dictation": body = <DictationStep day={day} />; break;
      case "cards": body = <CardsStep day={day} exam={exam} unitKey={unit.key} />; break;
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PHASE 1 · {unit.label.toUpperCase()} · {unit.minutes} MIN</p>
          <h1>{day.title}</h1>
          <p>{day.goal}</p>
        </div>
      </div>
      <div className={`${base.row} ${base.between}`}>
        <button type="button" className="secondary" onClick={back}>All days</button>
        <span className={base.row}>
          <button type="button" className="secondary" disabled={!prev} onClick={() => prev && openDay(prev.key)}><ChevronLeft size={16} aria-hidden /> {prev?.label ?? ""}</button>
          <button type="button" className="secondary" disabled={!next} onClick={() => next && openDay(next.key)}>{next?.label ?? ""} <ChevronRight size={16} aria-hidden /></button>
        </span>
      </div>
      <p className={base.notice}>Hear each line before you say it. The voices are synthetic Sweden-Swedish, and the Swedish is AI-written and not yet checked by a teacher. Your teacher&rsquo;s voice is better to copy.</p>

      <div className={styles.head}>
        <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(index, total)} aria-label="Day progress"><div className={styles.progressFill} style={{ width: `${(Math.min(index, total) / (total + 1)) * 100}%` }} /></div>
        <nav className={styles.stepNav} aria-label="Steps">
          {day.steps.map((s, i) => (
            <button key={s.id} type="button" className={styles.stepDot} aria-current={i === index ? "step" : undefined} aria-label={`Step ${i + 1}: ${s.title}${ticked.has(s.id) ? " (done)" : ""}`} title={s.title} data-done={ticked.has(s.id)} onClick={() => setPicked(i)}>{ticked.has(s.id) ? "✓" : i + 1}</button>
          ))}
          <button type="button" className={styles.stepDot} aria-current={onLog ? "step" : undefined} data-done={!!exam.state?.days[unit.key]} onClick={() => setPicked(total)}>Log</button>
        </nav>
      </div>

      {step ? (
        <section className={styles.stage} aria-label={`Step ${index + 1} of ${total}`}>
          <p className={styles.minutes}>Step {index + 1} of {total} · about {step.minutes} min · about {minutesLeft} min left today · {elapsed} min on this page so far</p>
          <h2>{step.title}</h2>
          <p className={styles.intro}>{step.intro}</p>
          {index === 0 && day.rule ? (
            <div className={styles.ruleBox}>
              <b>The one grammar fact today.</b> {day.rule.text} Right: <b>{day.rule.right}</b>. Wrong: <del>{day.rule.wrong}</del>.
            </div>
          ) : null}
          {body}
          {saveError ? <p role="alert" className={base.error}>{saveError}</p> : null}
          <div className={styles.footer}>
            <button type="button" className="secondary" disabled={index === 0} onClick={() => setPicked(index - 1)}><ChevronLeft size={16} aria-hidden /> Back</button>
            <button type="button" className="primary" disabled={exam.saving} onClick={() => void finishStep()}>{index === total - 1 ? "Done. Go to the log" : "Done. Next step"} <ChevronRight size={16} aria-hidden /></button>
          </div>
        </section>
      ) : (
        <section className={styles.stage} aria-label="Log this day">
          <h2>All steps done. Log the day.</h2>
          <p className={styles.intro}>Be honest: Green means you did it on your own. Amber means slowly, or one mistake kept coming back. Red means you needed the model, so you repeat tomorrow with new details.</p>
          <p className={styles.tomorrow}>You were on this page for about {elapsed} minute{elapsed === 1 ? "" : "s"} (it counts only while this tab is open). Write the real number below.</p>
          <LogPanel key={unit.key} unit={unit} doneWhen={day.doneWhen} suggestedMinutes={elapsed > 0 ? elapsed : undefined} exam={exam} />
          <p className={styles.tomorrow}><InlineMarkdown text={`**Tomorrow:** ${day.tomorrow}`} /></p>
          <div className={styles.footer}>
            <button type="button" className="secondary" onClick={() => setPicked(total - 1)}><ChevronLeft size={16} aria-hidden /> Back to the last step</button>
            {next ? <button type="button" className="secondary" onClick={() => openDay(next.key)}>Open {next.label} <ChevronRight size={16} aria-hidden /></button> : null}
          </div>
        </section>
      )}
    </>
  );
}
