import { index, integer, primaryKey, real, uniqueIndex, sqliteTable, text } from "drizzle-orm/sqlite-core";

// All keys include the authenticated owner. The API never accepts an owner ID.
export const learnerProfiles = sqliteTable("learner_profiles", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull().default("Learner"),
  dailyGoal: integer("daily_goal").notNull().default(15),
  level: text("level").notNull().default("A0"),
  updatedAt: integer("updated_at").notNull(),
});

// A single immutable event is the source of truth for an award and its activity.
// Stable completion/practice IDs make retries idempotent without double awards.
export const studyEvents = sqliteTable("study_events", {
  userId: text("user_id").notNull(),
  id: text("id").notNull(),
  kind: text("kind").notNull(),
  subject: text("subject").notNull(),
  score: real("score"),
  day: text("day").notNull(),
  createdAt: integer("created_at").notNull(),
  minutes: integer("minutes").notNull().default(0),
  xp: integer("xp").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.userId, table.id] }),
  index("study_events_owner_day_idx").on(table.userId, table.day),
]);

export const learnerReviews = sqliteTable("learner_reviews", {
  userId: text("user_id").notNull(),
  wordId: text("word_id").notNull(),
  interval: real("interval").notNull(),
  ease: real("ease").notNull(),
  due: integer("due").notNull(),
  repetitions: integer("repetitions").notNull(),
  revision: integer("revision").notNull().default(0),
  lastEventId: text("last_event_id").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.wordId] })]);

// New course state is additive: legacy lessons, reviews and awards stay intact.
export const lectureState = sqliteTable("lecture_state", {
  userId: text("user_id").notNull(),
  lectureId: text("lecture_id").notNull(),
  state: text("state").notNull(),
  revision: integer("revision").notNull(),
  lastMutationId: text("last_mutation_id").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.lectureId] })]);

// Request hashes retain retry safety without duplicating private drafts.
export const courseMutations = sqliteTable("course_mutations", {
  userId: text("user_id").notNull(),
  mutationId: text("mutation_id").notNull(),
  lectureId: text("lecture_id").notNull(),
  requestHash: text("request_hash").notNull(),
  attemptId: text("attempt_id"),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.mutationId] }),
  uniqueIndex("course_attempt_owner_id_idx").on(table.userId, table.attemptId),
]);
