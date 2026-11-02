import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { openDb } from "../server/db.js";
import { createApp } from "../server/app.js";
import { dailyQuestions, istDay } from "../server/game.js";

async function boot() {
  let t = Date.parse("2026-11-02T06:00:00Z");
  const clock = { now: () => t, advance: (ms) => (t += ms) };
  const server = createServer(createApp(openDb(":memory:"), { now: clock.now, publicDir: "public" }));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { token, body } = {}) => {
    const r = await fetch(base + path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body && JSON.stringify(body) });
    return { status: r.status, data: await r.json() };
  };
  return { clock, call, close: () => server.close() };
}
async function playDay(env, token, wrong = 0) {
  const d = (await env.call("/api/daily", { token })).data;
  const keys = dailyQuestions(istDay(env.clock.now()));
  for (const [i, q] of d.questions.entries()) {
    const key = keys.find((k) => k.id === q.id).correctId;
    const pick = i < wrong ? q.options.find((o) => o.id !== key).id : key;
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

test("cheating is blocked: no key leak, no unauthenticated access, too-fast finish rejected", async () => {
  const env = await boot();
  assert.equal((await env.call("/api/me")).status, 401);
  const { token } = (await env.call("/api/join", { body: { nick: "Speedy" } })).data;
  const d = (await env.call("/api/daily", { token })).data;
  assert.ok(!JSON.stringify(d).includes("correctId"));
  for (const q of d.questions) await env.call("/api/answer", { token, body: { qid: q.id, optionId: "a" } });
  assert.equal((await env.call("/api/finish", { token, body: {} })).status, 429);
  env.close();
});
