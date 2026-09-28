import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import type { BookReview } from "@/lib/book-reviews";

export default function BookReviewBridge({
  review,
  onOpen,
}: {
  review: BookReview;
  onOpen: () => void;
}) {
  return (
    <section className="book-review-bridge" aria-label={`Optional review for ${review.title}`}>
      <div className="book-review-bridge-icon" aria-hidden="true">
        <BookOpen size={22} />
      </div>
      <div className="book-review-bridge-copy">
        <p className="eyebrow">COMPANION SCENE · OPTIONAL</p>
        <h3>
          Chapter {String(review.number).padStart(2, "0")} · {review.title}
        </h3>
        <p>{review.storyBridge}</p>
        <div className="book-review-topics" aria-label="Review topics">
          {review.topics.map((topic) => (
            <span key={topic}>
              <Sparkles size={12} /> {topic}
            </span>
          ))}
        </div>
      </div>
      <button type="button" className="secondary" onClick={onOpen}>
        Open inside your path <ArrowRight size={16} />
      </button>
    </section>
  );
}
