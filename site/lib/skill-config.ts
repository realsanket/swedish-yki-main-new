import { Headphones, Mic, BookOpen, PenLine } from "lucide-react";
import type { Skill } from "./course-types.ts";

export const SKILL_CONFIG: Record<Skill, { title: string; swedish: string; icon: typeof Headphones; description: string }> = {
  listening: { title: "Listening", swedish: "Hörförståelse", icon: Headphones, description: "Tune your ear to everyday Swedish. Listen for the message first." },
  speaking:  { title: "Speaking",  swedish: "Muntlig färdighet", icon: Mic, description: "Small sentences build confidence. Say it out loud, then try once more." },
  reading:   { title: "Reading", swedish: "Läsförståelse", icon: BookOpen, description: "Find the important details in messages you could see in real life." },
  writing:   { title: "Writing", swedish: "Skriftlig färdighet", icon: PenLine, description: "Make yourself understood, one useful message at a time." },
};
