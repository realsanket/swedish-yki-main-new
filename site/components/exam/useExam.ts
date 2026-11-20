"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// P0 shim: package D replaces this (with useRun.ts). The client still speaks the v1 state and actions.
import type { ExamActionV1 as ExamAction, ExamCurriculumEntry, ExamLearnerPage, ExamStateV1 as ExamState, ExamUnit } from "@/lib/exam-types";

/** Progress of the exam course track (GET and POST /api/exam). The server is the source of truth. */
export function useExam() {
  const [state, setState] = useState<ExamState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const queue = useRef(Promise.resolve());

  const reload = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/exam", { cache: "no-store", signal: AbortSignal.timeout(15000) });
      const body = (await response.json()) as ExamState & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Your exam-course progress is unavailable.");
      setState(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your exam-course progress is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => { if (live) return reload(); });
    return () => { live = false; };
  }, [reload]);

  /** Actions run one after another; resolves with an error message or "" when saved. */
  const act = useCallback((action: ExamAction): Promise<string> => {
    const run = queue.current.then(async () => {
      setSaving(true);
      try {
        const response = await fetch("/api/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action), signal: AbortSignal.timeout(15000) });
        const body = (await response.json()) as ExamState & { error?: string };
        if (!response.ok) return body.error ?? "This could not be saved.";
        setState(body);
        setError("");
        return "";
      } catch (reason) {
        return reason instanceof Error ? reason.message : "This could not be saved.";
      } finally {
        setSaving(false);
      }
    });
    queue.current = run.then(() => undefined);
    return run;
  }, []);

  return { state, loading, error, saving, act, reload };
}

export type ExamApi = ReturnType<typeof useExam>;

/* ---------------------------- content (cached) ---------------------------- */

const cache = new Map<string, Promise<unknown>>();
function content<T>(query: string): Promise<T> {
  let hit = cache.get(query) as Promise<T> | undefined;
  if (!hit) {
    hit = fetch(`/api/exam/content?${query}`).then(async (r) => {
      if (!r.ok) throw new Error("This part of the course could not be loaded.");
      return (await r.json()) as T;
    });
    hit.catch(() => cache.delete(query));
    cache.set(query, hit);
  }
  return hit;
}

export function useContent<T>(query: string | null): { data: T | null; error: string } {
  const [result, setResult] = useState<{ query: string | null; data: T | null; error: string }>({ query: null, data: null, error: "" });
  useEffect(() => {
    if (!query) return;
    let live = true;
    content<T>(query).then(
      (data) => { if (live) setResult({ query, data, error: "" }); },
      (reason: unknown) => { if (live) setResult({ query, data: null, error: reason instanceof Error ? reason.message : "Could not load." }); },
    );
    return () => { live = false; };
  }, [query]);
  // data from an earlier query is never shown for a new one
  return result.query === query ? { data: result.data, error: result.error } : { data: null, error: "" };
}

export const useUnits = () => useContent<ExamUnit[]>("kind=units");
export const useLearnerPage = (key: string | null) => useContent<ExamLearnerPage>(key ? `kind=learner&key=${encodeURIComponent(key)}` : null);
export const useCurriculumEntry = (key: string | null) => useContent<ExamCurriculumEntry>(key ? `kind=entry&key=${encodeURIComponent(key)}` : null);
