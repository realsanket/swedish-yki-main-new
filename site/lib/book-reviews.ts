export type BookReview = {
  number: number;
  title: string;
  focus: string;
  topics: readonly string[];
  touchpoints: readonly number[];
  anchorEpisode: number;
  storyBridge: string;
  href: string;
};

/**
 * The reference books informed the progression, but their pages are not
 * republished inside Stigen. All learner-facing tasks are original.
 */
export const bookReviews: readonly BookReview[] = [];

export function bookReviewsForAnchorEpisode(episodeNumber: number) {
  return bookReviews.filter((review) => review.anchorEpisode === episodeNumber);
}

export function bookReviewForNumber(number: number) {
  return bookReviews.find((review) => review.number === number);
}
