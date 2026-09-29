import type { StoryCharacterName } from "@/lib/story-world";

export type SpeechLanguage = "sv" | "en";

export type CharacterVoiceProfile = {
  azureVoice: string;
  normalRate: string;
  slowRate: string;
  description: string;
};

/**
 * One multilingual Azure voice per character keeps the persona recognisable
 * when the learner switches between Swedish and English support.
 */
export const characterVoiceProfiles = {
  Alex: {
    azureVoice: "en-US-BrianMultilingualNeural",
    normalRate: "0%",
    slowRate: "-24%",
    description: "Open and conversational learner voice",
  },
  Aino: {
    azureVoice: "en-US-AvaMultilingualNeural",
    normalRate: "+2%",
    slowRate: "-22%",
    description: "Warm and responsive conversation-partner voice",
  },
  Sami: {
    azureVoice: "en-US-AndrewMultilingualNeural",
    normalRate: "-6%",
    slowRate: "-28%",
    description: "Calm, measured teacher voice",
  },
} satisfies Record<StoryCharacterName, CharacterVoiceProfile>;

export const speechLocales: Record<SpeechLanguage, string> = {
  sv: "sv-SE",
  en: "en-GB",
};
