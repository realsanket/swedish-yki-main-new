"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, AudioLines, Check, Clock3, Headphones, Loader2, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react";
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
type LiveEvent = { type?: unknown; delta?: unknown; reason?: unknown; error?: { message?: unknown; code?: unknown } };
const MAX_SECONDS = 180;
const MAX_TRANSCRIPT = 20000;
const noOp = () => {};

/** GPT-Live uses session.* events; it is a different protocol from Realtime. */
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
  const peer = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);
  const microphone = useRef<MediaStream | null>(null);
  const speaker = useRef<HTMLAudioElement | null>(null);
  const networkRequest = useRef<AbortController | null>(null);
  const startupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  const transcripts = useRef({ learner: "", coach: "" });
  const active = phase === "connecting" || phase === "live" || phase === "closing";
  const pronunciationMode = mode === "pronunciation";

  const release = useCallback(() => {
    runId.current += 1;
    running.current = false;
    networkRequest.current?.abort(); networkRequest.current = null;
    if (startupTimer.current) clearTimeout(startupTimer.current);
    if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (durationTimeout.current) clearTimeout(durationTimeout.current);
    if (closingTimer.current) clearTimeout(closingTimer.current);
    startupTimer.current = disconnectTimer.current = durationTimeout.current = closingTimer.current = null;
    durationTimer.current = null;
    microphone.current?.getTracks().forEach(track => { track.onended = null; track.stop(); }); microphone.current = null;
    if (speaker.current) { speaker.current.pause(); speaker.current.srcObject = null; speaker.current = null; }
    if (channel.current) { channel.current.onopen = null; channel.current.onmessage = null; channel.current.onclose = null; channel.current.onerror = null; channel.current.close(); channel.current = null; }
    if (peer.current) { peer.current.onconnectionstatechange = null; peer.current.ontrack = null; peer.current.close(); peer.current = null; }
    closing.current = false;
  }, []);

  const finalize = useCallback(() => {
    release();
    if (mounted.current) { setPhase("ended"); setMuted(false); setNeedsPlayback(false); onActiveChange(false); }
  }, [onActiveChange, release]);

  const finish = useCallback((message: string, failure = "") => {
    if (closing.current) return;
    closing.current = true;
    microphone.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    speaker.current?.pause();
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (durationTimeout.current) clearTimeout(durationTimeout.current);
    if (startupTimer.current) clearTimeout(startupTimer.current);
    if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
    if (mounted.current) { setNotice(message); setError(failure); setPhase("closing"); }
    if (channel.current?.readyState === "open") {
      try { channel.current.send(JSON.stringify({ type: "session.close" })); } catch { finalize(); return; }
      // Stop the microphone immediately; briefly keep the event stream open for
      // session.closed, then always release transport resources.
      closingTimer.current = setTimeout(finalize, 1000);
    } else finalize();
  }, [finalize]);

  useEffect(() => {
    mounted.current = true;
    function leavePage() {
      if (channel.current?.readyState === "open") { try { channel.current.send(JSON.stringify({ type: "session.close" })); } catch { /* Close transports regardless. */ } }
      release();
      if (mounted.current) { setPhase("ended"); setNotice("The conversation ended when you left this page."); onActiveChange(false); }
    }
    function stopForOtherAudio() { if (running.current) finish("Conversation ended to play another audio sample. Your words are still below."); }
    window.addEventListener("pagehide", leavePage);
    window.addEventListener("stigen:stop-audio", stopForOtherAudio);
    return () => { mounted.current = false; leavePage(); window.removeEventListener("pagehide", leavePage); window.removeEventListener("stigen:stop-audio", stopForOtherAudio); onActiveChange(false); };
  }, [onActiveChange, release, finish]);

  async function enablePlayback() {
    if (!speaker.current) return;
    try { await speaker.current.play(); if (mounted.current) setNeedsPlayback(false); }
    catch { if (mounted.current) setError("Your browser blocked coach audio. Check the tab’s sound permission, then select Enable coach audio again."); }
  }

  async function start() {
    if (running.current || active || disabled || !available) return;
    release();
    setError(""); setNotice(""); setMuted(false); setImported(false); setNeedsPlayback(false);
    setLearnerText(""); setCoachText(""); transcripts.current = { learner: "", coach: "" };
    setRemaining(MAX_SECONDS);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) { setError("Live voice needs a browser with microphone and WebRTC support on a secure connection. Try current Chrome, Edge, Firefox, or Safari, or use recording practice below."); return; }
    const id = ++runId.current;
    const current = () => mounted.current && id === runId.current;
    window.dispatchEvent(new Event("stigen:stop-audio"));
    running.current = true;
    setPhase("connecting"); onActiveChange(true);
    const audio = new Audio(); audio.autoplay = true; speaker.current = audio;
    startupTimer.current = setTimeout(() => { if (current()) finish("The conversation did not connect.", "Check microphone permission and your network, then start again. Recording practice remains available below."); }, 45000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!current()) { stream.getTracks().forEach(track => track.stop()); return; }
      microphone.current = stream;
      const pc = new RTCPeerConnection(); peer.current = pc;
      for (const track of stream.getAudioTracks()) {
        pc.addTransceiver(track, { direction: "sendrecv", streams: [stream] });
        track.onended = () => { if (current()) finish("The microphone stopped.", "Reconnect your microphone or restore browser permission, then start a new conversation."); };
      }
      pc.ontrack = event => {
        if (!current() || closing.current) return;
        audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void audio.play().catch(() => { if (current() && !closing.current) setNeedsPlayback(true); });
      };
      pc.onconnectionstatechange = () => {
        if (!current() || closing.current) return;
        if (pc.connectionState === "failed") finish("The voice connection ended.", "Your network could not maintain the audio connection. Check your connection and try again; your transcript is still below.");
        else if (pc.connectionState === "disconnected") {
          setNotice("Connection interrupted. Trying to reconnect…");
          if (!disconnectTimer.current) disconnectTimer.current = setTimeout(() => { if (current()) finish("The voice connection was lost.", "Check your network and start a new conversation. Your transcript is still below."); }, 8000);
        } else if (pc.connectionState === "connected") { if (disconnectTimer.current) clearTimeout(disconnectTimer.current); disconnectTimer.current = null; setNotice("Start with “Hej!” Your coach is listening."); }
      };
      const dc = pc.createDataChannel("oai-events"); channel.current = dc;
      let maximumSeconds = MAX_SECONDS;
      dc.onopen = () => {
        if (!current() || closing.current) return;
        if (startupTimer.current) clearTimeout(startupTimer.current);
        setPhase("live"); setNotice("Start with “Hej!” Your coach is listening.");
        const deadline = Date.now() + maximumSeconds * 1000;
        durationTimer.current = setInterval(() => { if (current()) setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))); }, 500);
        durationTimeout.current = setTimeout(() => { if (current()) { setRemaining(0); finish("Your three-minute conversation is complete. Review your words below."); } }, maximumSeconds * 1000);
      };
      dc.onmessage = ({ data }) => {
        if (!current() || typeof data !== "string" || data.length > 100000) return;
        let event: LiveEvent;
        try { event = JSON.parse(data) as LiveEvent; } catch { return; }
        if (!event || typeof event !== "object") return;
        if (event.type === "session.closed") {
          if (!closing.current) setNotice(event.reason === "expired" ? "The voice session expired. Your transcript is still below." : "The conversation ended. Review your words below.");
          finalize(); return;
        }
        if (event.type === "session.input_transcript.delta" || event.type === "session.output_transcript.delta") {
          if (typeof event.delta !== "string") return;
          const role = event.type === "session.input_transcript.delta" ? "learner" : "coach";
          const next = transcripts.current[role] + event.delta;
          if (next.length > MAX_TRANSCRIPT) { finish("The transcript limit was reached. Review this conversation before starting another."); return; }
          transcripts.current[role] = next;
          if (role === "learner") setLearnerText(next); else setCoachText(next);
        } else if (event.type === "error" && !closing.current) {
          const code = typeof event.error?.code === "string" ? event.error.code : "";
          finish("The voice service could not continue.", code.includes("rate_limit") || code.includes("quota") ? "The voice service is busy or its quota is exhausted. Wait a minute before trying again; your transcript is preserved below." : "The provider reported a session error. Start a new conversation; if it persists, use recording or typed practice and check your connection settings.");
        }
      };
      dc.onerror = () => { if (current() && !closing.current) finish("The conversation connection failed.", "Check your network and start again. Any transcript already received is preserved below."); };
      dc.onclose = () => { if (current() && !closing.current) { setNotice("The voice connection closed. Your transcript is still below."); finalize(); } };
      const offer = await pc.createOffer();
      if (!current()) return;
      await pc.setLocalDescription(offer);
      if (!current()) return;
      const controller = new AbortController(); networkRequest.current = controller;
      const response = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sdp: pc.localDescription?.sdp ?? offer.sdp, taskId, exam: false, mode }), signal: controller.signal });
      const result = await response.json() as { sdp?: string; sessionId?: string; maxDurationSeconds?: number; error?: string };
      if (!current()) return;
      if (!response.ok) throw new Error(result.error || "The live voice service is not available right now. Try again shortly.");
      if (typeof result.sdp !== "string" || !result.sdp.startsWith("v=0")) throw new Error("The voice service returned an incomplete connection response. Please try again.");
      maximumSeconds = typeof result.maxDurationSeconds === "number" ? Math.min(MAX_SECONDS, Math.max(1, result.maxDurationSeconds)) : MAX_SECONDS;
      setRemaining(maximumSeconds);
      await pc.setRemoteDescription({ type: "answer", sdp: result.sdp });
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
    microphone.current?.getAudioTracks().forEach(track => { track.enabled = !next; });
    if (channel.current?.readyState === "open") { try { channel.current.send(JSON.stringify({ type: next ? "session.input_audio.mute" : "session.input_audio.unmute" })); } catch { finish("The voice connection ended.", "Start again to reconnect your microphone."); return; } }
    setMuted(next);
  }

  return <section className={styles.card} aria-label={pronunciationMode ? "Live Swedish pronunciation coach" : "Live Swedish conversation"}>
    <div className={styles.heading}><span className={styles.symbol}><AudioLines size={23} /></span><div><span className={styles.eyebrow}>LIVE VOICE COACH</span><h4>{pronunciationMode ? "Hear it. Say it. Notice one detail." : "A conversation, at your pace."}</h4></div><span className={`${styles.status} ${phase === "live" ? styles.connected : ""}`}>{phase === "live" ? <><i />{muted ? "Mic muted" : "Live"}</> : phase === "connecting" ? "Connecting" : phase === "closing" ? "Ending" : pronunciationMode ? "2 min" : "3 min"}</span></div>
    <p className={styles.description}>{pronunciationMode ? "A responsive Azure GPT-Live coach models this lesson’s sound focus, leaves room for you to repeat, and gives one gentle cue. You can speak English whenever you need help." : "Practise this lesson with a patient Swedish coach. Speak naturally, ask for help in English, and try your next sentence together."}</p>
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
      <small>Live transcripts can contain mistakes. Fragments are collected by speaker, so they may overlap in time.</small>
      {!active && learnerText.trim() && onTranscript && <button className="secondary" disabled={disabled || imported} onClick={() => { if (onTranscript(learnerText.trim())) setImported(true); }}>{imported ? <Check size={16} /> : <ArrowDownToLine size={16} />}{imported ? "Your words added to the draft" : "Add my words to the draft"}</button>}
    </div>}
    <p className={styles.privacy}><Headphones size={14} /><span>Use headphones for clear audio. Starting sends your microphone audio to Azure Foundry and plays an AI-generated voice. The session ends after three minutes or when you leave this exercise.</span></p>
    {(learnerText || coachText) && !active && <small className={styles.retention}>Add any words you want to keep to your draft before starting another conversation or leaving this exercise.</small>}
  </section>;
}
