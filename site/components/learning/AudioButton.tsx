"use client";

import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
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
  const audio = useRef<HTMLAudioElement | null>(null);
  const request = useRef<AbortController | null>(null);
  const objectUrl = useRef<string | null>(null);
  const mounted = useRef(true);
  const playToken = useRef(0);
  const resolvedLabel = label ??
    (language === "sv" ? "Listen in Swedish" : "Listen in English");

  useEffect(() => {
    mounted.current = true;
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
        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            result?.error ?? "Azure lesson audio could not be generated.",
          );
        }
        return response.blob();
      })
      .then((blob) => {
        if (!mounted.current || token !== playToken.current) return;
        request.current = null;
        const source = URL.createObjectURL(blob);
        const nativeAudio = new Audio(source);
        objectUrl.current = source;
        audio.current = nativeAudio;

        function cleanup() {
          audio.current = null;
          if (objectUrl.current) {
            URL.revokeObjectURL(objectUrl.current);
            objectUrl.current = null;
          }
        }

        nativeAudio.onended = () => {
          cleanup();
          if (mounted.current && token === playToken.current) setSpeaking(false);
        };
        nativeAudio.onerror = () => {
          cleanup();
          if (mounted.current && token === playToken.current) {
            setSpeaking(false);
            setError("Azure audio could not play. Please try again.");
          }
        };
        void nativeAudio.play().catch(() => {
          nativeAudio.onerror = null;
          cleanup();
          if (mounted.current && token === playToken.current) {
            setSpeaking(false);
            setError("Azure audio could not play. Please try again.");
          }
        });
      })
      .catch((reason: unknown) => {
        request.current = null;
        if (
          mounted.current &&
          token === playToken.current &&
          !(reason instanceof DOMException && reason.name === "AbortError")
        ) {
          setSpeaking(false);
          setError(
            reason instanceof Error
              ? reason.message
              : "Azure lesson audio could not be generated.",
          );
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
        aria-label={speaking ? "Stop Azure audio" : resolvedLabel}
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
