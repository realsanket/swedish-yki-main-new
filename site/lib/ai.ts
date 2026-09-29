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

type AzureConfig = {
  baseUrl: string;
  key: string;
  feedbackModel: string;
};

type VoiceLiveConfig = {
  endpoint: string;
  key: string;
  model: string;
  voice: string;
  apiVersion: string;
};

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
export function getAzureConfigs(env: Environment = process.env): AzureConfig[] {
  const feedbackModel = env.AZURE_OPENAI_FEEDBACK_MODEL?.trim() || "gpt-6-luna";
  const baseUrl = secureEndpoint(env.AZURE_OPENAI_BASE_URL, "/openai/v1");
  const key = env.AZURE_OPENAI_API_KEY?.trim();
  return baseUrl && key ? [{ baseUrl, key, feedbackModel }] : [];
}

export function getAzureConfig(env: Environment = process.env) {
  return getAzureConfigs(env)[0] ?? null;
}

export function getSpeechConfig(env: Environment = process.env) {
  const endpoint = secureEndpoint(env.AZURE_SPEECH_ENDPOINT);
  const key = env.AZURE_SPEECH_API_KEY?.trim() || env.AZURE_OPENAI_API_KEY?.trim();
  if (!endpoint || !key) return null;
  return { endpoint, key, apiVersion: env.AZURE_SPEECH_API_VERSION?.trim() || "2025-10-15" };
}

export function getSpeechSynthesisConfig(env: Environment = process.env) {
  const configuredEndpoint = secureEndpoint(env.AZURE_SPEECH_TTS_ENDPOINT);
  let endpoint: string | null = null;
  if (configuredEndpoint) {
    const url = new URL(configuredEndpoint);
    const path = url.pathname.replace(/\/+$/, "");
    if (!path) {
      endpoint = `${url.origin}${
        url.hostname.endsWith(".cognitiveservices.azure.com")
          ? "/tts/cognitiveservices/v1"
          : "/cognitiveservices/v1"
      }`;
    } else if (
      path === "/tts/cognitiveservices/v1" ||
      path === "/cognitiveservices/v1"
    ) {
      endpoint = `${url.origin}${path}`;
    }
  }
  const key =
    env.AZURE_SPEECH_API_KEY?.trim() || env.AZURE_OPENAI_API_KEY?.trim();
  if (!endpoint || !key) return null;
  return { endpoint, key };
}

/** Configuration for the server-side Voice Live WebSocket proxy. */
export function getVoiceLiveConfig(env: Environment = process.env): VoiceLiveConfig | null {
  const endpoint = secureEndpoint(env.AZURE_VOICELIVE_ENDPOINT || env.AZURE_SPEECH_ENDPOINT);
  const key = env.AZURE_VOICELIVE_API_KEY?.trim() || env.AZURE_SPEECH_API_KEY?.trim() || env.AZURE_OPENAI_API_KEY?.trim();
  const model = env.AZURE_VOICELIVE_MODEL?.trim();
  if (!endpoint || !key || !model) return null;
  const url = new URL(endpoint);
  if (
    url.pathname.replace(/\/+$/, "") ||
    !(url.hostname.endsWith(".services.ai.azure.com") || url.hostname.endsWith(".cognitiveservices.azure.com"))
  ) return null;
  return {
    endpoint,
    key,
    model,
    voice: env.AZURE_VOICELIVE_VOICE?.trim() || "sv-SE-MattiasNeural",
    apiVersion: env.AZURE_VOICELIVE_API_VERSION?.trim() || "2026-01-01-preview",
  };
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
    liveVoice: Boolean(getVoiceLiveConfig(env)),
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
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    const requestUrl = new URL(request.url);
    const host = request.headers.get("host")?.trim();
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || requestUrl.protocol.slice(0, -1);
    const browserOrigin = new URL(origin);
    return browserOrigin.origin === requestUrl.origin || Boolean(host && browserOrigin.origin === `${protocol}://${host}`);
  } catch { return false; }
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

class ProviderRequestError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "ProviderRequestError";
  }
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
    if (!response.ok) {
      await response.body?.cancel();
      throw new ProviderRequestError(
        response.status === 429
          ? "The AI service is busy or its quota is exhausted. Try again later; your draft is safe."
          : "The AI service could not complete this request. Your draft is safe. Try again later.",
        response.status === 401 ||
          response.status === 403 ||
          response.status === 404 ||
          response.status === 408 ||
          response.status === 409 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ProviderRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new ProviderRequestError("AI feedback timed out. Your draft is safe. Please retry.", true);
    if (error instanceof Error && error.message.startsWith("The AI service")) throw error;
    throw new ProviderRequestError("The AI service could not be reached. Your draft is safe. Try again later.", true);
  } finally { clearTimeout(timer); }
}

export async function callOpenAI(path: "responses" | "audio/transcriptions", body: string | FormData): Promise<unknown> {
  const azureConfigs = getAzureConfigs();
  // Recorded audio uses Azure Speech, not the Realtime conversation deployment.
  if (azureConfigs.length && path === "responses") {
    let lastError: unknown;
    for (const [index, azure] of azureConfigs.entries()) {
      try {
        return await providerRequest(`${azure.baseUrl}/${path}`, { "api-key": azure.key }, body);
      } catch (error) {
        lastError = error;
        const hasFallback = index < azureConfigs.length - 1;
        if (!(error instanceof ProviderRequestError) || !error.retryable || !hasFallback) throw error;
      }
    }
    throw lastError;
  }
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("The AI service is not configured for this request.");
  return providerRequest(`https://api.openai.com/v1/${path}`, { Authorization: `Bearer ${key}` }, body);
}

export async function transcribeAudio(audio: File): Promise<string> {
  const speech = getSpeechConfig();
  const form = new FormData();
  if (speech) {
    form.set("audio", audio, audio.name);
    // This course teaches standard Swedish and its Azure voice casting uses
    // sv-SE. Supplying an unsupported secondary locale makes the whole fast
    // transcription request fail instead of falling back to sv-SE.
    form.set("definition", JSON.stringify({ locales: ["sv-SE"] }));
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
