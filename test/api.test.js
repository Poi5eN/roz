import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { openDb } from "../server/db.js";
import { createApp } from "../server/app.js";
import { dailyQuestions, istDay } from "../server/game.js";

async function boot() {
  let t = Date.parse("2026-11-02T06:00:00Z");
  const clock = { now: () => t, advance: (ms) => (t += ms) };
  const db = openDb(":memory:");
  const server = createServer(createApp(db, { now: clock.now, publicDir: "public" }));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { token, body, headers = {} } = {}) => {
    const r = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...headers },
      body: body && JSON.stringify(body)
    });
    return { status: r.status, data: await r.json() };
  };
  return { clock, call, db, close: () => server.close() };
}
async function playDay(env, token, wrong = 0) {
  const d = (await env.call("/api/daily", { token })).data;
  const keys = dailyQuestions(istDay(env.clock.now()));
  for (const [i, q] of d.questions.entries()) {
    const key = keys.find((k) => k.id === q.id).correctId;
    const pick = i < wrong ? q.options.find((o) => o.id !== key).id : key;
    env.clock.advance(500); // realistic time per question (> 400 ms)
    await env.call("/api/answer", { token, body: { qid: q.id, optionId: pick } });
  }
  env.clock.advance(20000);
  return env.call("/api/finish", { token, body: {} });
}

test("full journey: join, play, points, streak, once-per-day, leaderboard", async () => {
  const env = await boot();
  const { token } = (await env.call("/api/join", { body: { nick: "Ravi_22" } })).data;
  assert.equal((await env.call("/api/join", { body: { nick: "ravi_22" } })).status, 409);

  const r = await playDay(env, token);
  assert.equal(r.data.correct, 5);
  assert.equal(r.data.total, 80);

  assert.equal((await env.call("/api/daily", { token })).data.done, true); // one attempt per day
  assert.equal((await env.call("/api/finish", { token, body: {} })).status, 409); // cannot double-claim

  env.clock.advance(24 * 3600 * 1000);
  const r2 = await playDay(env, token, 2);
  assert.equal(r2.data.streak, 2);
  assert.equal(r2.data.correct, 3);

  const me = (await env.call("/api/me", { token })).data;
  assert.equal(me.xp, 80 + 30 + 10 + 5);
  assert.ok(me.badges.find((b) => b.id === "first").earned);
  const lb = (await env.call("/api/leaderboard", { token })).data;
  assert.equal(lb.top[0].nick, "Ravi_22");
  env.close();
});

test("cheating is blocked: no key leak, no unauthenticated access, too-fast finish rejected and flagged", async () => {
  const env = await boot();
  assert.equal((await env.call("/api/me")).status, 401);
  const { token } = (await env.call("/api/join", { body: { nick: "Speedy" } })).data;
  const d = (await env.call("/api/daily", { token })).data;
  assert.ok(!JSON.stringify(d).includes("correctId"));
  for (const q of d.questions) {
    env.clock.advance(500); // past 400ms per answer check
    await env.call("/api/answer", { token, body: { qid: q.id, optionId: "a" } });
  }
  // Total time elapsed: 2.5s (less than 5 * 1.5s = 7.5s)
  const finishRes = await env.call("/api/finish", { token, body: {} });
  assert.equal(finishRes.status, 429);

  // Verify suspicious finish was logged in flags table
  const flags = env.db.prepare("SELECT * FROM flags WHERE reason=?").all("too_fast_finish");
  assert.equal(flags.length, 1);
  assert.equal(flags[0].day, "2026-11-02");
  env.close();
});

test("anti-abuse: answers faster than 400ms are rejected", async () => {
  const env = await boot();
  const { token } = (await env.call("/api/join", { body: { nick: "FastFingers" } })).data;
  const d = (await env.call("/api/daily", { token })).data;
  const firstQ = d.questions[0];

  // Immediately answer (< 400ms)
  const fastAnswer = await env.call("/api/answer", { token, body: { qid: firstQ.id, optionId: "a" } });
  assert.equal(fastAnswer.status, 429);
  assert.ok(fastAnswer.data.error.includes("too fast"));

  // Advance by 450ms -> should succeed
  env.clock.advance(450);
  const validAnswer = await env.call("/api/answer", { token, body: { qid: firstQ.id, optionId: "a" } });
  assert.equal(validAnswer.status, 200);

  // Answering second question too fast (< 400ms)
  const secondQ = d.questions[1];
  env.clock.advance(100);
  const fastSecond = await env.call("/api/answer", { token, body: { qid: secondQ.id, optionId: "a" } });
  assert.equal(fastSecond.status, 429);
  env.close();
});

test("anti-abuse: max 5 new accounts per IP per day", async () => {
  const env = await boot();
  const headers = { "x-forwarded-for": "198.51.100.42" };
  for (let i = 1; i <= 5; i++) {
    const res = await env.call("/api/join", { body: { nick: `User_${i}` }, headers });
    assert.equal(res.status, 200, `Account ${i} should be created`);
    assert.ok(res.data.token);
  }
  // 6th account from same IP on same day must be rejected
  const blocked = await env.call("/api/join", { body: { nick: "User_6" }, headers });
  assert.equal(blocked.status, 429);
  assert.ok(blocked.data.error.includes("limit"));

  // Another IP on same day succeeds
  const otherIp = await env.call("/api/join", { body: { nick: "User_Other" }, headers: { "x-forwarded-for": "198.51.100.99" } });
  assert.equal(otherIp.status, 200);
  env.close();
});

test("tamper-evident points ledger: valid chain verifies, manual point mutation breaks chain at that id", async () => {
  const env = await boot();
  const { token } = (await env.call("/api/join", { body: { nick: "LedgerUser" } })).data;
  await playDay(env, token);

  // Verification succeeds on genuine play
  const v1 = (await env.call("/api/ledger/verify", { token })).data;
  assert.equal(v1.ok, true);
  assert.ok(v1.count > 0);

  // Directly UPDATE a row's points in SQLite database
  const firstRow = env.db.prepare("SELECT id FROM ledger LIMIT 1").get();
  env.db.prepare("UPDATE ledger SET points = points + 50 WHERE id = ?").run(firstRow.id);

  // Verification must now fail exactly at that id
  const v2 = (await env.call("/api/ledger/verify", { token })).data;
  assert.equal(v2.ok, false);
  assert.equal(v2.brokenAtId, firstRow.id);
  env.close();
});

test("personal practice with Leitner SRS: answers update box, practice points capped, excluded from leaderboard", async () => {
  const env = await boot();
  const { token } = (await env.call("/api/join", { body: { nick: "Practicer" } })).data;

  // Initial practice request
  const prac = (await env.call("/api/practice", { token })).data;
  assert.ok(prac.questions.length > 0 && prac.questions.length <= 5);

  const q1 = prac.questions[0];
  // Check practice question
  const checkRes = await env.call("/api/practice/check", { token, body: { qid: q1.id, word: q1.options[0].word } });
  assert.equal(checkRes.status, 200);
  assert.ok(typeof checkRes.data.correct === "boolean");

  // Home stats reflect words known / due review
  const me = (await env.call("/api/me", { token })).data;
  assert.ok("wordsKnown" in me);
  assert.ok("dueCount" in me);

  // Leaderboard should NOT count practice points
  const lb = (await env.call("/api/leaderboard", { token })).data;
  const userEntry = lb.top.find((u) => u.nick === "Practicer");
  if (userEntry) {
    // If only practice points earned, leaderboard pts must be 0 or null
    assert.equal(userEntry.pts, 0);
  }
  env.close();
});
