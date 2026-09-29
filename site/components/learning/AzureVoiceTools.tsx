"use client";

import { useEffect, useId, useState } from "react";
import { AudioLines, MessagesSquare } from "lucide-react";
import LiveVoice, { type LiveVoiceMode } from "./LiveVoice";

type AiStatus = {
  signedIn: boolean;
  capabilities?: { liveVoice?: boolean };
};

type VoiceToolCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

export type AzureVoiceToolsProps = {
  /** Stable server-owned curriculum ID: lecture-XX, episode-XX, or module-XX. */
  contextId: string;
  tools?: readonly LiveVoiceMode[];
  disabled?: boolean;
  className?: string;
  copy?: Partial<Record<LiveVoiceMode, Partial<VoiceToolCopy>>>;
  onTranscript?: (text: string) => boolean;
  onActiveChange?: (active: boolean) => void;
};

const defaultTools: readonly LiveVoiceMode[] = [
  "conversation",
  "pronunciation",
];

const defaultCopy: Record<LiveVoiceMode, VoiceToolCopy> = {
  conversation: {
    eyebrow: "AZURE VOICE LIVE · CONVERSATION",
    title: "Talk with Stigen about this material.",
    description:
      "A three-minute voice turn where Stigen challenges you and helps when you are stuck. The coach receives this episode or module’s trusted objectives, key phrases, and dialogue.",
  },
  pronunciation: {
    eyebrow: "AZURE VOICE LIVE · SOUND DRILL",
    title: "Drill just the sound.",
    description:
      "A shorter two-minute turn focused on this material’s pronunciation cue. Stigen models a small group, leaves room, and gives one concrete cue after you repeat.",
  },
};

/**
 * Drop-in Azure voice tools for any episode or module.
 * Capability discovery stays inside the component; the browser sends only a
 * stable context ID and the server supplies the trusted curriculum prompt.
 */
export default function AzureVoiceTools({
  contextId,
  tools = defaultTools,
  disabled = false,
  className = "",
  copy,
  onTranscript,
  onActiveChange,
}: AzureVoiceToolsProps) {
  const [ai, setAi] = useState<AiStatus | null>(null);
  const instanceId = useId().replace(/:/g, "");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai-status", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: unknown) => {
        if (value && typeof value === "object") {
          const status = value as AiStatus;
          if (typeof status.signedIn === "boolean") setAi(status);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const signedIn = ai?.signedIn ?? false;
  const available = Boolean(ai?.capabilities?.liveVoice && signedIn);

  return (
    <div className={`a0-voice-tools azure-voice-tools ${className}`.trim()}>
      {tools.map((mode) => {
        const labels = { ...defaultCopy[mode], ...copy?.[mode] };
        const headingId = `${instanceId}-${mode}-voice-heading`;
        const Icon = mode === "conversation" ? MessagesSquare : AudioLines;
        return (
          <section
            className="a0-live-voice-intro azure-voice-tool"
            aria-labelledby={headingId}
            key={mode}
          >
            <div>
              <span className="a0-live-voice-icon">
                <Icon size={21} aria-hidden="true" />
              </span>
              <p className="eyebrow">{labels.eyebrow}</p>
              <h3 id={headingId}>{labels.title}</h3>
              <p>{labels.description}</p>
            </div>
            <LiveVoice
              contextId={contextId}
              mode={mode}
              available={available}
              signedIn={signedIn}
              disabled={disabled}
              onTranscript={onTranscript}
              onActiveChange={onActiveChange}
            />
          </section>
        );
      })}
    </div>
  );
}
