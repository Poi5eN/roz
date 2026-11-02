import test from "node:test";
import assert from "node:assert/strict";
import { cleanWords, wordLevenshtein, scoreSpeech } from "../public/speech.js";

test("cleanWords normalizes punctuation, case, and whitespace", () => {
  assert.deepEqual(cleanWords("Please drink some water."), ["please", "drink", "some", "water"]);
  assert.deepEqual(cleanWords("  Hello,  World!  "), ["hello", "world"]);
  assert.deepEqual(cleanWords(""), []);
  assert.deepEqual(cleanWords(null), []);
});

test("wordLevenshtein accurately measures word differences and matches", () => {
  const target = ["the", "baby", "is", "sleeping"];
  const exact = ["the", "baby", "is", "sleeping"];
  assert.equal(wordLevenshtein(target, exact).distance, 0);

  const oneOff = ["the", "baby", "was", "sleeping"];
  assert.equal(wordLevenshtein(target, oneOff).distance, 1);

  const missing = ["baby", "sleeping"];
  assert.equal(wordLevenshtein(target, missing).distance, 2);
});

test("scoreSpeech returns >= 70% for accurate pronunciation and aligns words", () => {
  const target = "Please drink some water.";

  // Perfect match -> 100%
  const res1 = scoreSpeech(target, "please drink some water");
  assert.equal(res1.score, 100);
  assert.equal(res1.passed, true);
  assert.ok(res1.words.every((w) => w.matched));

  // 1 word off out of 4 words -> 75% -> passed (>= 70%)
  const res2 = scoreSpeech(target, "please drink cold water");
  assert.equal(res2.score, 75);
  assert.equal(res2.passed, true);
  assert.equal(res2.words.find((w) => w.word === "some").matched, false);
  assert.equal(res2.words.find((w) => w.word === "water").matched, true);

  // Totally wrong -> fail
  const res3 = scoreSpeech(target, "something completely different");
  assert.ok(res3.score < 50);
  assert.equal(res3.passed, false);

  // Empty speech -> 0%
  const res4 = scoreSpeech(target, "");
  assert.equal(res4.score, 0);
  assert.equal(res4.passed, false);
  assert.ok(res4.words.every((w) => !w.matched));
});
