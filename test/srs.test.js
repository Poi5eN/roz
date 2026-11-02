import test from "node:test";
import assert from "node:assert/strict";
import { nextBox, nextDueDay, practicePointsAward, BOX_INTERVALS } from "../server/srs.js";

test("nextBox advances on correct answer and resets to 1 on mistake", () => {
  assert.equal(nextBox(null, true), 1);
  assert.equal(nextBox(1, true), 2);
  assert.equal(nextBox(2, true), 3);
  assert.equal(nextBox(4, true), 5);
  assert.equal(nextBox(5, true), 5); // Capped at box 5

  assert.equal(nextBox(4, false), 1); // Reset
  assert.equal(nextBox(5, false), 1); // Reset
  assert.equal(nextBox(1, false), 1);
});

test("nextDueDay calculates correct intervals for Leitner boxes", () => {
  const base = "2026-11-02";
  assert.equal(nextDueDay(1, base), "2026-11-03"); // +1 day
  assert.equal(nextDueDay(2, base), "2026-11-04"); // +2 days
  assert.equal(nextDueDay(3, base), "2026-11-06"); // +4 days
  assert.equal(nextDueDay(4, base), "2026-11-10"); // +8 days
  assert.equal(nextDueDay(5, base), "2026-11-18"); // +16 days
});

test("practicePointsAward enforces 30 points daily cap", () => {
  // 5 correct at 5 pts each = 25 pts (under 30)
  assert.equal(practicePointsAward(0, 5), 25);
  // User already had 20 pts today, gets 5 correct (25 pts potential) -> capped to 10
  assert.equal(practicePointsAward(20, 5), 10);
  // User already reached cap of 30 -> 0 pts
  assert.equal(practicePointsAward(30, 4), 0);
});
