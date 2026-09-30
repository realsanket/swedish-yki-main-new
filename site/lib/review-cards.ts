import { lectures } from "./course.ts";
import type { CourseProgressData } from "./course-progress.ts";
import type { ReviewState } from "./progress.ts";

/**
 * Spaced review beyond single words. Phrase cards prompt in English and are
 * answered aloud in Swedish (productive recall). A return card brings a
 * lecture's whole task back from memory about a day after it is finished,
 * then at growing intervals. Both use the same scheduler as the word bank.
 */
export type ReviewCard = {
  id: string;
  kind: "phrase" | "return";
  lectureId: string;
  lectureNumber: number;
  lectureTitle: string;
  prompt: string;
  answer: string;
};

const DAY = 24 * 60 * 60 * 1000;

export const reviewCards: ReviewCard[] = lectures.flatMap((lecture) => [
  ...(lecture.reviewPhrases ?? []).map((phrase): ReviewCard => ({
    id: `phrase-${lecture.id}-${phrase.id}`,
    kind: "phrase",
    lectureId: lecture.id,
    lectureNumber: lecture.number,
    lectureTitle: lecture.title,
    prompt: phrase.en,
    answer: phrase.fi,
  })),
  {
    id: `return-${lecture.id}`,
    kind: "return",
    lectureId: lecture.id,
    lectureNumber: lecture.number,
    lectureTitle: lecture.title,
    prompt: lecture.route.returnPrompt,
    answer: lecture.speaking.model,
  },
]);

export const reviewCardIds = new Set(reviewCards.map((card) => card.id));

type Reviews = Record<string, ReviewState>;

/**
 * A card is in the learner's review once its lecture has taught it, or once
 * the learner has practised it by choice (from "Practise these now").
 */
export function cardUnlocked(card: ReviewCard, course: CourseProgressData | undefined, reviews?: Reviews) {
  if (reviews?.[card.id]) return true;
  const state = course?.lectures[card.lectureId];
  if (!state) return false;
  return card.kind === "phrase" ? state.completedParts.includes("teach") : Boolean(state.completedAt);
}

/** Each lecture's phrase cards, for starting practice before they unlock. */
export function phraseCardsByLecture() {
  return lectures
    .map((lecture) => ({
      lectureId: lecture.id,
      number: lecture.number,
      title: lecture.title,
      cards: reviewCards.filter((card) => card.lectureId === lecture.id && card.kind === "phrase"),
    }))
    .filter((group) => group.cards.length > 0);
}

export function cardDue(card: ReviewCard, course: CourseProgressData | undefined, reviews: Reviews, now: number) {
  if (!cardUnlocked(card, course, reviews)) return false;
  const review = reviews[card.id];
  if (review) return review.due <= now;
  if (card.kind === "phrase") return true;
  // The first return comes a day after the lecture is finished.
  const finished = Date.parse(course?.lectures[card.lectureId]?.completedAt ?? "");
  return Number.isFinite(finished) && now >= finished + DAY;
}

/** Due cards: return tasks first, then phrases, oldest lecture first. */
export function dueCards(course: CourseProgressData | undefined, reviews: Reviews, now: number) {
  return reviewCards
    .filter((card) => cardDue(card, course, reviews, now))
    .sort((a, b) => (a.kind === b.kind ? a.lectureNumber - b.lectureNumber : a.kind === "return" ? -1 : 1));
}

/**
 * Earlier lectures' phrases for a warm-up: the ones most in need of a return
 * first (due, then never practised, then least practised).
 */
export function warmUpCards(lectureNumber: number, course: CourseProgressData | undefined, reviews: Reviews, now: number, count = 3) {
  const rank = (card: ReviewCard) => {
    const review = reviews[card.id];
    if (!review) return 1;
    return review.due <= now ? 0 : 2 + review.repetitions;
  };
  return reviewCards
    .filter((card) => card.kind === "phrase" && card.lectureNumber < lectureNumber && cardUnlocked(card, course, reviews))
    .sort((a, b) => rank(a) - rank(b) || b.lectureNumber - a.lectureNumber)
    .slice(0, count);
}

/** Per lecture: how many phrases are remembered, due, or not yet practised. */
export function memoryByLecture(course: CourseProgressData | undefined, reviews: Reviews, now: number) {
  return lectures
    .map((lecture) => {
      const cards = reviewCards.filter((card) => card.lectureId === lecture.id && card.kind === "phrase");
      const unlocked = cards.filter((card) => cardUnlocked(card, course, reviews));
      const remembered = unlocked.filter((card) => {
        const review = reviews[card.id];
        return review && review.repetitions > 0 && review.due > now;
      }).length;
      const practised = unlocked.filter((card) => reviews[card.id]).length;
      return {
        lectureId: lecture.id,
        number: lecture.number,
        title: lecture.title,
        total: cards.length,
        unlocked: unlocked.length,
        remembered,
        due: practised - remembered,
        fresh: cards.length - practised,
      };
    })
    .filter((row) => row.unlocked > 0);
}

/** This lecture's own phrases, most in need of practice first (for part 2). */
export function lectureRecallCards(lectureId: string, reviews: Reviews, now = Date.now(), count = 3) {
  const rank = (card: ReviewCard) => {
    const review = reviews[card.id];
    if (!review) return 1;
    return review.due <= now ? 0 : 2 + review.repetitions;
  };
  return reviewCards
    .filter((card) => card.kind === "phrase" && card.lectureId === lectureId)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, count);
}
