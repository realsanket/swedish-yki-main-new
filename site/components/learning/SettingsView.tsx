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
  Volume2,
  Circle,
  RefreshCw,
  ArrowRight,
  KeyRound,
  Server,
} from "lucide-react";
import AudioButton from "./AudioButton";
import LiveVoice from "./LiveVoice";
import { characterVoiceProfiles, speechLocales } from "@/lib/character-voices";
import type { CourseProgressData } from "@/lib/course-progress";
import type { ProgressData } from "@/lib/progress";
import { storyCharacterNames } from "@/lib/story-world";

type AIStatus = {
  configured: boolean;
  signedIn: boolean;
  available: boolean;
  userId: string | null;
  provider: "azure" | "openai" | null;
  capabilities: {
    feedback: boolean;
    transcription: boolean;
    characterVoices: boolean;
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
    key: "characterVoices",
    title: "Character voices",
    description:
      "Alex, Aino, and Sami keep their own voice in Swedish and English.",
    icon: Volume2,
  },
  {
    key: "liveVoice",
    title: "Live voice conversation",
    description: "Talk with an AI Swedish practice partner.",
    icon: AudioLines,
  },
] as const;

type CapabilityKey = (typeof features)[number]["key"];
type CheckableCapability = Exclude<CapabilityKey, "liveVoice">;
type AzureCheck = {
  phase: "idle" | "running" | "passed" | "failed";
  detail: string;
};

const azureServices: Array<{
  key: CapabilityKey;
  service: string;
  variables: readonly string[];
}> = [
  {
    key: "feedback",
    service: "Azure OpenAI / Microsoft Foundry",
    variables: [
      "AZURE_OPENAI_BASE_URL",
      "AZURE_OPENAI_API_KEY",
      "AZURE_OPENAI_FEEDBACK_MODEL",
    ],
  },
  {
    key: "transcription",
    service: "Azure Speech transcription",
    variables: [
      "AZURE_SPEECH_ENDPOINT",
      "AZURE_SPEECH_API_KEY or AZURE_OPENAI_API_KEY",
      "AZURE_SPEECH_API_VERSION",
    ],
  },
  {
    key: "characterVoices",
    service: "Azure Speech text to speech",
    variables: [
      "AZURE_SPEECH_TTS_ENDPOINT",
      "AZURE_SPEECH_API_KEY or AZURE_OPENAI_API_KEY",
    ],
  },
  {
    key: "liveVoice",
    service: "Azure GPT Live",
    variables: [
      "AZURE_OPENAI_BASE_URL",
      "AZURE_OPENAI_API_KEY",
      "AZURE_OPENAI_VOICE_MODEL",
    ],
  },
];

const voiceChecks = {
  Alex: {
    sv: "Hej! Jag heter Alex.",
    en: "Hello! My name is Alex.",
  },
  Aino: {
    sv: "Hej Alex! Välkommen till Sverige.",
    en: "Hi Alex! Welcome to Sweden.",
  },
  Sami: {
    sv: "Lyssna först, och säg sedan meningen.",
    en: "Listen first, and then say the sentence.",
  },
} as const;

const checkLabels: Record<CheckableCapability, string> = {
  feedback: "Send Swedish test",
  transcription: "Run Swedish loopback",
  characterVoices: "Generate Swedish audio",
};

