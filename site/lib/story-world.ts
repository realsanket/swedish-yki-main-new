import modulesData from "../content/modules.json";
import type { CourseModule, LectureContent } from "./course-types";

// Keep this list limited to characters that have passed the introduction gate
// in docs/character-mapping.md. Source-book names are not runtime characters.
export const storyCharacterNames = ["Alex", "Elin", "Henrik", "Maja"] as const;

export type StoryCharacterName = (typeof storyCharacterNames)[number];

export const storyCharacters: Record<StoryCharacterName, {
  name: StoryCharacterName;
  role: string;
  image: string;
}> = {
  Alex: {
    name: "Alex",
    role: "the newcomer",
    image: "/images/onboarding/characters/alex.webp",
  },
  Elin: {
    name: "Elin",
    role: "the local friend",
    image: "/images/onboarding/characters/elin.webp",
  },
  Henrik: {
    name: "Henrik",
    role: "the language coach",
    image: "/images/onboarding/characters/henrik.webp",
  },
  Maja: {
    name: "Maja",
    role: "the student viewpoint",
    image: "/images/onboarding/characters/maja.webp",
  },
};

export type StoryChapter = {
  number: number;
  title: string;
  setting: string;
  summary: string;
  cast: readonly string[];
  art: string | null;
};

/** Story data belongs to the module, including explicit absence of artwork. */
export function storyChapterForModule(moduleNumber?: number): StoryChapter {
  const module = (modulesData.modules as CourseModule[]).find((item) => item.number === moduleNumber);
  return {
    number: module?.number ?? 0,
    title: module?.story?.title ?? "Your Swedish story",
    setting: module?.story?.setting ?? "An everyday Swedish conversation",
    summary: module?.story?.summary ?? "Listen, try a useful phrase, and make it your own.",
    cast: module?.story?.cast ?? [],
    art: module?.story?.art ?? null,
  };
}

/** An episode may narrow the chapter cast to its own scene. */
export function storyCastForLecture(lecture: Pick<LectureContent, "story" | "dialogue">) {
  return lecture.story?.cast ?? [...new Set(lecture.dialogue?.map((line) => line.speaker) ?? [])];
}

export function storyCharacterForSpeaker(speaker: string) {
  const match = (Object.keys(storyCharacters) as StoryCharacterName[]).find(
    (name) => name.toLocaleLowerCase() === speaker.trim().toLocaleLowerCase(),
  );
  return match ? storyCharacters[match] : null;
}

export function storyArtForLecture(lecture: Pick<LectureContent, "story">) {
  return lecture.story?.art ?? null;
}

export function storyObjectForLecture(lecture: Pick<LectureContent, "story">) {
  return lecture.story?.object ?? null;
}
