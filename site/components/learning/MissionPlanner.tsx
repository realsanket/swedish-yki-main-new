"use client";

import { useEffect, useState } from "react";
import type { MissionPlan } from "@/lib/course-types";
import AudioButton from "./AudioButton";
import styles from "./PracticeStudio.module.css";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clean = (value: string) => value.trim().replace(/[.!?,]+$/, "");

/** The learner's full lines: each frame with their own words filled in. */
export function planScript(plan: MissionPlan, values: string[]) {
  return plan.lines
    .map((line, index) => {
      const value = line.before ? clean(values[index] ?? "") : (values[index] ?? "").trim();
      if (!value) return "";
      return line.before ? `${line.before} ${value}${line.after ?? ""}` : value;
    })
    .filter(Boolean)
    .join("\n");
}

/** Reads earlier words back out of a draft that already uses the frames. */
function valuesFromDraft(plan: MissionPlan, draft: string) {
  return plan.lines.map((line) => {
    if (!line.before) return "";
    const match = draft.match(new RegExp(`${escape(line.before)}\\s+([^.!?,\\n]+)`, "i"));
    return match ? clean(match[1]) : "";
  });
}

/**
 * Stage 1 of the task: the learner writes their own details into the
 * lecture's frames. Values stay in this browser only; the spoken attempt is
 * what gets saved.
 */
export default function MissionPlanner({
  plan,
  storageKey,
  draft,
  onChange,
}: {
  plan: MissionPlan;
  storageKey: string;
  draft: string;
  onChange: (script: string, complete: boolean) => void;
}) {
  const [values, setValues] = useState<string[]>(() => plan.lines.map(() => ""));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let stored: string[] | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) stored = parsed as string[];
    } catch {
      /* Storage is optional. */
    }
    const fromDraft = valuesFromDraft(plan, draft);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is read once after hydration
    setValues(plan.lines.map((_, index) => stored?.[index] || fromDraft[index] || ""));
    setLoaded(true);
    // Read once per plan; later draft edits must not overwrite the plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      /* Storage is optional. */
    }
    onChange(planScript(plan, values), values.every((value) => value.trim()));
  }, [loaded, onChange, plan, storageKey, values]);

  const script = planScript(plan, values);

  return (
    <div className={styles.planner}>
      <p className={styles.stageIntro}>{plan.intro}</p>
      <ol className={styles.plannerLines}>
        {plan.lines.map((line, index) => {
          const id = `${storageKey}-line-${index}`;
          return (
            <li key={id}>
              <label htmlFor={id}>{line.label}</label>
              <div lang="sv">
                {line.before && <span>{line.before}</span>}
                <input
                  id={id}
                  className="field"
                  value={values[index] ?? ""}
                  placeholder={line.placeholder}
                  maxLength={120}
                  autoComplete="off"
                  spellCheck
                  lang="sv"
                  onChange={(event) =>
                    setValues((current) => current.map((value, i) => (i === index ? event.target.value : value)))
                  }
                />
                {line.after && <span>{line.after}</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {script && (
        <div className={styles.planScript}>
          <p lang="sv">{script}</p>
          <AudioButton text={script.replace(/\n/g, " ")} label="Hear my lines" slow className="secondary" />
        </div>
      )}
    </div>
  );
}
