import { getLecture } from "@/lib/course";
import { CourseError, parseCourseAction } from "@/lib/course-progress";
import { applyCourseAction, readCourseProgress } from "@/lib/course-db";
import { assertSameOrigin, ProgressError } from "@/lib/progress";

const USER_ID = "local";
const headers = { "Cache-Control": "private, no-store" };
function errorResponse(error: unknown): Response {
  if (error instanceof CourseError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
  if (error instanceof ProgressError) return Response.json({ error: error.message }, { status: error.status, headers });
  if (error instanceof Error && error.message.includes("no such table")) return Response.json({ error: "Course storage is being prepared. Your existing learning history is safe; please try again shortly." }, { status: 503, headers });
  console.error("Course storage request failed", error instanceof Error ? error.name : "Unknown error");
  return Response.json({ error: "Your course work could not be saved or loaded. Keep your draft and try again." }, { status: 500, headers });
}
async function body(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new CourseError(415, "Send the course request as application/json.");
  const max = 80_000;
  if (Number(request.headers.get("content-length")) > max) throw new CourseError(413, "The course request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new CourseError(400, "Send a JSON request body.");
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void reader.cancel(); }, 10_000);
  let bytes = 0;
  let content = "";
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    while (true) {
      const chunk = await reader.read();
      if (timedOut) throw new CourseError(408, "The course request timed out. Please try again.");
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > max) { await reader.cancel(); throw new CourseError(413, "The course request is too large."); }
      content += decoder.decode(chunk.value, { stream: true });
    }
    content += decoder.decode();
    try { return JSON.parse(content); } catch { throw new CourseError(400, "The course request is not valid JSON."); }
  } catch (error) {
    if (error instanceof CourseError) throw error;
    throw new CourseError(400, "The course request is not valid UTF-8 JSON.");
  } finally { clearTimeout(timer); reader.releaseLock(); }
}
export async function GET(): Promise<Response> {
  try {
    return Response.json(await readCourseProgress(USER_ID), { headers });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const action = parseCourseAction(await body(request));
    const lecture = getLecture(action.lectureId);
    if (!lecture) throw new CourseError(404, "This lecture was not found in the course.");
    await applyCourseAction(USER_ID, action, lecture);
    return Response.json(await readCourseProgress(USER_ID), { headers });
  } catch (error) { return errorResponse(error); }
}