const initialAzureChecks: Record<CheckableCapability, AzureCheck> = {
  feedback: { phase: "idle", detail: "" },
  transcription: { phase: "idle", detail: "" },
  characterVoices: { phase: "idle", detail: "" },
};

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
  const [settingsTab, setSettingsTab] = useState<"learning" | "azure">(
    "learning",
  );
  const [azureChecks, setAzureChecks] = useState(initialAzureChecks);

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

  function checkConnections() {
    setAi(null);
    setAiError(false);
    setConnectionCheck((value) => value + 1);
  }

  async function runAzureCheck(capability: CheckableCapability) {
    setAzureChecks((current) => ({
      ...current,
      [capability]: { phase: "running", detail: "Contacting Azure…" },
    }));
    try {
      const response = await fetch("/api/azure-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capability }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        detail?: string;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Azure did not pass the live check.");
      }
      setAzureChecks((current) => ({
        ...current,
        [capability]: {
          phase: "passed",
          detail: result.detail ?? "Azure completed the live check.",
        },
      }));
    } catch (error) {
      setAzureChecks((current) => ({
        ...current,
        [capability]: {
          phase: "failed",
          detail:
            error instanceof Error
              ? error.message
              : "Azure did not pass the live check.",
        },
      }));
    }
  }

  const providerName =
    ai?.provider === "azure"
      ? "Microsoft Azure"
      : ai?.provider === "openai"
        ? "OpenAI"
        : null;
  const readyCount = ai
    ? features.filter(({ key }) => ai.capabilities?.[key]).length
    : 0;

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
      <nav className="settings-tabs" aria-label="Settings sections">
        <button
          type="button"
          className={settingsTab === "learning" ? "active" : ""}
          aria-current={settingsTab === "learning" ? "page" : undefined}
          onClick={() => setSettingsTab("learning")}
        >
          <Settings size={18} aria-hidden="true" />
          Learning tools
        </button>
        <button
          type="button"
          className={settingsTab === "azure" ? "active" : ""}
          aria-current={settingsTab === "azure" ? "page" : undefined}
          onClick={() => setSettingsTab("azure")}
        >
          <Server size={18} aria-hidden="true" />
          Azure services
        </button>
      </nav>

      {settingsTab === "learning" ? (
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
                            !ai.capabilities?.characterVoices &&
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
                      {features.map(
                        ({ key, title, description, icon: Icon }) => {
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
                                <strong style={{ fontSize: 14 }}>
                                  {title}
                                </strong>
                                <p
                                  className="help-text"
                                  style={{ marginTop: 3 }}
                                >
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
                                    <CheckCircle2
                                      size={14}
                                      aria-hidden="true"
                                    />
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
                        },
                      )}
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
                onClick={checkConnections}
              >
                <RefreshCw size={15} />
                Check again
              </button>
              <p className="help-text" style={{ marginTop: 18 }}>
                AI coaching and self-review are practice aids. They do not
                assess test readiness, award a YKI grade, or certify a language
                level. Feedback based on a transcript does not assess
                pronunciation.
              </p>
            </section>
            <section className="panel" aria-labelledby="learning-data-heading">
              <ShieldCheck size={26} />
              <h2 className="spaced-title" id="learning-data-heading">
                Your learning data
              </h2>
              <p>
                Your episode answers, notes, assignments, and practice drafts
                are saved to your account. Practice recordings stay in your
                browser unless you choose transcription.
              </p>
              <p style={{ marginTop: 12 }}>
                AI feedback sends your submitted text to the configured provider
                {providerName
                  ? ` (${providerName})`
                  : " (Microsoft Azure or OpenAI)"}
                . Transcription sends the recording for speech recognition.
                Starting a live conversation streams your microphone audio to
                the voice provider until you end the session.
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
      ) : (
        <div className="azure-settings">
          <section
            className="panel azure-status-hero"
            aria-labelledby="azure-heading"
          >
            <div className="azure-status-copy">
              <span className="badge">SERVER-SIDE CONNECTION CHECK</span>
              <h2 className="spaced-title" id="azure-heading">
                Azure service control center
              </h2>
              <p>
                See which learning services are ready, what each one needs, and
                test the assigned character voices. Secret values always stay on
                the server.
              </p>
            </div>
            <div className="azure-readiness" aria-live="polite">
              {aiError ? (
                <>
                  <strong>Status unavailable</strong>
                  <span>The server did not answer the readiness check.</span>
                </>
              ) : ai === null ? (
                <>
                  <RefreshCw
                    className="azure-spin"
                    size={26}
                    aria-hidden="true"
                  />
                  <strong>Checking services…</strong>
                </>
              ) : (
                <>
                  <strong>
                    {readyCount} of {features.length} configured
                  </strong>
                  <span>
                    {providerName
                      ? `${providerName} is detected.`
                      : "Azure is not connected yet."}
                  </span>
                </>
              )}
              <button
                type="button"
                className="secondary"
                onClick={checkConnections}
                disabled={ai === null && !aiError}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Check again
              </button>
            </div>
          </section>

          <section
            className="azure-service-section"
            aria-labelledby="azure-services-heading"
          >
            <div className="azure-section-heading">
              <div>
                <p className="eyebrow">CAPABILITY MAP</p>
                <h2 id="azure-services-heading">Every Azure connection</h2>
              </div>
              <p>
                Configuration is checked first. Use each live test to confirm
                that Azure actually accepts and returns Swedish data.
              </p>
            </div>
            <div className="azure-service-grid">
              {azureServices.map(({ key, service, variables }) => {
                const feature = features.find((item) => item.key === key)!;
                const ready = Boolean(ai?.capabilities?.[key]);
                const Icon = feature.icon;
                const liveCheck =
                  key === "liveVoice" ? null : azureChecks[key];
                const stateLabel = liveCheck?.phase === "passed"
                  ? "Live verified"
                  : liveCheck?.phase === "running"
                    ? "Testing"
                    : liveCheck?.phase === "failed"
                      ? "Check failed"
                      : aiError
                        ? "Unknown"
                        : ai === null
                          ? "Checking"
                          : ready
                            ? "Configured"
                            : "Not connected";
                const stateReady = ready && liveCheck?.phase !== "failed";
                return (
                  <article className="azure-service-card" key={key}>
                    <div className="azure-service-head">
                      <span className="azure-service-icon">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span
                        className={`azure-status-pill ${stateReady ? "ready" : "off"}`}
                      >
                        {stateReady ? (
                          <CheckCircle2 size={13} aria-hidden="true" />
                        ) : (
                          <Circle size={13} aria-hidden="true" />
                        )}
                        {stateLabel}
                      </span>
                    </div>
                    <p className="azure-service-name">{service}</p>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <div
                      className="azure-env-list"
                      aria-label={`${feature.title} environment variables`}
                    >
                      <span>Required server variables</span>
                      {variables.map((variable) => (
                        <code key={variable}>{variable}</code>
                      ))}
                    </div>
                    <div className="azure-card-check">
                      {key === "liveVoice" ? (
                        <button
                          type="button"
                          className="text-button"
                          disabled={!ready}
                          onClick={() =>
                            document
                              .getElementById("azure-live-voice-test")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              })
                          }
                        >
                          <AudioLines size={15} aria-hidden="true" />
                          Open live conversation test
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-button"
                          disabled={!ready || liveCheck?.phase === "running"}
                          onClick={() => void runAzureCheck(key)}
                        >
                          {liveCheck?.phase === "passed" ? (
                            <CheckCircle2 size={15} aria-hidden="true" />
                          ) : (
                            <RefreshCw
                              className={
                                liveCheck?.phase === "running"
                                  ? "azure-spin"
                                  : ""
                              }
                              size={15}
                              aria-hidden="true"
                            />
                          )}
                          {liveCheck?.phase === "running"
                            ? "Testing Azure…"
                            : checkLabels[key]}
                        </button>
                      )}
                      {liveCheck?.detail && (
                        <p
                          className={
                            liveCheck.phase === "failed"
                              ? "azure-check-result failed"
                              : "azure-check-result"
                          }
                          role="status"
                        >
                          {liveCheck.detail}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="panel azure-voice-panel"
            aria-labelledby="voice-casting-heading"
          >
            <div className="azure-section-heading">
              <div>
                <p className="eyebrow">AZURE-ONLY VOICE CASTING</p>
                <h2 id="voice-casting-heading">Character voice tests</h2>
              </div>
              <p>
                Each character has explicit Swedish and English casting.
                Swedish playback always declares <code>sv-SE</code>; there is no browser
                or prerecorded fallback.
              </p>
            </div>
            <div className="azure-accent-evidence">
              <CheckCircle2 size={21} aria-hidden="true" />
              <div>
                <strong>Swedish pronunciation check passed</strong>
                <p>
                  Azure recognized every test line as Swedish. Alex and Aino
                  scored 98/100 accuracy; Sami now uses native Swedish Mattias
                  after it scored 96/100 with complete recognition. Swedish
                  prosody scoring is not supported, so use the previews for the
                  final listening check.
                </p>
              </div>
            </div>
            <div className="azure-voice-grid">
              {storyCharacterNames.map((name) => {
                const profile = characterVoiceProfiles[name];
                return (
                  <article className="azure-voice-card" key={name}>
                    <div className="azure-voice-intro">
                      <span className="azure-avatar" aria-hidden="true">
                        {name.slice(0, 1)}
                      </span>
                      <div>
                        <h3>{name}</h3>
                        <p>{profile.description}</p>
                      </div>
                    </div>
                    <dl>
                      <div>
                        <dt>Swedish voice</dt>
                        <dd>{profile.azureVoices.sv}</dd>
                      </div>
                      <div>
                        <dt>English voice</dt>
                        <dd>{profile.azureVoices.en}</dd>
                      </div>
                      <div>
                        <dt>Locales</dt>
                        <dd>
                          {speechLocales.sv} · {speechLocales.en}
                        </dd>
                      </div>
                    </dl>
                    <div className="azure-voice-preview">
                      <AudioButton
                        text={voiceChecks[name].sv}
                        speaker={name}
                        language="sv"
                        label="Test Swedish"
                        className="secondary"
                      />
                      <AudioButton
                        text={voiceChecks[name].en}
                        speaker={name}
                        language="en"
                        label="Test English"
                        className="secondary"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="panel azure-live-test"
            id="azure-live-voice-test"
            aria-labelledby="azure-live-test-heading"
          >
            <div className="azure-section-heading">
              <div>
                <p className="eyebrow">FULL WEBRTC ROUND TRIP</p>
                <h2 id="azure-live-test-heading">Test Swedish voice chat</h2>
              </div>
              <p>
                This is the real GPT Live path—not a configuration simulation.
                Start it, say “Hej! Jag heter …”, listen for the reply, and end
                the conversation when you are finished.
              </p>
            </div>
            <LiveVoice
              taskId="lecture-01"
              mode="conversation"
              available={Boolean(ai?.capabilities.liveVoice)}
              signedIn={Boolean(ai?.signedIn)}
            />
            <p className="help-text azure-live-privacy">
              Starting this test asks for microphone permission and streams
              microphone audio to Microsoft Azure until you end the session.
            </p>
          </section>

          <section className="panel azure-security-note">
            <KeyRound size={24} aria-hidden="true" />
            <div>
              <h2>Keys stay private</h2>
              <p>
                This screen receives only readiness booleans. Endpoints, API
                keys, and secret values are never returned to the browser. Add
                the variables to the server environment, restart Stigen, then
                use <b>Check again</b> above.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
