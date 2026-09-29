"use client";
import { Lightbulb } from "lucide-react";
import { seededShuffle } from "./activities/shared";

export type QuestionCardProps = {
  id: string;
  prompt: string;
  options?: string[];
  value: string;
  onChange: (value: string) => void;
  checked: boolean;
  correct?: boolean;
  explanation?: string;
  correctOption?: string;
  hint?: string;
  allowReveal?: boolean;
  disabled?: boolean;
  index?: number;
};

export default function QuestionCard({
  id,
  prompt,
  options,
  value,
  onChange,
  checked,
  correct,
  explanation,
  correctOption,
  hint,
  allowReveal,
  disabled,
  index,
}: QuestionCardProps) {
  return (
    <fieldset
      className={
        "course-question " + (checked ? (correct ? "correct" : "needs-work") : "")
      }
      disabled={disabled}
    >
      <legend>
        {index !== undefined && <span>{index + 1}</span>}
        {prompt}
      </legend>

      {options ? (
        <div className="question-options">
          {/* Content authors often list the answer first; a stable per-question
              order stops learners from learning the position instead of the Swedish. */}
          {seededShuffle(options, id).map((option) => (
            <label key={option}>
              <input
                type="radio"
                name={id}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          aria-label={prompt}
          className="field"
          value={value}
          maxLength={2000}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      )}

      {hint && (
        <details>
          <summary>
            <Lightbulb size={15} /> A hint
          </summary>
          <p>{hint}</p>
        </details>
      )}

      {allowReveal && value.trim() && !checked && explanation && (
        <details>
          <summary>Show an explanation</summary>
          <p>{explanation}</p>
          {correctOption && <p>One answer: <b lang="sv">{correctOption}</b></p>}
        </details>
      )}

      {checked && (
        <div className="answer-feedback">
          <b>{correct ? "That's right." : "Let's look at this again."}</b>
          {explanation && <p>{explanation}</p>}
          {!correct && correctOption && (
            <p>One answer: <b lang="sv">{correctOption}</b></p>
          )}
        </div>
      )}
    </fieldset>
  );
}
