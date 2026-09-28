import { aiCapabilities, allowAiRequest, apiError, transcribeAudio, readLimitedBody, safeOrigin } from "@/lib/ai";

export async function POST(request: Request) {
  if (!safeOrigin(request)) return apiError("This request must come from the learning app.", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) return apiError("Send an audio file as multipart form data.", 415);
  if (!aiCapabilities().transcription) return apiError("AI transcription is not connected yet. Listen to your recording and type what you said.", 503);
  if (Number(request.headers.get("content-length") ?? 0) > 8_500_000) return apiError("Keep recordings under 8 MB.", 413);
  try {
    const body = await readLimitedBody(request, 8_500_000);
    const form = await new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || !audio.size || audio.size > 8_000_000) return apiError("Add an audio recording smaller than 8 MB.");
    if (!/^(audio\/(webm|mp4|mpeg|wav|x-wav|ogg|flac|x-m4a)|video\/(webm|mp4))(;.*)?$/.test(audio.type)) return apiError("Please record in WebM, MP4, WAV, OGG, FLAC, or MP3 format.");
    if (!allowAiRequest("local")) return apiError("Please wait a minute before requesting another transcription.", 429);
    const text = await transcribeAudio(audio);
    if (!text) return apiError("No Swedish speech was detected. Try a longer, clearer recording or type what you said.", 422);
    return Response.json({ text }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "Request body is too large.") return apiError("Keep recordings under 8 MB.", 413);
    return apiError("Transcription could not be completed. Your recording is still available; retry or type what you said.", 502);
  }
}
