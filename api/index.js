import { createApp } from "../server/app.js";
import { openDb } from "../server/db.js";
import { resolve } from "node:path";

// On Vercel serverless, SQLite runs in /tmp
const dbPath = process.env.VERCEL ? "/tmp/roz.db" : process.env.DB_PATH || "./data/roz.db";
const db = openDb(dbPath);
const app = createApp(db, { publicDir: resolve("public") });

export default function handler(req, res) {
  return app(req, res);
}
