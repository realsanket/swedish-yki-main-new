import { detailedCurriculumMarkdown } from "@/lib/curriculum-markdown";

export function GET() {
  return new Response(detailedCurriculumMarkdown(), {
    headers: {
      "Content-Disposition":
        'attachment; filename="stigen-detailed-swedish-curriculum.md"',
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
