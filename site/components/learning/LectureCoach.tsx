"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import type { LectureCoachResponse } from "@/lib/ai";

type Intent = "make-simple" | "sound-contrast" | "quick-challenge" | "challenge-me" | "explain-rule" | "question";

const prompts: { intent: Exclude<Intent, "question">; label: string }[] = [
  { intent: "explain-rule", label: "Explain the grammar rule" },
  { intent: "make-simple", label: "Explain simply" },
  { intent: "sound-contrast", label: "Help me hear it" },
  { intent: "challenge-me", label: "Challenge me to produce it" },
  { intent: "quick-challenge", label: "Give me a tiny challenge" },
];

export default function LectureCoach({ lectureId }: { lectureId: string }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coaching, setCoaching] = useState<LectureCoachResponse | null>(null);

  async function ask(intent: Intent) {
    const cleanQuestion = question.trim();
    if (intent === "question" && !cleanQuestion) {
      setError("Write a short question first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/lecture-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, intent, ...(cleanQuestion ? { question: cleanQuestion } : {}) }),
      });
      const result = (await response.json()) as { error?: string; coaching?: LectureCoachResponse };
      if (!response.ok || !result.coaching)
        throw new Error(result.error || "Stigen could not answer just now.");
      setCoaching(result.coaching);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Stigen could not answer just now.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask("question");
  }

  return (
    <section className="lecture-ai-coach" aria-labelledby="inline-coach-heading">
      <div className="lecture-ai-coach-heading">
        <span className="lecture-ai-icon"><Sparkles size={19} /></span>
        <div>
          <p className="eyebrow">STIGEN · A0 AI COMPANION</p>
          <h3 id="inline-coach-heading">Stuck? Ask about this exact lesson.</h3>
        </div>
      </div>
      <p>
        Ask for an explanation, let Stigen challenge you to produce a phrase, or
        get a listening cue. Every answer is grounded in this lesson&rsquo;s
        rules, phrases, and vocabulary &mdash; not generic Swedish.
      </p>
      <div className="lecture-coach-prompts" aria-label="Quick coaching prompts">
        {prompts.map((prompt) => (
          <button key={prompt.intent} type="button" disabled={busy} onClick={() => void ask(prompt.intent)}>
            {prompt.label} <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <form className="lecture-coach-question" onSubmit={submit}>
        <label htmlFor={`coach-question-${lectureId}`}>Or ask Stigen</label>
        <div>
          <input
            id={`coach-question-${lectureId}`}
            className="field"
            value={question}
            maxLength={300}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="For example: Why is tuuli longer than tuli?"
          />
          <button type="submit" className="secondary" disabled={busy} aria-label="Ask Stigen">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <MessageCircleQuestion size={16} />}
            Ask
          </button>
        </div>
      </form>
      {error && <p className="lecture-coach-error" role="alert">{error}</p>}
      {coaching && (
        <div className="lecture-coach-answer" aria-live="polite">
          <p className="eyebrow">STIGEN SAYS</p>
          <h4>{coaching.title}</h4>
          <p>{coaching.answer}</p>
          <div>
            <span>TRY THIS</span>
            <b lang="sv">{coaching.tryThis}</b>
          </div>
          <small><b>Listen for:</b> {coaching.listenFor}</small>
        </div>
      )}
      <small className="lecture-coach-disclaimer">
        AI support gives practice guidance; it does not assess your pronunciation or award a level.
      </small>
    </section>
  );
}
