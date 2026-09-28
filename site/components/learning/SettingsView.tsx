"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Settings,
  Download,
  ShieldCheck,
  MessageSquare,
  Mic,
  AudioLines,
  Circle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import type { CourseProgressData } from "@/lib/course-progress";
import type { ProgressData } from "@/lib/progress";

type AIStatus = {
  configured: boolean;
  signedIn: boolean;
  available: boolean;
  userId: string | null;
  provider: "azure" | "openai" | null;
  capabilities: {
    feedback: boolean;
    transcription: boolean;
    liveVoice: boolean;
  };
};

const features = [
  {
    key: "feedback",
    title: "Writing & speaking feedback",
    description: "Coaching on submitted text and speaking transcripts.",
    icon: MessageSquare,
  },
  {
    key: "transcription",
    title: "Recording transcription",
    description: "Turn a Swedish recording into editable text.",
    icon: Mic,
  },
  {
    key: "liveVoice",
    title: "Live voice conversation",
    description: "Talk with an AI Swedish practice partner.",
    icon: AudioLines,
  },
] as const;

export default function SettingsView({
  data,
  course,
  nextEpisode,
  onContinue,
}: {
  data: ProgressData;
  course?: CourseProgressData;
  nextEpisode?: { number: number; title: string };
  onContinue?: () => void;
}) {
  const [ai, setAi] = useState<AIStatus | null>(null);
  const [aiError, setAiError] = useState(false);
  const [connectionCheck, setConnectionCheck] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetch("/api/ai-status", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Connection status unavailable.");
        return (await response.json()) as AIStatus;
      })
      .then((status) => {
        if (active) {
          setAi(status);
          setAiError(false);
        }
      })
      .catch(() => {
        if (active) setAiError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [connectionCheck]);

  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          { exportedAt: new Date().toISOString(), ...data, course },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stigen-progress.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const providerName =
    ai?.provider === "azure"
      ? "Microsoft Azure"
      : ai?.provider === "openai"
        ? "OpenAI"
        : null;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">VERKTYG · STIGEN LEARNING TOOLS</p>
          <h1>Follow the story. Use support when it helps.</h1>
          <p>
            Your next episode sets the course stage, language and practice
            focus. There is nothing to configure before you begin.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel" aria-labelledby="story-path-heading">
          <span className="badge">YOUR PATH IS ALREADY SET</span>
          <h2 className="spaced-title" id="story-path-heading">
            One story, one next step.
          </h2>
          <p>
            Stigen begins with a complete-beginner stage labelled A0 and
            introduces new Swedish only when the story needs it. The path—not
            a self-assigned proficiency level—sets the next useful challenge.
          </p>
          <div className="callout">
            <Settings size={21} aria-hidden="true" />
            <div>
              <b>How to use Stigen</b>
              <p>
                Begin the next episode. Pause whenever you need to; your
                bookmark stays with the scene. Use the notebook, word bank or
                practice studio when you want an extra return to the language.
              </p>
            </div>
          </div>
          <p className="help-text">
            Most episodes take about 45 minutes. Clinics and the final timed
            practice sets take 60 minutes, and can still be completed across
            more than one sitting.
          </p>
          {nextEpisode && onContinue && (
            <button
              type="button"
              className="primary"
              style={{ marginTop: 22 }}
              onClick={onContinue}
            >
              Continue Episode {nextEpisode.number}
              <ArrowRight size={18} />
            </button>
          )}
        </section>
        <div>
          <section className="panel" aria-labelledby="ai-settings-heading">
            <Settings size={25} />
            <h2 className="spaced-title" id="ai-settings-heading">
              Your AI practice partner
            </h2>
            <div aria-live="polite">
              {aiError ? (
                <p className="help-text">
                  We couldn’t check AI availability. Your Stigen episodes and
                  self-review are still available.
                </p>
              ) : ai === null ? (
                <p>Checking AI availability…</p>
              ) : (
                <>
                  <p>
                    {providerName
                      ? `${providerName} is connected for the available AI practice features.`
                      : ai.signedIn &&
                          !ai.capabilities?.transcription &&
                          !ai.capabilities?.liveVoice
                        ? "AI is not configured yet. Model answers and self-review are available."
                        : "Each AI practice feature is checked separately."}
                  </p>
                  {!ai.signedIn && (
                    <p className="help-text">
                      Sign in to use AI practice and check which features are
                      available to your account.
                    </p>
                  )}
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "20px 0",
                      padding: 0,
                      display: "grid",
                      gap: 18,
                    }}
                  >
                    {features.map(({ key, title, description, icon: Icon }) => {
                      const ready = Boolean(ai.capabilities?.[key]);
                      return (
                        <li
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          <Icon
                            size={19}
                            style={{ marginTop: 3 }}
                            aria-hidden="true"
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: 14 }}>{title}</strong>
                            <p className="help-text" style={{ marginTop: 3 }}>
                              {description}
                            </p>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 12,
                                marginTop: 5,
                              }}
                            >
                              {ready ? (
                                <CheckCircle2 size={14} aria-hidden="true" />
                              ) : (
                                <Circle size={14} aria-hidden="true" />
                              )}
                              {ready
                                ? "Ready to use"
                                : ai.signedIn
                                  ? "Not enabled"
                                  : "Sign in to check"}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="help-text">
                    Availability reflects your account and the server setup. A
                    session can still be interrupted by provider limits or
                    connection problems.
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              className="text-button"
              style={{ marginTop: 16 }}
              onClick={() => {
                setAi(null);
                setAiError(false);
                setConnectionCheck((value) => value + 1);
              }}
            >
              <RefreshCw size={15} />
              Check again
            </button>
            <p className="help-text" style={{ marginTop: 18 }}>
              AI coaching and self-review are practice aids. They do not assess
              test readiness, award a YKI grade, or certify a language level.
              Feedback based on a transcript does not assess pronunciation.
            </p>
          </section>
          <section className="panel" aria-labelledby="learning-data-heading">
            <ShieldCheck size={26} />
            <h2 className="spaced-title" id="learning-data-heading">
              Your learning data
            </h2>
            <p>
              Your episode answers, notes, assignments, and practice drafts are
              saved to your account. Practice recordings stay in your browser
              unless you choose transcription.
            </p>
            <p style={{ marginTop: 12 }}>
              AI feedback sends your submitted text to the configured provider
              {providerName
                ? ` (${providerName})`
                : " (Microsoft Azure or OpenAI)"}
              . Transcription sends the recording for speech recognition.
              Starting a live conversation streams your microphone audio to the
              voice provider until you end the session.
            </p>
            <p className="help-text" style={{ marginTop: 12 }}>
              Provider processing policies apply to submitted text and audio.
              Use fictional details in practice if you prefer.
            </p>
            <button className="secondary" onClick={download}>
              <Download size={18} />
              Export my progress
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
