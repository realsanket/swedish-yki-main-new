import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "progress.db");

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS learner_profiles (
  user_id text PRIMARY KEY NOT NULL,
  name text DEFAULT 'Learner' NOT NULL,
  daily_goal integer DEFAULT 15 NOT NULL,
  level text DEFAULT 'A0' NOT NULL,
  updated_at integer NOT NULL
);
CREATE TABLE IF NOT EXISTS learner_reviews (
  user_id text NOT NULL,
  word_id text NOT NULL,
  interval real NOT NULL,
  ease real NOT NULL,
  due integer NOT NULL,
  repetitions integer NOT NULL,
  revision integer DEFAULT 0 NOT NULL,
  last_event_id text NOT NULL,
  PRIMARY KEY(user_id, word_id)
);
CREATE TABLE IF NOT EXISTS study_events (
  user_id text NOT NULL,
  id text NOT NULL,
  kind text NOT NULL,
  subject text NOT NULL,
  score real,
  day text NOT NULL,
  created_at integer NOT NULL,
  minutes integer DEFAULT 0 NOT NULL,
  xp integer DEFAULT 0 NOT NULL,
  PRIMARY KEY(user_id, id)
);
CREATE INDEX IF NOT EXISTS study_events_owner_day_idx ON study_events (user_id, day);
CREATE TABLE IF NOT EXISTS course_mutations (
  user_id text NOT NULL,
  mutation_id text NOT NULL,
  lecture_id text NOT NULL,
  request_hash text NOT NULL,
  attempt_id text,
  created_at integer NOT NULL,
  PRIMARY KEY(user_id, mutation_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS course_attempt_owner_id_idx ON course_mutations (user_id, attempt_id);
CREATE TABLE IF NOT EXISTS lecture_state (
  user_id text NOT NULL,
  lecture_id text NOT NULL,
  state text NOT NULL,
  revision integer NOT NULL,
  last_mutation_id text NOT NULL,
  updated_at integer NOT NULL,
  PRIMARY KEY(user_id, lecture_id)
);
`;

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(SCHEMA_SQL);
  return _db;
}
