"use client";

import LectureCoach from "./LectureCoach";
import AzureVoiceTools from "./AzureVoiceTools";
import type { LiveVoiceMode } from "./LiveVoice";

/** Voice tools for A0 lectures, using a short-lived server-created session. */
export default function A0TeachingCompanion({
  lectureId,
  voiceTools,
}: {
  lectureId: string;
  /** Which live voice tools to offer; defaults to all of them. */
  voiceTools?: readonly LiveVoiceMode[];
}) {
  return (
    <>
      <LectureCoach lectureId={lectureId} />
      <AzureVoiceTools contextId={lectureId} tools={voiceTools} />
    </>
  );
}
