import { createHash } from "node:crypto";
import { z } from "zod";
import {
  characterVoiceProfiles,
  speechLocales,
  type SpeechLanguage,
} from "@/lib/character-voices";
import { apiError, getSpeechSynthesisConfig, safeOrigin } from "@/lib/ai";
import {
  storyCharacterNames,
  type StoryCharacterName,
} from "@/lib/story-world";

export const runtime = "nodejs";

const segmentSchema = z.object({
  text: z.string().trim().min(1).max(1_500),
  speaker: z.enum(storyCharacterNames),
  language: z.enum(["sv", "en"]).default("sv"),
});

const speechRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(4_000).optional(),
    speaker: z.enum(storyCharacterNames).default("Sami"),
    language: z.enum(["sv", "en"]).default("sv"),
    segments: z.array(segmentSchema).min(1).max(24).optional(),
    slow: z.boolean().default(false),
  })
  .refine((value) => Boolean(value.text) !== Boolean(value.segments), {
    message: "Send either text or dialogue segments.",
  })
  .refine(
    (value) =>
      (value.text?.length ?? 0) +
        (value.segments?.reduce((sum, segment) => sum + segment.text.length, 0) ?? 0) <=
      4_000,
    { message: "Keep speech requests under 4,000 characters." },
  );

type SpeechSegment = {
  text: string;
  speaker: StoryCharacterName;
  language: SpeechLanguage;
};

const audioCache = new Map<string, ArrayBuffer>();
const requests = new Map<string, { count: number; resets: number }>();

function escapeSsml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function voiceElement(segment: SpeechSegment, slow: boolean) {
  const profile = characterVoiceProfiles[segment.speaker];
  const rate = slow ? profile.slowRate : profile.normalRate;
  const locale = speechLocales[segment.language];
  return `<voice name="${profile.azureVoice}"><prosody rate="${rate}"><lang xml:lang="${locale}">${escapeSsml(segment.text)}</lang></prosody></voice>`;
}

export function buildSpeechSsml(segments: SpeechSegment[], slow: boolean) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">${segments
    .map((segment) => voiceElement(segment, slow))
    .join('<break time="180ms"/>')}</speak>`;
}

function allowSpeechRequest(id: string) {
  const now = Date.now();
  const current = requests.get(id);
  if (!current || current.resets <= now) {
    requests.set(id, { count: 1, resets: now + 60_000 });
    return true;
  }
  if (current.count >= 40) return false;
  current.count += 1;
  return true;
}

function audioResponse(audio: ArrayBuffer) {
  return new Response(audio, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(audio.byteLength),
      "Content-Type": "audio/mpeg",
    },
  });
}

export async function POST(request: Request) {
  if (!safeOrigin(request)) {
    return apiError("This request must come from the learning app.", 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return apiError("Send speech text as JSON.", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > 12_000) {
    return apiError("Keep speech requests under 4,000 characters.", 413);
  }
  const config = getSpeechSynthesisConfig();
  if (!config) {
    return apiError("Azure lesson voices are not connected yet.", 503);
  }
  if (!allowSpeechRequest("local")) {
    return apiError("Please wait a moment before playing more generated audio.", 429);
  }

  try {
    const input = speechRequestSchema.parse(await request.json());
    const segments: SpeechSegment[] = input.segments ?? [
      {
        text: input.text!,
        speaker: input.speaker,
        language: input.language,
      },
    ];
    const ssml = buildSpeechSsml(segments, input.slow);
    const cacheKey = createHash("sha256").update(ssml).digest("base64url");
    const cached = audioCache.get(cacheKey);
    if (cached) return audioResponse(cached);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "Ocp-Apim-Subscription-Key": config.key,
          "User-Agent": "Stigen-Swedish",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        },
        body: ssml,
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 429) {
          return apiError("Azure Speech is busy. Device audio is still available.", 429);
        }
        return apiError("Azure lesson audio could not be generated.", 502);
      }
      const audio = await response.arrayBuffer();
      if (!audio.byteLength || audio.byteLength > 8_000_000) {
        return apiError("Azure returned an invalid audio response.", 502);
      }
      if (audioCache.size >= 32) {
        const oldest = audioCache.keys().next().value;
        if (oldest) audioCache.delete(oldest);
      }
      audioCache.set(cacheKey, audio);
      return audioResponse(audio);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0]?.message ?? "The speech request is invalid.");
    }
    if (error instanceof SyntaxError) return apiError("Send valid JSON.");
    if (error instanceof Error && error.name === "AbortError") {
      return apiError("Azure character audio timed out.", 504);
    }
    return apiError("Azure lesson audio could not be generated.", 502);
  }
}
