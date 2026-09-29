import { z } from "zod";
import {
  aiCapabilities,
  allowAiRequest,
  apiError,
  callOpenAI,
  extractResponseText,
  feedbackModel,
  getAzureConfig,
  getSpeechSynthesisConfig,
  safeOrigin,
  transcribeAudio,
} from "@/lib/ai";

export const runtime = "nodejs";

const inputSchema = z
  .object({
    capability: z.enum(["feedback", "transcription", "characterVoices"]),
  })
  .strict();

const swedishCheckText = "Hej! Jag heter Alex och jag bor i Finland.";

async function synthesizeSwedishCheck() {
  const config = getSpeechSynthesisConfig();
  if (!config) throw new Error("Speech synthesis is not configured.");
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="sv-SE"><voice name="sv-SE-MattiasNeural">${swedishCheckText}</voice></speak>`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": config.key,
        "User-Agent": "Stigen-Swedish-Health-Check",
        "X-Microsoft-OutputFormat": "riff-16khz-16bit-mono-pcm",
      },
      body: ssml,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Speech synthesis check failed.");
    const audio = await response.arrayBuffer();
    if (audio.byteLength < 1_000 || audio.byteLength > 3_000_000) {
      throw new Error("Speech synthesis returned invalid audio.");
    }
    return audio;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  if (!safeOrigin(request)) {
    return apiError("Run Azure checks from the learning app.", 403);
  }
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return apiError("Send the Azure capability to check as JSON.", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > 1_000) {
    return apiError("The Azure check request is too large.", 413);
  }

  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch {
    return apiError("Choose a supported Azure capability check.");
  }

  const configured = aiCapabilities();
  if (!configured[input.capability]) {
    return apiError("This Azure capability is not configured.", 503);
  }
  if (!allowAiRequest("azure-health")) {
    return apiError("Please wait a minute before running more Azure checks.", 429);
  }

  try {
    if (input.capability === "feedback") {
      const azure = getAzureConfig();
      if (!azure) throw new Error("Azure OpenAI is not configured.");
      const result = await callOpenAI(
        "responses",
        JSON.stringify({
          model: feedbackModel(),
          reasoning: { effort: "low" },
          store: false,
          max_output_tokens: 80,
          instructions:
            "This is a server connection check. Reply with one short Swedish sentence confirming that the Swedish tutor is ready. Do not include personal data.",
          input: [{ role: "user", content: "Bekräfta anslutningen." }],
        }),
      );
      const reply = extractResponseText(result).trim();
      if (!reply) throw new Error("Azure OpenAI returned an empty response.");
      return Response.json(
        {
          ok: true,
          checkedAt: new Date().toISOString(),
          detail: "Azure returned a Swedish tutor response.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const audio = await synthesizeSwedishCheck();
    if (input.capability === "characterVoices") {
      return Response.json(
        {
          ok: true,
          checkedAt: new Date().toISOString(),
          detail: `Azure returned ${(audio.byteLength / 1_024).toFixed(1)} KB of Swedish audio.`,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const transcript = await transcribeAudio(
      new File([audio], "stigen-swedish-check.wav", { type: "audio/wav" }),
    );
    const normalized = transcript.toLocaleLowerCase("sv-SE");
    if (!normalized.includes("hej") || !normalized.includes("finland")) {
      throw new Error("The Swedish loopback transcript did not match.");
    }
    return Response.json(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        detail: `Recognized: ${transcript}`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return apiError(
      "The configured Azure service did not pass its live check. Try again or inspect the server configuration.",
      502,
    );
  }
}
