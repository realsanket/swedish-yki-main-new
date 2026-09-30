import { allowAiRequest, apiError, getPronunciationConfig, readLimitedBody, safeOrigin } from "@/lib/ai";

export const runtime = "nodejs";

type Scores = { AccuracyScore?: number; FluencyScore?: number; CompletenessScore?: number; PronScore?: number; ErrorType?: string };
// The short-audio REST API puts scores directly on each result; the SDK
// nests them under PronunciationAssessment. Both shapes are read.
type AzureWord = Scores & { Word?: string; PronunciationAssessment?: Scores };
type AzureResult = {
  RecognitionStatus?: string;
  DisplayText?: string;
  NBest?: Array<{
    Display?: string;
    PronunciationAssessment?: Scores;
    Words?: AzureWord[];
  } & Scores>;
};

const score = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null);

/**
 * Scores a short Swedish recording against the text the learner meant to
 * say, word by word, using Azure Speech pronunciation assessment (sv-SE).
 * The browser sends 16 kHz mono WAV; the key never leaves the server.
 */
export async function POST(request: Request) {
  if (!safeOrigin(request)) return apiError("This request must come from the learning app.", 403);
  const config = getPronunciationConfig();
  if (!config) return apiError("Pronunciation scoring is not connected yet. Compare your recording with the model instead.", 503);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) return apiError("Send the recording as multipart form data.", 415);
  if (Number(request.headers.get("content-length") ?? 0) > 1_200_000) return apiError("Keep the recording under 30 seconds.", 413);
  try {
    const body = await readLimitedBody(request, 1_200_000);
    const form = await new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const audio = form.get("audio");
    const reference = form.get("reference");
    if (!(audio instanceof File) || !audio.size || audio.size > 1_100_000) return apiError("Add a recording shorter than 30 seconds.");
    if (typeof reference !== "string" || !reference.trim() || reference.length > 400) return apiError("Add the Swedish text you meant to say (up to 400 characters).");
    if (!allowAiRequest("local")) return apiError("Please wait a minute before scoring another recording.", 429);
    const assessment = Buffer.from(JSON.stringify({
      ReferenceText: reference.trim(),
      GradingSystem: "HundredMark",
      Granularity: "Word",
      Dimension: "Comprehensive",
      EnableMiscue: true,
    })).toString("base64");
    const url = new URL(config.endpoint);
    url.searchParams.set("language", "sv-SE");
    url.searchParams.set("format", "detailed");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": config.key,
          "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
          "Pronunciation-Assessment": assessment,
          Accept: "application/json",
        },
        body: new Uint8Array(await audio.arrayBuffer()),
        signal: controller.signal,
      });
      if (!response.ok) {
        console.error("Pronunciation assessment failed:", response.status);
        return apiError("Azure could not score this recording. Compare it with the model instead.", 502);
      }
      const result = (await response.json()) as AzureResult;
      const best = result.NBest?.[0];
      if (result.RecognitionStatus !== "Success" || !best) return apiError("No Swedish speech was heard. Try again a little louder and closer to the microphone.", 422);
      const pa = best.PronunciationAssessment ?? best;
      return Response.json({
        heard: best.Display ?? result.DisplayText ?? "",
        scores: {
          pronunciation: score(pa.PronScore),
          accuracy: score(pa.AccuracyScore),
          fluency: score(pa.FluencyScore),
          completeness: score(pa.CompletenessScore),
        },
        words: (best.Words ?? []).slice(0, 80).map((word) => ({
          word: word.Word ?? "",
          accuracy: score((word.PronunciationAssessment ?? word).AccuracyScore),
          error: (word.PronunciationAssessment ?? word).ErrorType ?? "None",
        })),
      }, { headers: { "Cache-Control": "no-store" } });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Request body is too large.") return apiError("Keep the recording under 30 seconds.", 413);
    if (error instanceof Error && error.name === "AbortError") return apiError("Scoring took too long. Please try again.", 504);
    return apiError("Pronunciation scoring could not be completed. Compare your recording with the model instead.", 502);
  }
}
