import { z } from "zod";

export const feedbackSchema = z.object({
  summary: z.string().max(1800),
  strengths: z.array(z.string().max(800)).max(5),
  corrections: z.array(z.object({ original: z.string().max(1200), corrected: z.string().max(1200), explanation: z.string().max(1200) })).max(8),
  improvedVersion: z.string().max(6000),
  nextStep: z.string().max(1500),
  rubric: z.array(z.object({ criterion: z.string().max(100), assessment: z.enum(["developing", "on track", "strong"]), note: z.string().max(1000) })).max(5),
});
export type PracticeFeedback = z.infer<typeof feedbackSchema>;

export const feedbackJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["summary", "strengths", "corrections", "improvedVersion", "nextStep", "rubric"],
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    corrections: { type: "array", items: { type: "object", additionalProperties: false, required: ["original", "corrected", "explanation"], properties: { original: { type: "string" }, corrected: { type: "string" }, explanation: { type: "string" } } } },
    improvedVersion: { type: "string" }, nextStep: { type: "string" },
    rubric: { type: "array", items: { type: "object", additionalProperties: false, required: ["criterion", "assessment", "note"], properties: { criterion: { type: "string" }, assessment: { type: "string", enum: ["developing", "on track", "strong"] }, note: { type: "string" } } } },
  },
};

/** A deliberately small response shape for help offered inside an A0 lecture. */
export const lectureCoachSchema = z.object({
  title: z.string().min(1).max(100),
  answer: z.string().min(1).max(900),
  tryThis: z.string().min(1).max(420),
  listenFor: z.string().min(1).max(420),
});
export type LectureCoachResponse = z.infer<typeof lectureCoachSchema>;

export const lectureCoachJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["title", "answer", "tryThis", "listenFor"],
  properties: {
    title: { type: "string" },
    answer: { type: "string" },
    tryThis: { type: "string" },
    listenFor: { type: "string" },
  },
};

type Environment = Record<string, string | undefined>;

function secureEndpoint(value: string | undefined, requiredPath = ""): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    const base = url.href.replace(/\/+$/, "");
    return requiredPath && !base.endsWith(requiredPath) ? null : base;
  } catch { return null; }
}

/** Server-only credentials. Never serialize this configuration into an API response. */
export function getAzureConfig(env: Environment = process.env) {
  const baseUrl = secureEndpoint(env.AZURE_OPENAI_BASE_URL, "/openai/v1");
  const key = env.AZURE_OPENAI_API_KEY?.trim();
  if (!baseUrl || !key) return null;
  return { baseUrl, key, feedbackModel: env.AZURE_OPENAI_FEEDBACK_MODEL?.trim() || "gpt-5.6-luna", voiceModel: env.AZURE_OPENAI_VOICE_MODEL?.trim() || "" };
}

export function getSpeechConfig(env: Environment = process.env) {
  const endpoint = secureEndpoint(env.AZURE_SPEECH_ENDPOINT);
  const key = env.AZURE_SPEECH_API_KEY?.trim() || env.AZURE_OPENAI_API_KEY?.trim();
  if (!endpoint || !key) return null;
  return { endpoint, key, apiVersion: env.AZURE_SPEECH_API_VERSION?.trim() || "2025-10-15" };
}

export function getSpeechSynthesisConfig(env: Environment = process.env) {
  const endpoint = secureEndpoint(
    env.AZURE_SPEECH_TTS_ENDPOINT,
    "/cognitiveservices/v1",
  );
  const key =
    env.AZURE_SPEECH_API_KEY?.trim() || env.AZURE_OPENAI_API_KEY?.trim();
  if (!endpoint || !key) return null;
  return { endpoint, key };
}

