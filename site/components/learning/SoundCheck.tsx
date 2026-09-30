"use client";

import { useEffect, useRef, useState } from "react";
import { Gauge, Loader2, Mic, Square } from "lucide-react";
import AudioButton from "./AudioButton";
import { toWav16k } from "./wav";

type Result = {
  heard: string;
  scores: { pronunciation: number | null; accuracy: number | null; fluency: number | null; completeness: number | null };
  words: Array<{ word: string; accuracy: number | null; error: string }>;
};

const MAX_SECONDS = 20;

function band(word: Result["words"][number]) {
  if (word.error === "Omission") return "missed";
  if (word.error === "Insertion") return "extra";
  if (word.accuracy === null) return "unknown";
  return word.accuracy >= 80 ? "good" : word.accuracy >= 60 ? "close" : "work";
}

/**
 * Say a Swedish line, hear yourself next to the model, and, when Azure is
 * connected, see which words sounded right. Scores are practice signals, not
 * a YKI rating.
 */
export default function SoundCheck({
  reference,
  title = "Check your pronunciation",
  recording,
}: {
  reference: string;
  title?: string;
  /**
   * An attempt recorded elsewhere (the mission's "Say it" stage). When given,
   * that recording is scored straight away and no second recorder is shown.
   */
  recording?: Blob | null;
}) {
  const [canScore, setCanScore] = useState(false);
  const [recordingNow, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const blob = useRef<Blob | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai-status", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((status: { capabilities?: { pronunciation?: boolean } } | null) => setCanScore(Boolean(status?.capabilities?.pronunciation)))
      .catch(() => {});
    return () => {
      controller.abort();
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
    };
  }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  // Use a recording made elsewhere, and score it once scoring is available.
  const autoScored = useRef(false);
  useEffect(() => {
    if (!recording) return;
    blob.current = recording;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors an external recording
    setUrl(URL.createObjectURL(recording));
  }, [recording]);
  useEffect(() => {
    if (!recording || !canScore || autoScored.current) return;
    autoScored.current = true;
    void score();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, canScore]);

  async function start() {
    setError("");
    setResult(null);
    window.dispatchEvent(new Event("stigen:stop-audio"));
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(media);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      rec.onstop = () => {
        media.getTracks().forEach((track) => track.stop());
        if (timer.current) clearInterval(timer.current);
        blob.current = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        setUrl(URL.createObjectURL(blob.current));
        setRecording(false);
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
      setSeconds(0);
      const started = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - started) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS && rec.state === "recording") rec.stop();
      }, 250);
    } catch {
      setError("The microphone could not open. Allow microphone access and try again.");
    }
  }

  async function score() {
    if (!blob.current || busy) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("audio", await toWav16k(blob.current), "sound-check.wav");
      form.set("reference", reference);
      const response = await fetch("/api/pronunciation", { method: "POST", body: form });
      const value = (await response.json()) as Result & { error?: string };
      if (!response.ok) throw new Error(value.error || "Scoring was unavailable. Compare with the model instead.");
      setResult(value);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Scoring was unavailable. Compare with the model instead.");
    } finally {
      setBusy(false);
    }
  }

  const weak = result?.words.filter((word) => ["work", "missed"].includes(band(word))) ?? [];
  return (
    <section className="sound-check" aria-label={title}>
      <h5><Gauge size={16} aria-hidden="true" /> {title}</h5>
      <p className="sound-check-target" lang="sv">{reference}</p>
      <div className="sound-check-actions">
        <AudioButton text={reference} label="Hear the model" slow className="secondary" />
        {!recording && (
          <button type="button" className={recordingNow ? "secondary" : "primary"} onClick={() => (recordingNow ? recorder.current?.stop() : void start())}>
            {recordingNow ? <Square size={15} /> : <Mic size={15} />}
            {recordingNow ? `Stop (${seconds}s)` : url ? "Record again" : "Record yourself"}
          </button>
        )}
      </div>
      {url && !recordingNow && (
        <div className="sound-check-compare">
          <span>Your voice</span>
          <audio controls src={url} aria-label="Your recording" />
          <small>Play the model, then yourself. Listen for one difference at a time.</small>
          {canScore && (
            <button type="button" className={result ? "secondary" : "primary"} disabled={busy} onClick={() => void score()}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Gauge size={15} />}
              {busy ? "Scoring…" : result ? "Score again" : "Score my pronunciation"}
            </button>
          )}
        </div>
      )}
      {result && result.scores.completeness === 0 && (
        <p className="sound-check-silent" role="status">
          No Swedish words were heard in this recording. Record again, a little louder and
          closer to the microphone.
        </p>
      )}
      {result && result.scores.completeness !== 0 && (
        <div className="sound-check-result" aria-live="polite">
          <dl>
            {([["Overall", result.scores.pronunciation], ["Sounds", result.scores.accuracy], ["Flow", result.scores.fluency], ["Complete", result.scores.completeness]] as const).map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value ?? "–"}</dd></div>
            ))}
          </dl>
          <p className="sound-check-words" lang="sv">
            {result.words.map((word, index) => (
              <span key={`${word.word}-${index}`} data-band={band(word)} title={word.error !== "None" ? word.error : `${word.accuracy ?? "–"} / 100`}>
                {word.word}
              </span>
            ))}
          </p>
          <small>
            {weak.length
              ? `Work on: ${[...new Set(weak.map((word) => word.word.toLocaleLowerCase("sv")))].join(", ")}. Hear the model, copy it slowly, then record again.`
              : "Every word was clear. Record once more at normal speed."}{" "}
            Practice scores from Azure, not a YKI rating.
          </small>
          <p className="sound-check-note">
            <b>Finland-Swedish note:</b> the scorer compares you with Sweden-Swedish.
            Finland-Swedish is also correct, and YKI accepts it. So a lower mark on a word
            like <span lang="sv">sju</span> or <span lang="sv">skjorta</span> (said with
            &ldquo;sh&rdquo;), or on the rise and fall of a word, is not a mistake.
          </p>
        </div>
      )}
      {error && <p className="lecture-error" role="alert">{error}</p>}
    </section>
  );
}
