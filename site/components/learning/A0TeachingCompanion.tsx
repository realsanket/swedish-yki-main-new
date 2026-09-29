"use client";

import LectureCoach from "./LectureCoach";
import AzureVoiceTools from "./AzureVoiceTools";

/** Voice tools for A0 lectures, using a short-lived server-created session. */
export default function A0TeachingCompanion({ lectureId }: { lectureId: string }) {
  return (
    <>
      <LectureCoach lectureId={lectureId} />
      <AzureVoiceTools contextId={lectureId} />
    </>
  );
}
