import { applyExamActionDb, readExamState } from "@/lib/exam-db";
import { examContext } from "@/lib/exam-content";
import { ExamError } from "@/lib/exam-state";
import { assertSameOrigin, ProgressError } from "@/lib/progress";
// P0 shim: package C replaces this. The route still accepts the v1 actions only.
import type { ExamActionV1 as ExamAction } from "@/lib/exam-types";

const USER_ID = "local";
const headers = { "Cache-Control": "private, no-store" };
const MAX_BODY = 20_000;
const TYPES = new Set(["tickStep", "logDay", "resetDay", "addError", "resolveError", "deleteError", "addCard", "deleteCard", "reviewCard", "setSignal"]);

function errorResponse(error: unknown): Response {
  if (error instanceof ExamError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
  if (error instanceof ProgressError) return Response.json({ error: error.message }, { status: error.status, headers });
  console.error("Exam storage request failed", error instanceof Error ? error.name : "Unknown error");
  return Response.json({ error: "Your exam-course progress could not be saved or loaded. Try again." }, { status: 500, headers });
}

async function body(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new ExamError(415, "Send the request as application/json.");
  const text = await request.text();
  if (text.length > MAX_BODY) throw new ExamError(413, "The request is too large.");
  try { return JSON.parse(text); } catch { throw new ExamError(400, "The request is not valid JSON."); }
}

export async function GET(): Promise<Response> {
  try {
    return Response.json(readExamState(USER_ID), { headers });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const action = await body(request) as ExamAction;
    if (!action || typeof action !== "object" || typeof action.type !== "string" || !TYPES.has(action.type)) throw new ExamError(400, "Unknown exam action.");
    return Response.json(applyExamActionDb(USER_ID, action, examContext()), { headers });
  } catch (error) { return errorResponse(error); }
}
