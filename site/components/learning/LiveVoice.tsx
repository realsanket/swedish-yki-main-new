"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, AudioLines, Check, Clock3, Headphones, Loader2, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react";
import { base64ToBytes, bytesToBase64, VoiceLiveAudio } from "./voice-live-audio";
import styles from "./LiveVoice.module.css";

type Phase = "idle" | "connecting" | "live" | "closing" | "ended";
type Props = {
  taskId: string;
  available: boolean;
  signedIn: boolean;
  disabled?: boolean;
  mode?: "conversation" | "pronunciation";
  onTranscript?: (text: string) => boolean;
  onActiveChange?: (active: boolean) => void;
};
type LiveEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  maxDurationSeconds?: number;
  error?: { message?: string; code?: string };
};

const MAX_SECONDS = 180;
const MAX_TRANSCRIPT = 20_000;
const noOp = () => {};

/** Secure browser client for the server-proxied Azure Speech Voice Live session. */
export default function LiveVoice({ taskId, available, signedIn, disabled = false, mode = "conversation", onTranscript, onActiveChange = noOp }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [muted, setMuted] = useState(false);
  const [remaining, setRemaining] = useState(MAX_SECONDS);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [needsPlayback, setNeedsPlayback] = useState(false);
  const [learnerText, setLearnerText] = useState("");
  const [coachText, setCoachText] = useState("");
  const [imported, setImported] = useState(false);
  const mounted = useRef(true);
  const running = useRef(false);
  const runId = useRef(0);
  const socket = useRef<WebSocket | null>(null);
  const audio = useRef<VoiceLiveAudio | null>(null);
  const startupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  const suppressPlayback = useRef(false);
  const coachTurnStarted = useRef(false);
  const transcripts = useRef({ learner: "", coach: "" });
  const active = phase === "connecting" || phase === "live" || phase === "closing";
  const pronunciationMode = mode === "pronunciation";

  const release = useCallback(() => {
    runId.current += 1;
    running.current = false;
    if (startupTimer.current) clearTimeout(startupTimer.current);
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (durationTimeout.current) clearTimeout(durationTimeout.current);
    startupTimer.current = durationTimeout.current = null;
    durationTimer.current = null;
    const currentSocket = socket.current;
    socket.current = null;
    if (currentSocket) {
      currentSocket.onopen = currentSocket.onmessage = currentSocket.onerror = currentSocket.onclose = null;
      if (currentSocket.readyState === WebSocket.OPEN) currentSocket.send(JSON.stringify({ type: "client.stop" }));
      currentSocket.close();
    }
    const engine = audio.current;
    audio.current = null;
    if (engine) void engine.close();
    suppressPlayback.current = false;
    coachTurnStarted.current = false;
    closing.current = false;
  }, []);

  const finalize = useCallback(() => {
    release();
    if (mounted.current) {
      setPhase("ended");
      setMuted(false);
      setNeedsPlayback(false);
      onActiveChange(false);
    }
  }, [onActiveChange, release]);

  const finish = useCallback((message: string, failure = "") => {
    if (closing.current) return;
    closing.current = true;
    audio.current?.stopPlayback();
    if (mounted.current) {
      setNotice(message);
      setError(failure);
      setPhase("closing");
    }
    finalize();
  }, [finalize]);

  useEffect(() => {
    mounted.current = true;
    function leavePage() {
      release();
      if (mounted.current) {
        setPhase("ended");
        setNotice("The conversation ended when you left this page.");
        onActiveChange(false);
      }
    }
    function stopForOtherAudio() {
      if (running.current) finish("Conversation ended to play another audio sample. Your words are still below.");
    }
    window.addEventListener("pagehide", leavePage);
    window.addEventListener("stigen:stop-audio", stopForOtherAudio);
    return () => {
      mounted.current = false;
      leavePage();
      window.removeEventListener("pagehide", leavePage);
      window.removeEventListener("stigen:stop-audio", stopForOtherAudio);
      onActiveChange(false);
    };
  }, [onActiveChange, release, finish]);

  async function enablePlayback() {
    try {
      await audio.current?.resume();
      if (mounted.current) setNeedsPlayback(false);
    } catch {
      if (mounted.current) setError("Your browser blocked coach audio. Check the tab’s sound permission, then select Enable coach audio again.");
    }
  }

  function appendTranscript(role: "learner" | "coach", fragment: string, newTurn = false) {
    const current = transcripts.current[role];
    const separator = current && newTurn ? "\n" : role === "learner" && current ? " " : "";
    const next = current + separator + fragment;
    if (next.length > MAX_TRANSCRIPT) {
      finish("The transcript limit was reached. Review this conversation before starting another.");
      return;
    }
    transcripts.current[role] = next;
    if (role === "learner") setLearnerText(next);
    else setCoachText(next);
  }

  async function start() {
    if (running.current || active || disabled || !available) return;
    release();
    setError(""); setNotice(""); setMuted(false); setImported(false); setNeedsPlayback(false);
    setLearnerText(""); setCoachText(""); transcripts.current = { learner: "", coach: "" };
    setRemaining(MAX_SECONDS);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.WebSocket || !window.AudioContext || !window.AudioWorkletNode) {
      setError("Live voice needs a current browser with microphone, Web Audio, and WebSocket support on a secure connection. Recording practice remains available below.");
      return;
    }
    const id = ++runId.current;
    const current = () => mounted.current && id === runId.current;
    window.dispatchEvent(new Event("stigen:stop-audio"));
    running.current = true;
    setPhase("connecting"); onActiveChange(true);
    startupTimer.current = setTimeout(() => {
      if (current()) finish("The conversation did not connect.", "Check microphone permission and your network, then start again. Recording practice remains available below.");
    }, 45_000);
    try {
      const engine = new VoiceLiveAudio();
      audio.current = engine;
      await engine.initialize(
        (bytes) => {
          const currentSocket = socket.current;
          if (current() && !closing.current && currentSocket?.readyState === WebSocket.OPEN) {
            currentSocket.send(JSON.stringify({ type: "input_audio_buffer.append", audio: bytesToBase64(bytes) }));
          }
        },
        () => {
          if (current()) finish("The microphone stopped.", "Reconnect your microphone or restore browser permission, then start a new conversation.");
        },
      );
      if (!current()) return void engine.close();
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const liveSocket = new WebSocket(`${protocol}//${window.location.host}/api/live/ws`);
      socket.current = liveSocket;
      liveSocket.onopen = () => {
        if (!current() || closing.current) return;
        liveSocket.send(JSON.stringify({ type: "client.start", taskId, mode }));
      };
      liveSocket.onmessage = ({ data }) => {
        if (!current() || typeof data !== "string" || data.length > 100_000) return;
        let event: LiveEvent;
        try { event = JSON.parse(data) as LiveEvent; } catch { return; }
        if (!event?.type) return;

        if (event.type === "session.ready") {
          if (startupTimer.current) clearTimeout(startupTimer.current);
          const maximumSeconds = typeof event.maxDurationSeconds === "number" ? Math.min(MAX_SECONDS, Math.max(1, event.maxDurationSeconds)) : MAX_SECONDS;
          setRemaining(maximumSeconds);
          setPhase("live");
          setNotice("Start with “Hej!” Your coach is listening.");
          const deadline = Date.now() + maximumSeconds * 1000;
          durationTimer.current = setInterval(() => { if (current()) setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))); }, 500);
          durationTimeout.current = setTimeout(() => {
            if (current()) {
              setRemaining(0);
              finish(pronunciationMode ? "Your two-minute sound practice is complete." : "Your three-minute conversation is complete. Review your words below.");
            }
          }, maximumSeconds * 1000);
          return;
        }

        if (event.type === "input_audio_buffer.speech_started") {
          suppressPlayback.current = true;
          engine.stopPlayback();
          setNotice("Listening…");
          return;
        }
        if (event.type === "input_audio_buffer.speech_stopped") {
          setNotice("Thinking…");
          return;
        }
        if (event.type === "response.created") {
          suppressPlayback.current = false;
          coachTurnStarted.current = false;
          setNotice("Your coach is responding…");
          return;
        }
        if (event.type === "response.done") {
          setNotice("Your coach is listening.");
          return;
        }
        if (event.type === "response.audio.delta" && typeof event.delta === "string" && !suppressPlayback.current) {
          void engine.playPcm16(base64ToBytes(event.delta)).catch(() => {
            if (current() && !closing.current) setNeedsPlayback(true);
          });
          return;
        }
        if (event.type === "conversation.input_transcription.completed" && typeof event.transcript === "string" && event.transcript.trim()) {
          appendTranscript("learner", event.transcript.trim(), Boolean(transcripts.current.learner));
          return;
        }
        if (event.type === "response.audio_transcript.delta" && typeof event.delta === "string") {
          appendTranscript("coach", event.delta, !coachTurnStarted.current);
          coachTurnStarted.current = true;
          return;
        }
        if (event.type === "session.limit") {
          finish("Your live practice time is complete. Review your words below.");
          return;
        }
        if (event.type === "error" && !closing.current) {
          const code = event.error?.code || "";
          finish(
            "The voice service could not continue.",
            code.includes("rate_limit") || code.includes("quota")
              ? "The voice service is busy or its quota is exhausted. Wait a minute before trying again; your transcript is preserved below."
              : event.error?.message || "The provider reported a session error. Start a new conversation or use recorded practice below.",
          );
        }
      };
      liveSocket.onerror = () => {
        if (current() && !closing.current) finish("The conversation connection failed.", "Check your network and start again. Any transcript already received is preserved below.");
      };
      liveSocket.onclose = () => {
        if (current() && !closing.current) {
          setNotice("The voice connection closed. Your transcript is still below.");
          finalize();
        }
      };
    } catch (caught) {
      if (!current()) return;
      let message = caught instanceof Error ? caught.message : "Could not connect. Please check your network and try again.";
      if (caught instanceof DOMException) {
        if (caught.name === "NotAllowedError" || caught.name === "SecurityError") message = "Microphone access was denied. Allow microphone access in your browser’s site settings, then try again.";
        else if (caught.name === "NotFoundError") message = "No microphone was found. Connect a microphone, or continue with typed practice below.";
        else if (caught.name === "NotReadableError") message = "The microphone is busy or unavailable. Close other apps using it and try again.";
        else if (caught.name === "AbortError") message = "The connection request was interrupted. Please try again.";
      }
      finish("The conversation could not start.", message);
    }
  }

  function toggleMute() {
    const next = !muted;
    audio.current?.setMuted(next);
    setMuted(next);
  }

  return <section className={styles.card} aria-label={pronunciationMode ? "Live Swedish pronunciation coach" : "Live Swedish conversation"}>
    <div className={styles.heading}><span className={styles.symbol}><AudioLines size={23} /></span><div><span className={styles.eyebrow}>LIVE VOICE COACH</span><h4>{pronunciationMode ? "Hear it. Say it. Notice one detail." : "A conversation, at your pace."}</h4></div><span className={`${styles.status} ${phase === "live" ? styles.connected : ""}`}>{phase === "live" ? <><i />{muted ? "Mic muted" : "Live"}</> : phase === "connecting" ? "Connecting" : phase === "closing" ? "Ending" : pronunciationMode ? "2 min" : "3 min"}</span></div>
    <p className={styles.description}>{pronunciationMode ? "A bilingual Azure Voice Live coach models one small Swedish sound group, leaves room for you to repeat, and can explain one detail in Indian English." : "Practise with a patient bilingual coach. Speak Swedish when you can, ask for help in English, and hear English explanations with an Indian accent."}</p>
    <div className={styles.controls}>
      {active ? <><button className="secondary" onClick={() => finish(pronunciationMode ? "Sound coaching ended. Review the cue above and try again when you are ready." : "Conversation ended. Review your words below.")} disabled={phase === "closing"}><PhoneOff size={16} />{phase === "connecting" ? "Cancel connection" : phase === "closing" ? "Ending…" : pronunciationMode ? "End sound coaching" : "End conversation"}</button>{phase === "live" && <button className="secondary" onClick={toggleMute} aria-pressed={muted}>{muted ? <MicOff size={16} /> : <Mic size={16} />}{muted ? "Unmute" : "Mute microphone"}</button>}<span className={styles.timer}><Clock3 size={14} />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span></> : <button className="primary" disabled={!available || disabled} onClick={start}><Mic size={17} />{phase === "ended" ? pronunciationMode ? "Start sound coaching again" : "Start another conversation" : pronunciationMode ? "Start sound coaching" : "Start conversation"}</button>}
      {needsPlayback && active && <button className="primary" onClick={enablePlayback}><Volume2 size={16} />Enable coach audio</button>}
    </div>
    {phase === "connecting" && <p className={styles.notice} role="status"><Loader2 size={15} className={styles.spinner} />Allow the microphone if your browser asks. Connecting securely…</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!available && !active && <p className={styles.unavailable}>{signedIn ? "Live voice is not connected for this session. Recording and typed practice are available below." : <>Sign in to check live voice availability. <a href="/signin-with-chatgpt?return_to=/">Sign in with ChatGPT</a></>}</p>}
    {(active || learnerText || coachText) && <div className={styles.transcripts}>
      <div className={styles.transcript}><h5><Mic size={15} />Your words</h5><p lang="sv">{learnerText || "Your speech will appear here…"}</p></div>
      <div className={styles.transcript}><h5><Sparkles size={15} />Your coach</h5><p>{coachText || "Your coach’s words will appear here…"}</p></div>
      <small>Live transcripts can contain mistakes. Each completed turn is kept on a new line.</small>
      {!active && learnerText.trim() && onTranscript && <button className="secondary" disabled={disabled || imported} onClick={() => { if (onTranscript(learnerText.trim())) setImported(true); }}>{imported ? <Check size={16} /> : <ArrowDownToLine size={16} />}{imported ? "Your words added to the draft" : "Add my words to the draft"}</button>}
    </div>}
    <p className={styles.privacy}><Headphones size={14} /><span>Headphones give the cleanest turn-taking. Your microphone audio passes through Stigen’s secure server to Azure Voice Live; the Azure key and lesson instructions never enter the browser.</span></p>
    {(learnerText || coachText) && !active && <small className={styles.retention}>Add any words you want to keep to your draft before starting another conversation or leaving this exercise.</small>}
  </section>;
}
