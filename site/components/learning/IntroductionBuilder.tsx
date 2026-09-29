"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import AudioButton from "./AudioButton";

type DetailKey = "name" | "home" | "origin" | "languages";

const fields: Array<{
  key: DetailKey;
  cue: string;
  prefix: string;
  english: string;
  placeholder: string;
}> = [
  { key: "name", cue: "Name", prefix: "Jag heter", english: "My name is", placeholder: "ditt namn" },
  { key: "home", cue: "Home now", prefix: "Jag bor i", english: "I live in", placeholder: "Helsingfors" },
  { key: "origin", cue: "Origin", prefix: "Jag kommer från", english: "I come from", placeholder: "Indien" },
  { key: "languages", cue: "Languages", prefix: "Jag talar", english: "I speak", placeholder: "hindi, engelska och lite svenska" },
];

function cleanDetail(value: string) {
  return value.trim().replace(/[.!?]+$/, "");
}

function detailsFromText(text: string): Record<DetailKey, string> {
  const patterns: Record<DetailKey, RegExp> = {
    name: /Jag heter\s+([^.!?\n]+)/i,
    home: /Jag bor i\s+([^.!?\n]+)/i,
    origin: /Jag kommer från\s+([^.!?\n]+)/i,
    languages: /Jag talar\s+([^.!?\n]+)/i,
  };
  return Object.fromEntries(
    fields.map((field) => [field.key, cleanDetail(text.match(patterns[field.key])?.[1] ?? "")]),
  ) as Record<DetailKey, string>;
}

function textFromDetails(details: Record<DetailKey, string>) {
  return fields
    .filter((field) => cleanDetail(details[field.key]))
    .map((field) => `${field.prefix} ${cleanDetail(details[field.key])}.`)
    .join("\n");
}

export default function IntroductionBuilder({
  modelText,
  memoryTip,
  initialText = "",
  onChange,
}: {
  modelText: string;
  memoryTip?: string;
  initialText?: string;
  onChange?: (value: string) => void;
}) {
  const [details, setDetails] = useState<Record<DetailKey, string>>(() => detailsFromText(initialText));
  const [hidden, setHidden] = useState(false);
  const complete = fields.every((field) => details[field.key].trim());
  const lines = useMemo(
    () => fields.map((field) => `${field.prefix} ${cleanDetail(details[field.key])}.`),
    [details],
  );

  return (
    <div className="intro-builder">
      <div className="intro-builder-heading">
        <div>
          <span>BUILD YOUR FOUR LINES</span>
          <h4>Make the model true for you.</h4>
          <p>Complete one line, say it aloud, and then move to the next.</p>
        </div>
        <AudioButton
          text={complete ? lines.join(" ") : modelText}
          speaker="Alex"
          language="sv"
          label={complete ? "Hear my four lines" : "Hear Alex’s model"}
          className="secondary"
        />
      </div>

      {!hidden ? (
        <div className="intro-builder-fields">
          {fields.map((field, index) => (
            <label key={field.key}>
              <span className="intro-builder-number">{index + 1}</span>
              <span className="intro-builder-cue">
                <b>{field.cue}</b>
                <small>{field.english}</small>
              </span>
              <span className="intro-builder-line" lang="sv">
                <strong>{field.prefix}</strong>
                <input
                  value={details[field.key]}
                  onChange={(event) => {
                    const next = { ...details, [field.key]: event.target.value };
                    setDetails(next);
                    onChange?.(textFromDetails(next));
                    setHidden(false);
                  }}
                  placeholder={field.placeholder}
                  aria-label={`${field.cue}: complete ${field.prefix}`}
                  autoComplete="off"
                />
                <i aria-hidden="true">.</i>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="intro-recall" aria-live="polite">
          {fields.map((field, index) => (
            <div key={field.key}>
              <span>{index + 1}</span>
              <b>{field.cue}</b>
              <small>Say this line from memory</small>
            </div>
          ))}
        </div>
      )}

      {memoryTip && <p className="intro-builder-tip"><b>Notice:</b> {memoryTip}</p>}
      <div className="intro-builder-action">
        <button
          type="button"
          className="secondary"
          disabled={!complete}
          onClick={() => setHidden((value) => !value)}
        >
          {hidden ? <Eye size={17} /> : <EyeOff size={17} />}
          {hidden ? "Show my lines" : "Hide the words and try"}
        </button>
        <p>{complete ? "Your four lines are ready. Say them once slowly, then once from memory." : "Complete all four lines to unlock the memory try."}</p>
      </div>
    </div>
  );
}
