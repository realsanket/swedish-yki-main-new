import { lessons, words } from "@/lib/curriculum";
import { courseWords } from "@/lib/course";
import { reviewCardIds } from "@/lib/review-cards";
import { assertSameOrigin, parseProgressAction, ProgressError } from "@/lib/progress";
import { applyProgress, readProgress } from "@/lib/server-db";

const USER_ID = "local";
const responseHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(error: unknown): Response {
  if (error instanceof ProgressError) return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  const detail = error instanceof Error ? error.message : "";
  if (detail.includes("no such table")) return Response.json({ error: "Progress storage is being prepared. Please try again shortly." }, { status: 503, headers: responseHeaders });
  console.error("Progress API failed", error);
  return Response.json({ error: "Your progress could not be saved or loaded. Please try again." }, { status: 500, headers: responseHeaders });
}

async function readBoundedJson(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new ProgressError(415, "Send the request as application/json.");
  const maximumBytes = 4096;
  if (Number(request.headers.get("content-length")) > maximumBytes) throw new ProgressError(413, "The progress request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new ProgressError(400, "Send a JSON request body.");
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > maximumBytes) {
      await reader.cancel();
      throw new ProgressError(413, "The progress request is too large.");
    }
    body += decoder.decode(chunk.value, { stream: true });
  }
  body += decoder.decode();
  try { return JSON.parse(body); }
  catch { throw new ProgressError(400, "The request body is not valid JSON."); }
}

export async function GET(): Promise<Response> {
  try {
    return Response.json(await readProgress(USER_ID), { headers: responseHeaders });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const action = parseProgressAction(await readBoundedJson(request));
    if (action.action === "complete" && !lessons.some((lesson) => lesson.id === action.lessonId)) throw new ProgressError(400, "This lesson was not found in the curriculum.");
    if (action.action === "review" && ![...words, ...courseWords].some((word) => word.id === action.wordId) && !reviewCardIds.has(action.wordId)) throw new ProgressError(400, "This word was not found in your vocabulary library.");
    await applyProgress(USER_ID, action);
    return Response.json(await readProgress(USER_ID), { headers: responseHeaders });
  } catch (error) { return errorResponse(error); }
}
