import type { Word } from "./curriculum.ts";
import coreWordsData from "../content/core-words.json";

/**
 * Frequent A1-B1 words the lectures do not teach, from the Swedish Kelly list
 * (Språkbanken, CC BY-SA). They enter review only when the learner starts them.
 * Kept out of lib/course so the large list loads only with the word bank.
 */
export type CoreWord = Word & { theme: string };
export const coreWords = coreWordsData as CoreWord[];