export function aiProvider(env: Environment = process.env): "azure" | "openai" | null {
  if (getAzureConfig(env)) return "azure";
  return env.OPENAI_API_KEY?.trim() ? "openai" : null;
}
export function aiCapabilities(env: Environment = process.env) {
  return {
    feedback: Boolean(aiProvider(env)),
    lectureCoach: Boolean(aiProvider(env)),
    transcription: Boolean(getSpeechConfig(env) || aiProvider(env) === "openai"),
    characterVoices: Boolean(getSpeechSynthesisConfig(env)),
    liveVoice: Boolean(getAzureConfig(env)?.voiceModel),
  };
}
export function aiConfigured() { return aiCapabilities().feedback; }
export function feedbackModel() { return getAzureConfig()?.feedbackModel || process.env.OPENAI_FEEDBACK_MODEL?.trim() || "gpt-4.1-mini"; }

// Per-instance burst protection. Production gateways should also enforce account-wide limits.
const requests = new Map<string, { count: number; resets: number }>();
export function allowAiRequest(userId: string): boolean {
  const now = Date.now();
  if (requests.size >= 2000) for (const [key, value] of requests) if (value.resets <= now) requests.delete(key);
  const current = requests.get(userId);
  if (!current && requests.size >= 2000) return false;
  if (!current || current.resets <= now) { requests.set(userId, { count: 1, resets: now + 60_000 }); return true; }
  if (current.count >= 12) return false;
  current.count += 1;
  return true;
}

export function safeOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "cross-site";
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readLimitedBody(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is missing.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new Error("Request body is too large."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}

async function providerRequest(url: string, headers: Record<string, string>, body: string | FormData): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, ...(typeof body === "string" ? { "Content-Type": "application/json" } : {}) },
      body, signal: controller.signal,
    });
    if (!response.ok) throw new Error(response.status === 429 ? "The AI service is busy or its quota is exhausted. Try again later; your draft is safe." : "The AI service could not complete this request. Your draft is safe. Try again later.");
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("AI feedback timed out. Your draft is safe. Please retry.");
    if (error instanceof Error && error.message.startsWith("The AI service")) throw error;
    throw new Error("The AI service could not be reached. Your draft is safe. Try again later.");
  } finally { clearTimeout(timer); }
}

export async function callOpenAI(path: "responses" | "audio/transcriptions", body: string | FormData): Promise<unknown> {
  const azure = getAzureConfig();
  // Recorded audio uses Azure Speech, not the unrelated GPT-Live deployment.
  if (azure && path === "responses") return providerRequest(`${azure.baseUrl}/${path}`, { "api-key": azure.key }, body);
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("The AI service is not configured for this request.");
  return providerRequest(`https://api.openai.com/v1/${path}`, { Authorization: `Bearer ${key}` }, body);
}

export async function transcribeAudio(audio: File): Promise<string> {
  const speech = getSpeechConfig();
  const form = new FormData();
  if (speech) {
    form.set("audio", audio, audio.name);
    form.set("definition", JSON.stringify({ locales: ["sv-FI", "sv-SE"] }));
    const result = await providerRequest(`${speech.endpoint}/speechtotext/transcriptions:transcribe?api-version=${encodeURIComponent(speech.apiVersion)}`, { "Ocp-Apim-Subscription-Key": speech.key }, form);
    const parsed = z.object({ combinedPhrases: z.array(z.object({ text: z.string() })).optional(), phrases: z.array(z.object({ text: z.string() })).optional() }).parse(result);
    const phrases = parsed.combinedPhrases?.length ? parsed.combinedPhrases : parsed.phrases ?? [];
    return z.string().max(10_000).parse(phrases.map(item => item.text).join(" ").trim());
  }
  if (getAzureConfig()) throw new Error("The AI service is not configured for transcription.");
  form.set("file", audio, audio.name);
  form.set("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
  form.set("language", "sv");
  form.set("response_format", "json");
  return z.object({ text: z.string().max(10_000) }).parse(await callOpenAI("audio/transcriptions", form)).text;
}

export function extractResponseText(response: unknown): string {
  const parsed = z.object({ output: z.array(z.object({ type: z.string(), content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional() }).parse(response);
  return (parsed.output ?? []).flatMap(item => item.content ?? []).filter(item => item.type === "output_text").map(item => item.text ?? "").join("");
}
