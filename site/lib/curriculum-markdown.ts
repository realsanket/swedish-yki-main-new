import { bookReviews } from "./book-reviews";
import { courseModules, lectures, routeProfileForLecture } from "./course";
import { storyChapterForModule } from "./story-world";
import { getYkiMock } from "./yki-mocks";

const liveModules = courseModules.filter((module) =>
  lectures.some((lecture) => lecture.module === module.number),
);

function cleanInline(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

function tableCell(value: string) {
  return cleanInline(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

export function detailedCurriculumMarkdown() {
  const lines = [
    "# Stigen — Detailed Swedish Curriculum",
    "",
    "> The ordered teaching index for the live Chapter 1 workshop.",
    "",
    `**${lectures.length} live episodes** across **${liveModules.length} story chapters**. The supplied classroom notes and books informed the sequence, but their pages are not embedded; every learner-facing task is original.`,
    "",
    "## How to use this curriculum",
    "",
    "1. Follow each lecture’s steps in order: hear, learn, try, use, check, and carry forward, plus any textbook practice the lecture adds.",
    "2. Use the teaching index to review the actual concepts, language patterns, examples, and takeaways.",
    "",
  ];

  for (const chapterModule of liveModules) {
    const chapter = storyChapterForModule(chapterModule.number);
    const moduleLectures = lectures.filter(
      (lecture) => lecture.module === chapterModule.number,
    );
    const firstEpisode = moduleLectures.at(0)?.number ?? chapterModule.first;
    const lastEpisode = moduleLectures.at(-1)?.number ?? chapterModule.last;

    lines.push(
      `## Chapter ${String(chapterModule.number).padStart(2, "0")} — ${chapterModule.title}`,
      "",
      `- **Level:** ${chapterModule.level}`,
      firstEpisode === lastEpisode
        ? `- **Lecture:** ${firstEpisode}`
        : `- **Episodes:** ${firstEpisode}–${lastEpisode}`,
      `- **Story chapter:** ${chapter.title}`,
      `- **Setting:** ${chapter.setting}`,
      `- **Chapter outcome:** ${cleanInline(chapterModule.outcome)}`,
      `- **Chapter overview:** ${cleanInline(chapterModule.description)}`,
      "",
    );

    if (chapterModule.vocabularyTargets) {
      lines.push(
        "### Chapter vocabulary targets",
        "",
        `- **Active vocabulary:** ${cleanInline(chapterModule.vocabularyTargets.active)}`,
        `- **Recognition vocabulary:** ${cleanInline(chapterModule.vocabularyTargets.recognition)}`,
        `- **Functional chunks:** ${cleanInline(chapterModule.vocabularyTargets.functional)}`,
        `- **Purposeful recycling:** ${cleanInline(chapterModule.vocabularyTargets.recycled)}`,
        "",
      );
    }

    for (const lecture of moduleLectures) {
      const routeProfile = routeProfileForLecture(lecture);
      lines.push(
        `### Episode ${String(lecture.number).padStart(2, "0")} — ${lecture.title}`,
        "",
        `- **Broad skill coverage:** ${lecture.focusSkills.join(", ")}`,
        `- **Required core task:** ${lecture.route.requiredSkills.join(" + ")} · primary ${lecture.route.primarySkill}`,
        `- **Expected learner output:** ${cleanInline(lecture.route.expectedOutput)}`,
        `- **Format:** ${routeProfile.id === "standard" ? "Lesson" : routeProfile.label.replace(" route", "")} · ${lecture.minutes} min`,
        "",
        "#### Learning goals",
        "",
        ...lecture.objectives.map((objective) => `- ${cleanInline(objective)}`),
        "",
        "#### Teaching topics and subtopics",
        "",
      );

      for (const [index, section] of lecture.sections.entries()) {
        lines.push(
          `##### ${index + 1}. ${section.title}`,
          "",
          ...section.body.map((subtopic) => `- ${cleanInline(subtopic)}`),
          "",
        );

        if (section.examples.length > 0) {
          lines.push("**Key examples**", "");
          for (const example of section.examples) {
            lines.push(
              `- **${cleanInline(example.fi)}** — ${cleanInline(example.en)}`,
            );
            if (example.note) lines.push(`  - Note: ${cleanInline(example.note)}`);
          }
          lines.push("");
        }

        if (section.table) {
          lines.push(
            "**Pattern table**",
            "",
            `| ${section.table.headings.map(tableCell).join(" | ")} |`,
            `| ${section.table.headings.map(() => "---").join(" | ")} |`,
            ...section.table.rows.map(
              (row) => `| ${row.map(tableCell).join(" | ")} |`,
            ),
            "",
          );
        }
      }

      lines.push(
        "#### Carry forward",
        "",
        ...lecture.takeaways.map((takeaway) => `- ${cleanInline(takeaway)}`),
        "",
      );

      const mock = getYkiMock(lecture.number);
      if (mock) {
        lines.push(
          "#### Original compressed mock task set",
          "",
          `- **Conditions:** ${mock.conditions.join(" · ")}`,
          `- **Timed blocks:** ${mock.timing.map((block) => `${block.label} ${block.minutes} min`).join(" · ")}`,
          `- **Listening:** ${mock.listening.map((task) => task.title).join("; ")}`,
          `- **Reading:** ${mock.reading.map((task) => task.title).join("; ")}`,
          `- **Speaking:** ${mock.speaking.map((task) => task.title).join("; ")}`,
          `- **Writing:** ${mock.writing.map((task) => task.title).join("; ")}`,
          "",
          "#### Post-mock diagnosis",
          "",
          ...mock.diagnosis.map(
            (item) => `- **${item.title}:** ${cleanInline(item.nextDrillPrompt)}`,
          ),
          "",
        );
      }
    }

    const companions = bookReviews.filter((review) =>
      review.touchpoints.some(
        (episode) => episode >= firstEpisode && episode <= lastEpisode,
      ) ||
      (review.anchorEpisode >= firstEpisode && review.anchorEpisode <= lastEpisode),
    );

    if (companions.length > 0) {
      lines.push("### Optional source companions", "");
      for (const companion of companions) {
        lines.push(
          `- **Chapter ${String(companion.number).padStart(2, "0")}: ${companion.title}** — ${cleanInline(companion.focus)} [Open source review](${companion.href})`,
          `  - Best after episode ${companion.anchorEpisode}. ${cleanInline(companion.storyBridge)}`,
        );
      }
      lines.push("");
    }
  }

  lines.push(
    "## Assessment note",
    "",
    "Curriculum labels are learning-path labels, not CEFR certificates. Lecture 1 practice evidence does not predict an official YKI result.",
    "",
  );

  return lines.join("\n");
}
