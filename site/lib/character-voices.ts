import type { StoryCharacterName } from "@/lib/story-world";

export type SpeechLanguage = "sv" | "en";

export type CharacterVoiceProfile = {
  azureVoices: Record<SpeechLanguage, string>;
  normalRate: string;
  slowRate: string;
  /** Optional SSML pitch, to tell two characters on one voice apart. */
  pitch?: string;
  description: string;
};

/**
 * Casting is explicit per language. Every Swedish line is a model the
 * learner copies, so Swedish always uses a native sv-SE voice (Azure has
 * Sofie, Hillevi and Mattias; there is no Finland-Swedish voice). English
 * explanations keep multilingual voices. Two characters on the same voice
 * are told apart by pitch.
 */
export const characterVoiceProfiles = {
  Alex: {
    azureVoices: {
      sv: "sv-SE-MattiasNeural",
      en: "en-US-BrianMultilingualNeural",
    },
    normalRate: "+3%",
    slowRate: "-22%",
    // Same native voice as Henrik; a higher pitch keeps them distinct.
    pitch: "+9%",
    description: "Open newcomer voice for first attempts and everyday tasks",
  },
  Elin: {
    azureVoices: {
      sv: "sv-SE-HilleviNeural",
      en: "en-US-AvaMultilingualNeural",
    },
    normalRate: "+2%",
    slowRate: "-22%",
    description: "Warm local-friend voice for natural everyday conversation",
  },
  Henrik: {
    azureVoices: {
      sv: "sv-SE-MattiasNeural",
      en: "en-US-AndrewMultilingualNeural",
    },
    normalRate: "-6%",
    slowRate: "-28%",
    pitch: "-4%",
    description: "Calm language-coach voice with a native Swedish model",
  },
  Maja: {
    azureVoices: {
      sv: "sv-SE-SofieNeural",
      en: "en-US-EmmaMultilingualNeural",
    },
    normalRate: "+2%",
    slowRate: "-22%",
    description: "Young student voice for school, friends, plans, and opinions",
  },
} satisfies Record<StoryCharacterName, CharacterVoiceProfile>;

export const speechLocales: Record<SpeechLanguage, string> = {
  sv: "sv-SE",
  en: "en-GB",
};
