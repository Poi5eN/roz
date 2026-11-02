import test from "node:test";
import assert from "node:assert/strict";
import { dailyQuestions, publicView, istDay, weekStart, levelFor, nextStreak, liveStreak, pointsFor, QUESTIONS_PER_DAY } from "../server/game.js";

test("daily questions are identical for everyone on the same day, different the next day", () => {
  assert.deepEqual(dailyQuestions("2026-11-02"), dailyQuestions("2026-11-02"));
  assert.notDeepEqual(dailyQuestions("2026-11-02").map((q) => q.id), dailyQuestions("2026-11-03").map((q) => q.id));
  assert.equal(dailyQuestions("2026-11-02").length, QUESTIONS_PER_DAY);
});
test("answer key never reaches the browser", () => {
  const json = JSON.stringify(publicView(dailyQuestions("2026-11-02")));
  assert.ok(!json.includes("correctId") && !json.includes("isCorrect"));
});
test("correct option position varies (ids do not leak the answer)", () => {
  const seen = new Set();
  for (let d = 1; d <= 20; d++) dailyQuestions(`2026-12-${String(d).padStart(2, "0")}`).forEach((q) => seen.add(q.correctId));
  assert.ok(seen.size === 3);
});
test("day rolls over at midnight IST, not UTC", () => {
  assert.equal(istDay(Date.parse("2026-11-02T18:29:00Z")), "2026-11-02");
  assert.equal(istDay(Date.parse("2026-11-02T18:31:00Z")), "2026-11-03");
});
test("week starts Monday", () => {
  assert.equal(weekStart("2026-11-02"), "2026-11-02"); // Monday
  assert.equal(weekStart("2026-11-08"), "2026-11-02"); // Sunday
});
test("levels", () => {
  assert.equal(levelFor(0).level, 1);
  assert.equal(levelFor(50).level, 2);
  assert.equal(levelFor(200).level, 3);
});
test("streak continues, resets, and expires for display", () => {
  assert.equal(nextStreak("2026-11-01", "2026-11-02", 4), 5);
  assert.equal(nextStreak("2026-10-30", "2026-11-02", 4), 1);
  assert.equal(nextStreak(null, "2026-11-02", 0), 1);
  assert.equal(liveStreak("2026-11-01", "2026-11-02", 4), 4);
  assert.equal(liveStreak("2026-10-30", "2026-11-02", 4), 0);
});
test("points are itemised and bonuses capped", () => {
  assert.equal(pointsFor(5, 1).reduce((s, l) => s + l.points, 0), 50 + 10 + 20);
  assert.equal(pointsFor(3, 30).find((l) => l.kind === "streak").points, 35);
});
