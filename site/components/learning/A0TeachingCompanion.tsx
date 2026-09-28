"use client";

import { useEffect, useState } from "react";
import { AudioLines, MessagesSquare } from "lucide-react";
import LectureCoach from "./LectureCoach";
import LiveVoice from "./LiveVoice";

type AiStatus = {
  signedIn: boolean;
  capabilities?: { liveVoice?: boolean };
};

/** Voice tools for A0 lectures, using a short-lived server-created session. */
export default function A0TeachingCompanion({ lectureId }: { lectureId: string }) {
  const [ai, setAi] = useState<AiStatus | null>(null);

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
  const liveVoice = Boolean(ai?.capabilities?.liveVoice && signedIn);

  return (
    <div className="a0-voice-tools">
      <LectureCoach lectureId={lectureId} />
      <section className="a0-live-voice-intro" aria-labelledby="conversation-coach-heading">
        <div>
          <span className="a0-live-voice-icon"><MessagesSquare size={21} /></span>
          <p className="eyebrow">AZURE GPT-LIVE · CONVERSATION</p>
          <h3 id="conversation-coach-heading">Talk with Stigen about this lesson.</h3>
          <p>
            A three-minute voice turn where Stigen both <b>challenges</b> you and <b>helps</b> when you are stuck. Stigen already knows this episode&rsquo;s objectives, grammar rules, key phrases, and dialogue.
          </p>
        </div>
        <LiveVoice taskId={lectureId} mode="conversation" available={liveVoice} signedIn={signedIn} />
      </section>
      <section className="a0-live-voice-intro" aria-labelledby="sound-coach-heading">
        <div>
          <span className="a0-live-voice-icon"><AudioLines size={21} /></span>
          <p className="eyebrow">AZURE GPT-LIVE · SOUND DRILL</p>
          <h3 id="sound-coach-heading">Or drill just the sound.</h3>
          <p>
            A shorter two-minute turn focused on this lesson&rsquo;s pronunciation cue. Stigen models the sound, leaves silent room, and gives one concrete cue after you repeat.
          </p>
        </div>
        <LiveVoice taskId={lectureId} mode="pronunciation" available={liveVoice} signedIn={signedIn} />
      </section>
    </div>
  );
}
