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
      started_ms INTEGER NOT NULL, q_served_ms INTEGER, finished_ms INTEGER,
      answers TEXT NOT NULL DEFAULT '{}', correct INTEGER,
      PRIMARY KEY (user_id, day)
    );
    -- Append-only: every point a user ever earned, and why.
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
      day TEXT NOT NULL, kind TEXT NOT NULL, points INTEGER NOT NULL,
      prev_hash TEXT, hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS ledger_day ON ledger(day);
    CREATE INDEX IF NOT EXISTS ledger_user ON ledger(user_id, id);
    CREATE TABLE IF NOT EXISTS badges (
      user_id INTEGER NOT NULL REFERENCES users(id), badge TEXT NOT NULL,
      earned_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, badge)
    );
    -- Anti-abuse: per-IP signup caps and anomaly detection logging
    CREATE TABLE IF NOT EXISTS ip_signups (
      ip TEXT NOT NULL, day TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS ip_signups_day ON ip_signups(ip, day);
    CREATE TABLE IF NOT EXISTS flags (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
      day TEXT NOT NULL, reason TEXT NOT NULL, detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS flags_user_day ON flags(user_id, day);

    -- Spaced Repetition (Leitner boxes) for personal vocabulary practice
    CREATE TABLE IF NOT EXISTS word_stats (
      user_id INTEGER NOT NULL REFERENCES users(id),
      item_id TEXT NOT NULL,
      box INTEGER NOT NULL DEFAULT 1,
      due_day TEXT NOT NULL,
      PRIMARY KEY (user_id, item_id)
    );
    CREATE INDEX IF NOT EXISTS word_stats_due ON word_stats(user_id, due_day);
  `);
  try { db.exec("ALTER TABLE attempts ADD COLUMN q_served_ms INTEGER;"); } catch {}
  try { db.exec("ALTER TABLE ledger ADD COLUMN prev_hash TEXT;"); } catch {}
  try { db.exec("ALTER TABLE ledger ADD COLUMN hash TEXT;"); } catch {}
  return db;
}
