import { readFile } from "node:fs/promises";

const contentRoot = new URL("../content/", import.meta.url);

function cleanText(value, maximum = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maximum);
}

function cleanList(values, maximumItems, maximumLength = 220) {
  if (!Array.isArray(values)) return [];
  const unique = new Set();
  for (const value of values) {
    const text = cleanText(value, maximumLength);
    if (text) unique.add(text);
    if (unique.size >= maximumItems) break;
  }
  return [...unique];
}

function speakingHelp(speaking) {
  const help = speaking?.help;
  if (Array.isArray(help)) return cleanList(help, 4).join(" ");
  return cleanText(help);
}

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function readCourseMap() {
  const value = await readJson(new URL("modules.json", contentRoot));
  return {
    modules: Array.isArray(value?.modules) ? value.modules : [],
    titles: Array.isArray(value?.titles) ? value.titles : [],
  };
}

async function readLecture(number) {
  if (!Number.isInteger(number) || number < 1 || number > 999) return null;
  const id = `lecture-${String(number).padStart(2, "0")}`;
  try {
    return { id, data: await readJson(new URL(`lectures/${id}.json`, contentRoot)) };
  } catch {
    return null;
  }
}

function normaliseLecture(lecture, courseModule, title) {
  const data = lecture.data;
  if (!data?.practice?.speaking || !data?.practice?.pronunciation) return null;
  return {
    id: lecture.id,
    kind: "episode",
    number: data.number,
    level: cleanText(courseModule?.level, 12) || "A0",
    title: cleanText(title || courseModule?.title, 160) || `Episode ${data.number}`,
    objectives: cleanList(data.objectives, 4),
    phrases: cleanList(
      data.presentation?.hero?.chunks?.map((item) => item?.fi),
      10,
    ),
    dialogue: cleanList(data.dialogue?.map((item) => item?.fi), 8),
    speaking: {
      prompt: cleanText(data.practice.speaking.prompt),
      help: speakingHelp(data.practice.speaking),
    },
    pronunciation: {
      text: cleanText(data.practice.pronunciation.text, 1_000),
      tip: cleanText(data.practice.pronunciation.tip, 700),
    },
  };
}

async function resolveEpisode(number, course) {
  const lecture = await readLecture(number);
  if (!lecture) return null;
  const courseModule = course.modules.find(
    (item) => number >= item.first && number <= item.last,
  );
  if (!courseModule) return null;
  return normaliseLecture(lecture, courseModule, course.titles[number - 1]);
}

async function resolveModule(number, course) {
  const courseModule = course.modules.find((item) => item.number === number);
  if (!courseModule) return null;
  const first = Number(courseModule.first);
  const last = Number(courseModule.last);
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first || last - first > 99) return null;

  const lectures = (
    await Promise.all(
      Array.from({ length: last - first + 1 }, (_, index) => readLecture(first + index)),
    )
  ).filter(Boolean);
  const normalised = lectures
    .map((lecture) =>
      normaliseLecture(
        lecture,
        courseModule,
        course.titles[Number(lecture.data.number) - 1],
      ),
    )
    .filter(Boolean);
  if (!normalised.length) return null;

  return {
    id: `module-${String(number).padStart(2, "0")}`,
    kind: "module",
    number,
    level: cleanText(courseModule.level, 12) || normalised[0].level,
    title: cleanText(courseModule.title, 160) || `Module ${number}`,
    objectives: cleanList(
      [courseModule.outcome, ...normalised.flatMap((item) => item.objectives)],
      6,
    ),
    phrases: cleanList(normalised.flatMap((item) => item.phrases), 16),
    dialogue: cleanList(normalised.flatMap((item) => item.dialogue), 12),
    speaking: {
      prompt:
        cleanText(courseModule.outcome) || normalised[0].speaking.prompt,
      help: cleanList(normalised.map((item) => item.speaking.help), 6).join(" "),
    },
    pronunciation: {
      text: cleanList(normalised.map((item) => item.pronunciation.text), 6, 1_000).join(" "),
      tip: cleanList(normalised.map((item) => item.pronunciation.tip), 6, 700).join(" "),
    },
  };
}

/**
 * Resolve a browser-supplied stable ID into bounded, server-owned curriculum.
 * Raw prompts and filesystem paths are never accepted from the client.
 */
export async function resolveVoiceLiveContext(contextId) {
  if (typeof contextId !== "string") return null;
  try {
    const course = await readCourseMap();
    const episodeMatch = /^(?:lecture|episode)-(\d{1,3})$/.exec(contextId);
    if (episodeMatch) return resolveEpisode(Number(episodeMatch[1]), course);
    const moduleMatch = /^module-(\d{1,3})$/.exec(contextId);
    if (moduleMatch) return resolveModule(Number(moduleMatch[1]), course);
    return null;
  } catch {
    return null;
  }
}
