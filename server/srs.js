// Pure Leitner spaced repetition scheduling logic
import { addDays } from "./game.js";

export const BOX_INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
export const MAX_BOX = 5;
export const PRACTICE_POINTS_PER_CORRECT = 5;
export const MAX_PRACTICE_POINTS_PER_DAY = 30;

/**
 * Returns the next box level given the current box and correctness.
 * Correct advances by 1 up to MAX_BOX; incorrect resets to Box 1.
 */
export function nextBox(currentBox, isCorrect) {
  if (!isCorrect) return 1;
  const current = Number(currentBox) || 0;
  return Math.min(MAX_BOX, Math.max(1, current + 1));
}

/**
 * Returns the ISO calendar day string when this item is next due.
 */
export function nextDueDay(box, currentDay) {
  const b = Math.min(MAX_BOX, Math.max(1, Number(box) || 1));
  const days = BOX_INTERVALS[b] || 1;
  return addDays(currentDay, days);
}

/**
 * Given user's practice points earned today and number of correct answers,
 * calculates the practice points awarded, respecting the daily cap.
 */
export function practicePointsAward(todayPoints, correctCount) {
  const potential = correctCount * PRACTICE_POINTS_PER_CORRECT;
  const remainingCap = Math.max(0, MAX_PRACTICE_POINTS_PER_DAY - todayPoints);
  return Math.min(potential, remainingCap);
}
