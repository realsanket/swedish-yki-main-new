"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultCourseProgress,
  type CourseAction,
  type CourseProgressData,
} from "@/lib/course-progress";

type WithoutTransport<T> = T extends unknown
  ? Omit<T, "lectureId" | "revision" | "mutationId">
  : never;
export type CourseMutation = WithoutTransport<CourseAction>;
export type SaveCourse = (
  lectureId: string,
  mutation: CourseMutation,
) => Promise<CourseProgressData>;
type PendingSave = { action: CourseAction; body: string; signature: string };

function signature(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(signature).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${signature((value as Record<string, unknown>)[key])}`,
    )
    .join(",")}}`;
}
function snapshot(value: unknown): value is CourseProgressData {
  return (
    !!value &&
    typeof value === "object" &&
    "lectures" in value &&
    !!value.lectures &&
    typeof value.lectures === "object" &&
    !Array.isArray(value.lectures)
  );
}

export function useCourse() {
  const [data, setData] = useState<CourseProgressData>(defaultCourseProgress);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(data);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const conflicts = useRef(new Set<string>());
  // Keep the exact body after an ambiguous outcome. Later saves reconcile it
  // before creating a new mutation, including when a child component remounts.
  const pending = useRef<PendingSave | null>(null);
  const receive = useCallback((next: CourseProgressData) => {
    const merged = { lectures: { ...latest.current.lectures } };
    for (const [id, state] of Object.entries(next.lectures))
      if (state.revision >= (merged.lectures[id]?.revision ?? 0))
        merged.lectures[id] = state;
    latest.current = merged;
    setData(merged);
  }, []);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/course", {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Your course work could not be loaded.",
        );
      if (!snapshot(result))
        throw new Error(
          "The course response was incomplete. Please try again.",
        );
      receive(result);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your course work could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [receive]);
  useEffect(() => {
    let active = true;
    // Defer the initial request so a Strict Mode cleanup can cancel its start.
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const transmit = useCallback(
    async (save: PendingSave): Promise<CourseProgressData> => {
      for (let attempt = 0; attempt < 2; attempt++) {
        let response: Response;
        let result: unknown;
        try {
          response = await fetch("/api/course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: save.body,
            signal: AbortSignal.timeout(20000),
          });
          result = await response.json();
        } catch {
          continue;
        }
        // A proxy error, truncated response or server error can occur after the
        // transaction commits. Retrying with the original ID is the only safe way
        // to distinguish that from a request which never arrived.
        if (response.ok && snapshot(result)) {
          receive(result);
          if (pending.current === save) pending.current = null;
          return latest.current;
        }
        if (response.ok || response.status >= 500) continue;
        if (pending.current === save) pending.current = null;
        if (response.status === 409) {
          conflicts.current.add(save.action.lectureId);
          try {
            const refresh = await fetch("/api/course", {
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            });
            const updated = await refresh.json();
            if (refresh.ok && snapshot(updated)) receive(updated);
          } catch {
            /* Keep the conflict barrier until the learner resolves it. */
          }
        }
        const message =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Your work was not saved. Please try again.";
        throw new Error(message);
      }
      throw new Error(
        "The connection was interrupted. Your pending save is kept in this page. Try saving again to safely confirm it.",
      );
    },
    [receive],
  );

  const save: SaveCourse = useCallback(
    (lectureId, mutation) => {
      // Copy the caller's values now; later editing must not change queued work.
      const requested = structuredClone(mutation);
      const requestedSignature = signature({ lectureId, mutation: requested });
      const run = queue.current
        .catch(() => {})
        .then(async () => {
          if (conflicts.current.has(lectureId))
            throw new Error(
              "This lecture changed in another tab. Your draft is kept here. Reload to use the other version, or choose Save my draft to apply your changes.",
            );
          const unresolved = pending.current;
          if (unresolved) {
            await transmit(unresolved);
            if (unresolved.signature === requestedSignature)
              return latest.current;
          }
          if (requested.action === "completePractice") {
            const previous =
              latest.current.lectures[lectureId]?.practice[requested.skill];
            if (previous?.attemptId === requested.attemptId) {
              if (previous.score !== requested.score)
                throw new Error(
                  "This practice attempt is already saved with a different result. Reload the saved version before trying again.",
                );
              // The response may have been lost while the attempt succeeded. A
              // changed elapsed-minute estimate must never create another award.
              return latest.current;
            }
          }
          const action: CourseAction = {
            ...requested,
            lectureId,
            revision: latest.current.lectures[lectureId]?.revision ?? 0,
            mutationId: crypto.randomUUID(),
          };
          const next = {
            action,
            body: JSON.stringify(action),
            signature: requestedSignature,
          };
          pending.current = next;
          return transmit(next);
        });
      queue.current = run;
      return run;
    },
    [transmit],
  );
  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    return load();
  }, [load]);
  const resolveConflict = useCallback((lectureId: string) => {
    conflicts.current.delete(lectureId);
  }, []);
  return { data, loading, error, reload, save, resolveConflict };
}
