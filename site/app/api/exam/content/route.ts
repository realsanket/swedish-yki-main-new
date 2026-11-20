import { contentCards, examCurriculum, examDocs, examLearner, examUnits } from "@/lib/exam-content";

const headers = { "Cache-Control": "private, max-age=300" };
const notFound = () => Response.json({ error: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });

/** Generated exam content, served in small pieces so the app does not ship ~1 MB of Markdown in its bundle. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const key = url.searchParams.get("key") ?? "";
  if (kind === "units") return Response.json(examUnits, { headers });
  if (kind === "cards") return Response.json(contentCards(), { headers });
  if (kind === "learner") { const page = examLearner[key]; return page ? Response.json(page, { headers }) : notFound(); }
  if (kind === "entry") { const entry = examCurriculum.find((e) => e.key === key); return entry ? Response.json(entry, { headers }) : notFound(); }
  if (kind === "docs") return Response.json(examDocs.map((d) => ({ id: d.id, title: d.title, summary: d.summary, playable: !!d.playable, sections: d.sections.map((s) => ({ id: s.id, title: s.title, level: s.level, layer: s.layer })) })), { headers });
  if (kind === "doc") {
    const doc = examDocs.find((d) => d.id === key);
    const sectionId = url.searchParams.get("section");
    if (!doc) return notFound();
    if (!sectionId) return Response.json({ id: doc.id, title: doc.title, playable: !!doc.playable, sections: doc.sections }, { headers });
    const section = doc.sections.find((s) => s.id === sectionId);
    return section ? Response.json({ id: doc.id, title: doc.title, playable: !!doc.playable, section }, { headers }) : notFound();
  }
  return notFound();
}
