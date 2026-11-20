"use client";

import { useSyncExternalStore } from "react";

/**
 * One shared audio player for every Swedish line in the exam course, so hundreds of
 * tap-to-hear chips cost almost nothing and only one line plays at a time. It also
 * stops when another part of the app plays audio (the same stop event AudioButton uses).
 * Voices are Azure's synthetic Sweden-Swedish voices (see /api/speech).
 */

const STOP_AUDIO_EVENT = "stigen:stop-audio";
export type SpeechState = "idle" | "loading" | "playing";
export type SpeechRequest = { text: string; speaker?: "Elin" | "Maja" | "Henrik" | "Alex"; slow?: boolean } | { segments: { text: string; speaker: "Elin" | "Maja" | "Henrik" | "Alex" }[]; slow?: boolean };

type Status = { key: string | null; state: SpeechState; error: string };
let status: Status = { key: null, state: "idle", error: "" };
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let controller: AbortController | null = null;
let objectUrl: string | null = null;
let token = 0;

function emit(next: Status) {
  status = next;
  listeners.forEach((l) => l());
}

function cleanup() {
  controller?.abort();
  controller = null;
  if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio = null; }
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
}

export function stopSpeech() {
  token += 1;
  cleanup();
  emit({ key: null, state: "idle", error: "" });
}

if (typeof window !== "undefined") {
  window.addEventListener(STOP_AUDIO_EVENT, () => { if (status.state !== "idle") stopSpeech(); });
}

export async function playSpeech(key: string, request: SpeechRequest): Promise<void> {
  if (status.key === key && status.state !== "idle") { stopSpeech(); return; }
  // stop everything else (including the lecture AudioButtons), then start this line
  token += 1;
  cleanup();
  window.dispatchEvent(new Event(STOP_AUDIO_EVENT));
  const mine = ++token;
  controller = new AbortController();
  emit({ key, state: "loading", error: "" });
  const body = "segments" in request
    ? { segments: request.segments.map((s) => ({ ...s, language: "sv" })), slow: !!request.slow }
    : { text: request.text, speaker: request.speaker ?? "Elin", language: "sv", slow: !!request.slow };
  try {
    const response = await fetch("/api/speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) {
      const info = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(info?.error ?? "The Swedish voice could not be generated.");
    }
    const blob = await response.blob();
    if (mine !== token) return;
    controller = null;
    objectUrl = URL.createObjectURL(blob);
    audio = new Audio(objectUrl);
    audio.onended = () => { if (mine === token) { cleanup(); emit({ key: null, state: "idle", error: "" }); } };
    audio.onerror = () => { if (mine === token) { cleanup(); emit({ key, state: "idle", error: "The audio could not play. Try again." }); } };
    emit({ key, state: "playing", error: "" });
    await audio.play();
  } catch (reason) {
    if (mine !== token) return;
    if (reason instanceof DOMException && reason.name === "AbortError") return;
    cleanup();
    emit({ key, state: "idle", error: reason instanceof Error ? reason.message : "The Swedish voice is unavailable." });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** State of one line: its own play state and, if it failed, its own error. */
export function useSpeech(key: string): { state: SpeechState; error: string } {
  const snapshot = useSyncExternalStore(subscribe, () => status, () => status);
  return snapshot.key === key ? { state: snapshot.state, error: snapshot.error } : { state: "idle", error: "" };
}
