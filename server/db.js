import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDb(path = process.env.DB_PATH || "./data/roz.db") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, nick TEXT NOT NULL UNIQUE COLLATE NOCASE,
      token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')),
      xp INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0, last_played TEXT
    );
    CREATE TABLE IF NOT EXISTS attempts (
      user_id INTEGER NOT NULL REFERENCES users(id), day TEXT NOT NULL,
      started_ms INTEGER NOT NULL, finished_ms INTEGER,
      answers TEXT NOT NULL DEFAULT '{}', correct INTEGER,
      PRIMARY KEY (user_id, day)
    );
    -- Append-only: every point a user ever earned, and why.
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
      day TEXT NOT NULL, kind TEXT NOT NULL, points INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS ledger_day ON ledger(day);
    CREATE TABLE IF NOT EXISTS badges (
      user_id INTEGER NOT NULL REFERENCES users(id), badge TEXT NOT NULL,
      earned_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, badge)
    );
  `);
  return db;
}
