// Keep this list limited to characters that have passed the introduction gate
// in docs/character-mapping.md. Source-book names are not runtime characters.
export const storyCharacterNames = ["Alex", "Aino", "Sami"] as const;

export type StoryCharacterName = (typeof storyCharacterNames)[number];

export const storyCharacters: Record<StoryCharacterName, {
  name: StoryCharacterName;
  role: string;
  image: string;
}> = {
  Alex: {
    name: "Alex",
    role: "the learner",
    image: "/images/onboarding/characters/alex.webp",
  },
  Aino: {
    name: "Aino",
    role: "the friend",
    image: "/images/onboarding/characters/aino.webp",
  },
  Sami: {
    name: "Sami",
    role: "the teacher",
    image: "/images/onboarding/characters/sami.webp",
  },
};

export type StoryChapter = {
  number: number;
  title: string;
  setting: string;
  summary: string;
  cast: readonly StoryCharacterName[];
  art: string;
};

export const storyChapters: Record<number, StoryChapter> = {
  1: {
    number: 1,
    title: "The first class",
    setting: "A community class and a first Swedish conversation",
    summary:
      "Alex meets Aino and learns to share a name, home, origin, and languages before noticing the sounds inside those useful phrases.",
    cast: ["Alex", "Aino", "Sami"],
    art: "/images/story/chapters/chapter-01-first-class.webp",
  },
};

const fallbackStoryChapter: StoryChapter = {
  number: 1,
  title: "The first class",
  setting: "A community class and a first Swedish conversation",
  summary:
    "Begin with one useful conversation and build the sounds one step at a time.",
  cast: ["Alex", "Aino", "Sami"],
  art: "/images/story/chapters/chapter-01-first-class.webp",
};

export function storyChapterForModule(moduleNumber: number): StoryChapter {
  return storyChapters[moduleNumber] ?? fallbackStoryChapter;
}

export function storyCharacterForSpeaker(speaker: string) {
  const match = (Object.keys(storyCharacters) as StoryCharacterName[]).find(
    (name) => name.toLocaleLowerCase() === speaker.trim().toLocaleLowerCase(),
  );
  return match ? storyCharacters[match] : null;
}

const episodeArtwork: Record<number, string> = {
  1: "episode-01-sound-workshop.webp",
};

const episodeObjects: Record<number, string> = {
  1: "sound cards",
};

export function storyArtForLecture(lectureNumber: number) {
  const artwork = episodeArtwork[lectureNumber];
  return artwork
    ? `/images/story/episodes/${artwork}`
    : "/images/story/episodes/episode-01-sound-workshop.webp";
}

export function storyObjectForLecture(lectureNumber: number) {
  return episodeObjects[lectureNumber] ?? "a useful clue";
}
