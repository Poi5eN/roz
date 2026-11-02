import { createHash, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import {
  BADGES, MIN_SECONDS_PER_QUESTION, QUESTIONS_PER_DAY, dailyQuestions, earnedBadges, istDay,
  levelFor, liveStreak, nextStreak, pointsFor, publicView, weekStart, addDays, isSunday
} from "./game.js";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

export function createApp(db, { now = () => Date.now(), publicDir = "public" } = {}) {
  const q = (sql) => db.prepare(sql);
  const hits = new Map(); // naive per-IP rate limit: 120 req / minute

  function limit(ip) {
    const minute = Math.floor(now() / 60000), h = hits.get(ip);
    if (!h || h.minute !== minute) { hits.set(ip, { minute, n: 1 }); return; }
    if (++h.n > 120) throw new HttpError(429, "Too many requests. Please wait a minute.");
  }
  function auth(req) {
    const t = (req.headers.authorization || "").replace(/^Bearer /, "");
    const u = t && q("SELECT * FROM users WHERE token_hash = ?").get(sha(t));
    if (!u) throw new HttpError(401, "Please sign in again.");
    return u;
  }
  const finishedDays = (id) => q("SELECT COUNT(*) c FROM attempts WHERE user_id=? AND finished_ms IS NOT NULL").get(id).c;

  function me(u) {
    const today = istDay(now());
    const a = q("SELECT * FROM attempts WHERE user_id=? AND day=?").get(u.id, today);
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const played = new Set(q("SELECT day FROM attempts WHERE user_id=? AND finished_ms IS NOT NULL AND day>=?").all(u.id, days[0]).map((r) => r.day));
    return {
      nick: u.nick, xp: u.xp, ...levelFor(u.xp), bestStreak: u.best_streak,
      streak: liveStreak(u.last_played, today, u.streak), today, isSunday: isSunday(today),
      doneToday: !!(a && a.finished_ms), correctToday: a?.correct ?? null,
      week: days.map((d) => ({ day: d, played: played.has(d) })),
      badges: Object.entries(BADGES).map(([id, b]) => ({ id, ...b,
        earned: !!q("SELECT 1 FROM badges WHERE user_id=? AND badge=?").get(u.id, id) }))
    };
  }

  const routes = {
    "POST /api/join": (req, body) => {
      const nick = String(body.nick || "").trim().replace(/\s+/g, " ");
      if (!/^[A-Za-z0-9_ ]{3,16}$/.test(nick)) throw new HttpError(400, "Name: 3-16 letters or numbers.");
      const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
      const day = istDay(now());
      const signups = q("SELECT COUNT(*) c FROM ip_signups WHERE ip=? AND day=?").get(ip, day).c;
      if (signups >= 5) throw new HttpError(429, "Maximum account limit reached for this network today (max 5 accounts per day).");
      const token = randomBytes(24).toString("hex");
      try {
        q("INSERT INTO users (nick, token_hash) VALUES (?, ?)").run(nick, sha(token));
        q("INSERT INTO ip_signups (ip, day) VALUES (?, ?)").run(ip, day);
      } catch {
        throw new HttpError(409, "That name is taken. Try another.");
      }
      return { token };
    },
    "GET /api/me": (req) => me(auth(req)),

    // Starting the day records the start time (used for the too-fast check). Answer keys never leave the server.
    "GET /api/daily": (req) => {
      const u = auth(req), day = istDay(now());
      let a = q("SELECT * FROM attempts WHERE user_id=? AND day=?").get(u.id, day);
      if (a?.finished_ms) return { done: true };
      if (!a) {
        q("INSERT INTO attempts (user_id, day, started_ms, q_served_ms) VALUES (?,?,?,?)").run(u.id, day, now(), now());
      } else if (!a.q_served_ms) {
        q("UPDATE attempts SET q_served_ms=? WHERE user_id=? AND day=?").run(now(), u.id, day);
      }
      a = q("SELECT * FROM attempts WHERE user_id=? AND day=?").get(u.id, day);
      return { done: false, day, questions: publicView(dailyQuestions(day)), answered: JSON.parse(a.answers) };
    },
    "POST /api/answer": (req, body) => {
      const u = auth(req), day = istDay(now());
      const a = q("SELECT * FROM attempts WHERE user_id=? AND day=?").get(u.id, day);
      if (!a || a.finished_ms) throw new HttpError(409, "Start today's game first.");
      const servedAt = a.q_served_ms || a.started_ms;
      if (now() - servedAt < 400) throw new HttpError(429, "Answer submitted too fast (minimum 400 ms).");
      const question = dailyQuestions(day).find((x) => x.id === body.qid);
      if (!question || !question.options.some((o) => o.id === body.optionId)) throw new HttpError(400, "Bad answer.");
      const answers = JSON.parse(a.answers);
      if (answers[question.id]) throw new HttpError(409, "Already answered.");
      const correct = body.optionId === question.correctId;
      answers[question.id] = { optionId: body.optionId, correct };
      q("UPDATE attempts SET answers=?, q_served_ms=? WHERE user_id=? AND day=?").run(JSON.stringify(answers), now(), u.id, day);
      return { correct, correctId: question.correctId };
    },
    "POST /api/finish": (req) => {
      const u = auth(req), day = istDay(now());
      const a = q("SELECT * FROM attempts WHERE user_id=? AND day=?").get(u.id, day);
      if (!a || a.finished_ms) throw new HttpError(409, "Nothing to finish.");
      const answers = JSON.parse(a.answers);
      if (Object.keys(answers).length < QUESTIONS_PER_DAY) throw new HttpError(409, "Answer all questions first.");
      const secs = (now() - a.started_ms) / 1000;
      if (secs < QUESTIONS_PER_DAY * MIN_SECONDS_PER_QUESTION) {
        q("INSERT INTO flags (user_id, day, reason, detail) VALUES (?, ?, ?, ?)").run(
          u.id, day, "too_fast_finish",
          JSON.stringify({ secs, minSecs: QUESTIONS_PER_DAY * MIN_SECONDS_PER_QUESTION })
        );
        throw new HttpError(429, "That was too fast to be real. Try again tomorrow.");
      }

      const correct = Object.values(answers).filter((x) => x.correct).length;
      const streak = nextStreak(u.last_played, day, u.streak);
      const lines = pointsFor(correct, streak, day);
      const total = lines.reduce((s, l) => s + l.points, 0);
      const xp = u.xp + total;

      db.exec("BEGIN");
      try { // all-or-nothing: points, streak and badges move together
        q("UPDATE attempts SET finished_ms=?, correct=? WHERE user_id=? AND day=?").run(now(), correct, u.id, day);
        for (const l of lines) q("INSERT INTO ledger (user_id, day, kind, points) VALUES (?,?,?,?)").run(u.id, day, l.kind, l.points);
        q("UPDATE users SET xp=?, streak=?, best_streak=MAX(best_streak,?), last_played=? WHERE id=?").run(xp, streak, streak, day, u.id);
        for (const b of earnedBadges({ finishedDays: finishedDays(u.id), streak, correct, xp }))
          q("INSERT OR IGNORE INTO badges (user_id, badge) VALUES (?,?)").run(u.id, b);
        db.exec("COMMIT");
      } catch (e) { db.exec("ROLLBACK"); throw e; }
      return { correct, lines, total, streak, ...levelFor(xp), levelUp: levelFor(xp).level > levelFor(u.xp).level };
    },
    "GET /api/leaderboard": (req) => {
      const u = auth(req), from = weekStart(istDay(now()));
      const rows = q(`SELECT u.id, u.nick, SUM(l.points) pts FROM ledger l JOIN users u ON u.id=l.user_id
        WHERE l.day>=? GROUP BY u.id ORDER BY pts DESC, MIN(l.id) ASC`).all(from);
      const idx = rows.findIndex((r) => r.id === u.id);
      return { weekStart: from, top: rows.slice(0, 20).map((r, i) => ({ rank: i + 1, nick: r.nick, pts: r.pts, me: r.id === u.id })),
        me: idx < 0 ? null : { rank: idx + 1, pts: rows[idx].pts } };
    },
    "GET /api/ledger": (req) => ({ lines: q("SELECT day, kind, points FROM ledger WHERE user_id=? ORDER BY id DESC LIMIT 30").all(auth(req).id) })
  };

  const cache = new Map();
  function serveStatic(url, res) {
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (p === "/" || p === "\\") p = "/index.html";
    const file = join(publicDir, p);
    if (!file.startsWith(publicDir) || !existsSync(file)) { res.writeHead(404).end("Not found"); return; }
    const type = TYPES[extname(file)] || "application/octet-stream";
    if (!cache.has(file)) { const raw = readFileSync(file); cache.set(file, { raw, gz: gzipSync(raw) }); }
    const { raw, gz } = cache.get(file);
    const noCache = p === "/index.html" || p === "/sw.js";
    res.writeHead(200, { "Content-Type": type, "Content-Encoding": "gzip", "Content-Length": gz.length,
      "Cache-Control": noCache ? "no-cache" : "public, max-age=86400" });
    res.end(gz);
  }

  return async function handle(req, res) {
    const url = new URL(req.url, "http://x");
    try {
      const route = routes[`${req.method} ${url.pathname}`];
      if (!route) {
        if (req.method === "GET" && !url.pathname.startsWith("/api/")) return serveStatic(url, res);
        throw new HttpError(404, "Not found");
      }
      limit(req.socket?.remoteAddress || "?");
      let body = {};
      if (req.method === "POST") {
        let s = ""; for await (const c of req) { s += c; if (s.length > 4096) throw new HttpError(413, "Too big"); }
        try { body = s ? JSON.parse(s) : {}; } catch { throw new HttpError(400, "Bad JSON"); }
      }
      const out = await route(req, body);
      const json = Buffer.from(JSON.stringify(out));
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(json);
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: status === 500 ? "Something went wrong." : e.message }));
    }
  };
}
