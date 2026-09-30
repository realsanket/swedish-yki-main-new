import { lessons, examTasks, type Level } from "./curriculum.ts";
import { getLecture } from "./course.ts";

export type TrustedPracticeTask = {
  id: string;
  level: Level;
  prompt: string;
  help: string;
  model?: string;
  /** YKI-style writing details, when the lecture's task has them. */
  situation?: string;
  points?: string[];
  wordRange?: number[];
  pronunciation?: { text: string; tip: string };
};
/** One trusted resolver for new lectures, existing lesson bookmarks and exam tasks. */
export function resolvePracticeTask(id: string, skill: "speaking" | "writing", exam = false): TrustedPracticeTask | undefined {
  if (exam) {
    const task = examTasks.find(task => task.id === id && task.skill === skill);
    return task ? { id, level: "B1", prompt: task.prompt, help: task.help, model: task.model } : undefined;
  }
  const lecture = getLecture(id);
  if (lecture)
    return {
      id,
      level: lecture.level,
      ...lecture[skill],
      pronunciation: lecture.pronunciation,
    };
  const lesson = lessons.find(lesson => lesson.id === id);
  return lesson ? { id, level: lesson.level, ...lesson[skill] } : undefined;
}
