import type { StoryCharacterName } from "@/lib/story-world";

export type SpeechLanguage = "sv" | "en";

export type CharacterVoiceProfile = {
  azureVoices: Record<SpeechLanguage, string>;
  normalRate: string;
  slowRate: string;
  description: string;
};

/**
 * Casting is explicit per language. Multilingual voices preserve the same
 * persona where their Swedish output passes review; a native sv-SE voice can
 * be selected independently when it gives clearer Swedish.
 */
export const characterVoiceProfiles = {
  Alex: {
    azureVoices: {
      sv: "en-US-BrianMultilingualNeural",
      en: "en-US-BrianMultilingualNeural",
    },
    normalRate: "0%",
    slowRate: "-24%",
    description: "Open newcomer voice for first attempts and everyday tasks",
  },
  Elin: {
    azureVoices: {
      sv: "en-US-AvaMultilingualNeural",
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
