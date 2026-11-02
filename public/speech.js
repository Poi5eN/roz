// Pure ES module for word-level speech comparison and scoring
export function cleanWords(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Computes word-level Levenshtein distance between two string arrays.
 */
export function wordLevenshtein(targetWords, spokenWords) {
  const m = targetWords.length;
  const n = spokenWords.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (targetWords[i - 1] === spokenWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  // Backtrack to determine alignment status for each target word
  let i = m;
  let j = n;
  const matchedTargetIndices = new Set();
  while (i > 0 && j > 0) {
    if (targetWords[i - 1] === spokenWords[j - 1]) {
      matchedTargetIndices.add(i - 1);
      i--;
      j--;
    } else {
      const minVal = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      if (minVal === dp[i - 1][j - 1]) {
        i--;
        j--;
      } else if (minVal === dp[i - 1][j]) {
        i--;
      } else {
        j--;
      }
    }
  }

  return { distance: dp[m][n], matchedTargetIndices };
}

/**
 * Compares target sentence against spoken transcript.
 * Returns { score, passed, words } where words has { word, matched: boolean }.
 * Pass threshold is >= 70%.
 */
export function scoreSpeech(targetText, spokenText, threshold = 0.7) {
  const targetWords = cleanWords(targetText);
  const spokenWords = cleanWords(spokenText);

  if (targetWords.length === 0) {
    return { score: 100, passed: true, words: [] };
  }
  if (spokenWords.length === 0) {
    return {
      score: 0,
      passed: false,
      words: targetWords.map((w) => ({ word: w, matched: false }))
    };
  }

  const { distance, matchedTargetIndices } = wordLevenshtein(targetWords, spokenWords);
  const maxLen = Math.max(targetWords.length, spokenWords.length);
  const similarity = Math.max(0, 1 - distance / maxLen);
  const score = Math.round(similarity * 100);
  const passed = similarity >= threshold;

  const words = targetWords.map((word, idx) => ({
    word,
    matched: matchedTargetIndices.has(idx)
  }));

  return { score, passed, words };
}
