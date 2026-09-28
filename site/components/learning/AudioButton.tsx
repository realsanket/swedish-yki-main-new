"use client";

import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { audioManifest } from "@/lib/audio-manifest";

const STOP_AUDIO_EVENT = "stigen:stop-audio";

export default function AudioButton({ text, label = "Listen in Swedish", slow = false, className = "secondary" }: { text: string; label?: string; slow?: boolean; className?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const mounted = useRef(true);
  const playToken = useRef(0);

  useEffect(() => {
    mounted.current = true;
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    function stop() {
      playToken.current += 1;
      if (audio.current) { audio.current.onended = null; audio.current.onerror = null; audio.current.pause(); audio.current = null; }
      if (utterance.current && "speechSynthesis" in window) { utterance.current.onend = null; utterance.current.onerror = null; utterance.current = null; window.speechSynthesis.cancel(); }
      if (mounted.current) setSpeaking(false);
    }
    window.addEventListener(STOP_AUDIO_EVENT, stop);
    return () => { mounted.current = false; stop(); window.removeEventListener(STOP_AUDIO_EVENT, stop); };
  }, []);

  function play() {
    setError("");
    const wasPlaying = speaking;
    window.dispatchEvent(new Event(STOP_AUDIO_EVENT));
    if (wasPlaying) return;
    const token = ++playToken.current;
    function browserSpeech() {
      if (!mounted.current || token !== playToken.current) return;
      if (!("speechSynthesis" in window)) { setError("Audio could not play in this browser. Use the Swedish text or transcript."); return; }
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(item => item.lang.toLowerCase() === "sv-fi") ?? voices.find(item => item.lang.toLowerCase().startsWith("sv"));
      if (!voice) { setError("Audio could not load, and no Swedish voice is installed on this device. Retry when connected, or add a Swedish speech voice in device settings. You can also use the transcript."); return; }
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = voice.lang || "sv-FI"; speech.voice = voice; speech.rate = slow ? 0.7 : 0.9;
      speech.onstart = () => { if (mounted.current && token === playToken.current) setSpeaking(true); };
      speech.onend = () => { utterance.current = null; if (mounted.current && token === playToken.current) setSpeaking(false); };
      speech.onerror = event => { utterance.current = null; if (mounted.current && token === playToken.current) { setSpeaking(false); if (event.error !== "canceled" && event.error !== "interrupted") setError("Audio could not play. Please try again or use the transcript."); } };
      utterance.current = speech;
      window.speechSynthesis.speak(speech);
    }
    const source = audioManifest[text];
    if (!source) { browserSpeech(); return; }
    const nativeAudio = new Audio(source);
    nativeAudio.playbackRate = slow ? 0.78 : 1;
    audio.current = nativeAudio;
    let failed = false;
    function fallback() {
      if (failed || token !== playToken.current || !mounted.current) return;
      failed = true; nativeAudio.onerror = null; nativeAudio.pause(); audio.current = null; setSpeaking(false); browserSpeech();
    }
    nativeAudio.onended = () => { if (mounted.current && token === playToken.current) { setSpeaking(false); audio.current = null; } };
    nativeAudio.onerror = fallback;
    setSpeaking(true);
    void nativeAudio.play().catch(fallback);
  }

  return <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 8, maxWidth: "100%" }}><button type="button" className={className} onClick={play} aria-label={speaking ? "Stop Swedish audio" : label}>{speaking ? <Square size={17} /> : <Volume2 size={18} />}{speaking ? "Stop audio" : label}</button>{error && <span role="status" style={{ fontSize: 12, color: "#95632e", lineHeight: 1.6 }}>{error}</span>}</span>;
}
