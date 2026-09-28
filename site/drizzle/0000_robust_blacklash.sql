CREATE TABLE `learner_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Learner' NOT NULL,
	`daily_goal` integer DEFAULT 15 NOT NULL,
	`level` text DEFAULT 'A0' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learner_reviews` (
	`user_id` text NOT NULL,
	`word_id` text NOT NULL,
	`interval` real NOT NULL,
	`ease` real NOT NULL,
	`due` integer NOT NULL,
	`repetitions` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_event_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `word_id`)
);
--> statement-breakpoint
CREATE TABLE `study_events` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`subject` text NOT NULL,
	`score` real,
	`day` text NOT NULL,
	`created_at` integer NOT NULL,
	`minutes` integer DEFAULT 0 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE INDEX `study_events_owner_day_idx` ON `study_events` (`user_id`,`day`);