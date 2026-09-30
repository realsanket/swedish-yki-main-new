import { aiCapabilities, aiProvider } from "@/lib/ai";

export async function GET() {
  const configured = aiCapabilities();
  return Response.json({ configured: configured.feedback, signedIn: true, available: configured.feedback, provider: aiProvider(), capabilities: { feedback: configured.feedback, transcription: configured.transcription, characterVoices: configured.characterVoices, liveVoice: configured.liveVoice, pronunciation: configured.pronunciation }, userId: "local" }, { headers: { "Cache-Control": "no-store" } });
}
