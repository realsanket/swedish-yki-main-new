import { ArrowUpRight, BookOpen, Headphones, Flag, Languages } from "lucide-react";
import { lectures, courseModules } from "@/lib/course";

const resources = [
  {
    type: "OFFICIAL · UTBILDNINGSSTYRELSEN",
    title: "Choose the right Swedish YKI test",
    text: "Check current levels, test dates, test centres, registration windows, and any current pilot arrangements before you book.",
    url: "https://www.oph.fi/sv/utbildning-och-examina/att-valja-ett-lampligt-yki-test-testdagarna",
    icon: Flag,
  },
  {
    type: "OFFICIAL · YKI OVERVIEW",
    title: "Understand what YKI measures",
    text: "YKI measures functional adult language proficiency. Listening, speaking, reading, and writing are assessed as separate subtests.",
    url: "https://www.oph.fi/sv/allmanna-sprakexamina-yki",
    icon: Flag,
  },
  {
    type: "OFFICIAL · BEFORE THE TEST",
    title: "Prepare from current instructions",
    text: "Use the official preparation page for test-day rules, topic domains, and links to current task-type demonstrations.",
    url: "https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia",
    icon: BookOpen,
  },
  {
    type: "UNIVERSITY OF JYVÄSKYLÄ",
    title: "Explore the YKI demonstration",
    text: "Familiarise yourself with task instructions and test rhythm. Demonstration tasks explain format; they are not released past exams.",
    url: "https://ykitesti.solki.jyu.fi/",
    icon: Flag,
  },
  {
    type: "KIELIBUUSTI · FREE RESOURCE BANK",
    title: "Find Swedish self-study materials",
    text: "Compare grammar, pronunciation, listening, writing, and Finland-Swedish resources collected for Swedish learners in Finland.",
    url: "https://www.kielibuusti.fi/en/learn-swedish/self-study-and-tips/find-self-study-materials",
    icon: Languages,
  },
  {
    type: "KIELIBUUSTI · FINLAND-SWEDISH CONTEXT",
    title: "Explore Sidu! Det svenska i Finland",
    text: "Use free videos, images, and themed modules to connect Swedish practice with Swedish-speaking regions and culture in Finland.",
    url: "https://www.kielibuusti.fi/en/learn-swedish/self-study-and-tips/sidu-det-svenska-i-finland",
    icon: Languages,
  },
  {
    type: "YLE · PUBLIC-SERVICE MEDIA",
    title: "Build a real Swedish listening habit",
    text: "Choose one short Svenska Yle item, listen for the main point, then retell it in two sentences before checking details.",
    url: "https://svenska.yle.fi/",
    icon: Headphones,
  },
  {
    type: "COUNCIL OF EUROPE",
    title: "Use CEFR as a can-do map",
    text: "Reflect on what you can understand and accomplish in real communication. A0 is Stigen’s starting label; Pre-A1 is the CEFR term.",
    url: "https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors-search",
    icon: BookOpen,
  },
];

export default function Resources() {
  const availableModules = courseModules.filter((module) =>
    lectures.some((lecture) => lecture.module === module.number),
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">BRA ATT VETA · GOOD TO KNOW</p>
          <h1>A path grounded in real Swedish.</h1>
          <p>Current official guidance, Finland-Swedish context, and sustainable independent practice.</p>
        </div>
      </div>
      <div className="resource-grid">
        {resources.map((resource) => (
          <a
            target="_blank"
            rel="noreferrer"
            href={resource.url}
            className="panel resource"
            key={resource.url}
          >
            <resource.icon size={25} />
            <p className="small-label">{resource.type}</p>
            <h2>
              {resource.title}
              <ArrowUpRight size={18} />
            </h2>
            <p>{resource.text}</p>
          </a>
        ))}
      </div>
      <div className="callout">
        <BookOpen />
        <div>
          <b>How this course is designed</b>
          <p>
            Follow {lectures.length} story-led episodes across {availableModules} chapters.
            Each episode joins a practical explanation to guided practice, independent use,
            a checkpoint, and a later return. Every fifth episode reconnects all four skills.
            English support remains available while Swedish gradually takes more of the task.
            The sequence is informed by the supplied course notes and books, but all tasks in
            Stigen are newly written. Stigen is not affiliated with the Finnish National Agency
            for Education or an official YKI test centre, and completion is not a proficiency certificate.
          </p>
          <p className="help-text">
            Links checked 28 September 2026. Exam arrangements can change; use the official
            YKI pages for current details.
          </p>
        </div>
      </div>
    </>
  );
}
