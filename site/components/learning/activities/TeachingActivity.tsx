"use client";

import type { TeachingActivity as TeachingActivityData } from "@/lib/course-types";
import MatchActivity from "./MatchActivity";
import SortActivity from "./SortActivity";
import SoundMapActivity from "./SoundMapActivity";
import styles from "./TeachingActivity.module.css";

export const DEFAULT_ACTIVITY_LABEL = "Play with it";

/**
 * Renders the optional hands-on activity of one teaching section. The activity
 * type comes from lecture content; add a new type in `course-types.ts` and a
 * case here rather than branching on a lecture number.
 */
export default function TeachingActivity({ activity }: { activity: TeachingActivityData }) {
  return (
    <section className={styles.activity} aria-label={activity.title}>
      {/* The teaching beat header already shows the label and instructions. */}
      <header className={styles.header}>
        <h4>{activity.title}</h4>
      </header>
      {activity.type === "sound-map" && <SoundMapActivity activity={activity} />}
      {activity.type === "sort" && <SortActivity activity={activity} />}
      {activity.type === "match" && <MatchActivity activity={activity} />}
    </section>
  );
}
