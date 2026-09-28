CREATE TABLE `course_mutations` (
	`user_id` text NOT NULL,
	`mutation_id` text NOT NULL,
	`lecture_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`attempt_id` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `mutation_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_attempt_owner_id_idx` ON `course_mutations` (`user_id`,`attempt_id`);--> statement-breakpoint
CREATE TABLE `lecture_state` (
	`user_id` text NOT NULL,
	`lecture_id` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer NOT NULL,
	`last_mutation_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `lecture_id`)
);
