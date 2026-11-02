// Pure game rules: no I/O, so everything here is unit-tested.
import { ITEMS } from "./content.js";

export const QUESTIONS_PER_DAY = 5;
export const POINTS = { correct: 10, complete: 10, perfect: 20, streakPerDay: 5, streakCap: 7 };
export const MIN_SECONDS_PER_QUESTION = 1.5; // faster than this on average = bot/cheat

const IST_OFFSET_MS = 5.5 * 3600 * 1000;

/** Calendar day in India (YYYY-MM-DD). The "day" rolls over at midnight IST. */
export function istDay(now = Date.now()) {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}
export function addDays(day, n) {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Monday of the week containing `day` - the leaderboard resets then. */
export function weekStart(day) {
  const dow = new Date(day + "T00:00:00Z").getUTCDay(); // 0=Sun
  return addDays(day, -((dow + 6) % 7));
}

function hash(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Same questions for everyone on a given day (fair for a leaderboard). Includes answer key. */
export function dailyQuestions(day, items = ITEMS) {
  const rand = rng(hash("roz:" + day));
  return shuffle(items, rand).slice(0, QUESTIONS_PER_DAY).map((it) => {
    const opts = shuffle([{ ...it.correct, isCorrect: true }, ...it.distractors.map((d) => ({ ...d, isCorrect: false }))], rand)
      .map((o, i) => ({ id: "abc"[i], ...o }));
    return { id: it.id, say: it.say, hi: it.hi, options: opts, correctId: opts.find((o) => o.isCorrect).id };
  });
}

/** What the browser may see - never the answer key. */
export function publicView(questions) {
  return questions.map((q) => ({
    id: q.id, say: q.say, hi: q.hi,
    options: q.options.map(({ id, emoji, word }) => ({ id, emoji, word }))
  }));
}

export function levelFor(xp) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const floor = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, into: xp - floor, span: next - floor };
}

/** Streak after finishing `day`, given the last day played. */
export function nextStreak(lastPlayed, day, current) {
  if (lastPlayed === day) return current;
  return lastPlayed === addDays(day, -1) ? current + 1 : 1;
}
/** Streak to *display*: it is broken if you missed yesterday. */
export function liveStreak(lastPlayed, today, stored) {
  return lastPlayed === today || lastPlayed === addDays(today, -1) ? stored : 0;
}

/** Points for one finished day, as separate ledger lines so users can see exactly why. */
export function pointsFor(correct, streakAfter) {
  const lines = [{ kind: "correct", points: correct * POINTS.correct }, { kind: "complete", points: POINTS.complete }];
  if (correct === QUESTIONS_PER_DAY) lines.push({ kind: "perfect", points: POINTS.perfect });
  const bonus = Math.min(streakAfter - 1, POINTS.streakCap) * POINTS.streakPerDay;
  if (bonus > 0) lines.push({ kind: "streak", points: bonus });
  return lines;
}

export const BADGES = {
  first: { name: "First step", icon: "🌱", how: "Finish your first day" },
  streak3: { name: "3-day streak", icon: "🔥", how: "Play 3 days in a row" },
  streak7: { name: "7-day streak", icon: "⚡", how: "Play 7 days in a row" },
  streak30: { name: "30-day streak", icon: "👑", how: "Play 30 days in a row" },
  perfect: { name: "Perfect day", icon: "🎯", how: "Get all 5 right" },
  level5: { name: "Level 5", icon: "🏅", how: "Reach level 5" }
};
export function earnedBadges({ finishedDays, streak, correct, xp }) {
  const b = [];
  if (finishedDays >= 1) b.push("first");
  if (streak >= 3) b.push("streak3");
  if (streak >= 7) b.push("streak7");
  if (streak >= 30) b.push("streak30");
  if (correct === QUESTIONS_PER_DAY) b.push("perfect");
  if (levelFor(xp).level >= 5) b.push("level5");
  return b;
}
