"use client";

import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { audioManifest } from "@/lib/audio-manifest";
import type { SpeechLanguage } from "@/lib/character-voices";
import type { StoryCharacterName } from "@/lib/story-world";

const STOP_AUDIO_EVENT = "stigen:stop-audio";

export type AudioSegment = {
  text: string;
  speaker: StoryCharacterName;
  language?: SpeechLanguage;
};

type AudioButtonProps = {
  text: string;
  label?: string;
  slow?: boolean;
  className?: string;
  language?: SpeechLanguage;
  speaker?: StoryCharacterName;
  segments?: AudioSegment[];
};

export default function AudioButton({
  text,
  label,
  slow = false,
  className = "secondary",
  language = "sv",
  speaker = "Sami",
  segments,
}: AudioButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const request = useRef<AbortController | null>(null);
  const objectUrl = useRef<string | null>(null);
  const mounted = useRef(true);
  const playToken = useRef(0);
  const resolvedLabel = label ?? (language === "sv" ? "Listen in Swedish" : "Listen in English");

  useEffect(() => {
    mounted.current = true;
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    function stop() {
      playToken.current += 1;
      request.current?.abort();
      request.current = null;
      if (audio.current) {
        audio.current.onended = null;
        audio.current.onerror = null;
        audio.current.pause();
        audio.current = null;
      }
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = null;
      }
      if (utterance.current && "speechSynthesis" in window) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
        utterance.current = null;
        window.speechSynthesis.cancel();
      }
      if (mounted.current) setSpeaking(false);
    }
    window.addEventListener(STOP_AUDIO_EVENT, stop);
    return () => {
      mounted.current = false;
      stop();
      window.removeEventListener(STOP_AUDIO_EVENT, stop);
    };
  }, []);

  function play() {
    setError("");
    const wasPlaying = speaking;
    window.dispatchEvent(new Event(STOP_AUDIO_EVENT));
    if (wasPlaying) return;
    const token = ++playToken.current;

    function browserSpeech() {
      if (!mounted.current || token !== playToken.current) return;
      if (!("speechSynthesis" in window)) {
        setSpeaking(false);
        setError("Audio could not play in this browser. Use the visible text instead.");
        return;
      }
      const locale = language === "sv" ? "sv-SE" : "en-GB";
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((item) => item.lang.toLowerCase() === locale.toLowerCase()) ??
        voices.find((item) => item.lang.toLowerCase().startsWith(language));
      if (!voice) {
        setSpeaking(false);
        setError(
          `Azure audio is unavailable, and no ${language === "sv" ? "Swedish" : "English"} voice is installed on this device. Use the visible text or retry when connected.`,
        );
        return;
      }
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = voice.lang || locale;
      speech.voice = voice;
      speech.rate = slow ? 0.7 : 0.9;
      speech.onstart = () => {
        if (mounted.current && token === playToken.current) setSpeaking(true);
      };
      speech.onend = () => {
        utterance.current = null;
        if (mounted.current && token === playToken.current) setSpeaking(false);
      };
      speech.onerror = (event) => {
        utterance.current = null;
        if (mounted.current && token === playToken.current) {
          setSpeaking(false);
          if (event.error !== "canceled" && event.error !== "interrupted") {
            setError("Audio could not play. Please try again or use the visible text.");
          }
        }
      };
      utterance.current = speech;
      window.speechSynthesis.speak(speech);
    }

    function playAudio(source: string, revokeAfter = false) {
      if (!mounted.current || token !== playToken.current) {
        if (revokeAfter) URL.revokeObjectURL(source);
        return;
      }
      const nativeAudio = new Audio(source);
      nativeAudio.playbackRate = slow && !revokeAfter ? 0.78 : 1;
      audio.current = nativeAudio;
      if (revokeAfter) objectUrl.current = source;
      let failed = false;
      function cleanup() {
        audio.current = null;
        if (revokeAfter && objectUrl.current) {
          URL.revokeObjectURL(objectUrl.current);
          objectUrl.current = null;
        }
      }
      function fallback() {
        if (failed || token !== playToken.current || !mounted.current) return;
        failed = true;
        nativeAudio.onerror = null;
        nativeAudio.pause();
        cleanup();
        setSpeaking(false);
        browserSpeech();
      }
      nativeAudio.onended = () => {
        if (mounted.current && token === playToken.current) setSpeaking(false);
        cleanup();
      };
      nativeAudio.onerror = fallback;
      setSpeaking(true);
      void nativeAudio.play().catch(fallback);
    }

    const source = audioManifest[text];
    if (source) {
      playAudio(source);
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setSpeaking(true);
    void fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        segments?.length
          ? {
              segments: segments.map((segment) => ({
                ...segment,
                language: segment.language ?? language,
              })),
              slow,
            }
          : { text, speaker, language, slow },
      ),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Azure speech unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (!mounted.current || token !== playToken.current) return;
        request.current = null;
        playAudio(URL.createObjectURL(blob), true);
      })
      .catch((reason: unknown) => {
        request.current = null;
        if (
          mounted.current &&
          token === playToken.current &&
          !(reason instanceof DOMException && reason.name === "AbortError")
        ) {
          setSpeaking(false);
          browserSpeech();
        }
      });
  }

  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        maxWidth: "100%",
      }}
    >
      <button
        type="button"
        className={className}
        onClick={play}
        aria-label={speaking ? "Stop audio" : resolvedLabel}
      >
        {speaking ? <Square size={17} /> : <Volume2 size={18} />}
        {speaking ? "Stop audio" : resolvedLabel}
      </button>
      {error && (
        <span
          role="status"
          style={{ fontSize: 12, color: "#95632e", lineHeight: 1.6 }}
        >
          {error}
        </span>
      )}
    </span>
  );
}
