# AI Usage Disclosure & Factual Change Log

In accordance with the Kenpath Labs brief guidelines (*"You may use AI coding tools. Tell us where you used them."*), this log discloses where Google Antigravity was used to assist during the build, and what was authored, designed, and reviewed by me.

---

## High-Level Summary
- **Human Author / Candidate**: System architecture, design decisions, security model, Leitner SRS interval strategy, anti-abuse rule definitions, code review, manual device testing, and overall direction.
- **AI Tool (Google Antigravity)**: Code generator, test scaffold accelerator, and pair-programming assistant for rapid implementation across the roadmap phases.

---

## Detailed Factual Breakdown by Phase

### Phase 1: Tamper-Evident Points Ledger
- **Candidate Authored/Decided**:
  - Selected SHA-256 hash chaining formula (`hash = sha256(prev_hash | user_id | day | kind | points | id)`).
  - Specified transaction placement inside `POST /api/finish` and verification logic for `GET /api/ledger/verify`.
  - Defined test scenarios for manual tampering detection.
- **AI Generated**:
  - Implemented the database migration queries and hashing loop.
  - Generated unit test verifying that direct SQL `UPDATE` causes chain failure at the exact row id.

### Phase 2: "Say it" Speaking Round
- **Candidate Authored/Decided**:
  - Established the core integrity rule: device speech is unverifiable by the server, so speaking awards **practice points only** (capped at 30/day) and is strictly excluded from the weekly leaderboard.
  - Specified word-level Levenshtein edit distance with a 70% pass threshold.
  - Outlined the fallback self-check for browsers without Web Speech recognition.
- **AI Generated**:
  - Implemented `public/speech.js` string normalization and dynamic programming distance matrix with backtrack word alignment.
  - Added unit test suite in `test/speech.test.js`.
  - Wired speech recognition events and CSS pulse effects in `public/app.js` and `public/style.css`.

### Phase 3: Personal Practice & Spaced Repetition (Leitner)
- **Candidate Authored/Decided**:
  - Defined the 5-box Leitner intervals (1, 2, 4, 8, 16 days) and the demotion rule (wrong answers return to Box 1).
  - Designed the dual-pool question selection (due words first, then unseen words).
  - Enforced the daily cap of 30 practice points and exclusion from the competitive leaderboard.
- **AI Generated**:
  - Created `server/srs.js` scheduling logic and `word_stats` SQLite schema.
  - Implemented `GET /api/practice` and `POST /api/practice/check` endpoints.
  - Generated unit tests in `test/srs.test.js`.

### Phase 4: Data Transparency & Metering
- **Candidate Authored/Decided**:
  - Specified real measured byte metrics using Chrome DevTools with Slow 3G throttling rather than theoretical estimates.
  - Decided on the daily local storage counter for IST day data usage.
- **AI Generated**:
  - Built the `addDailyBytes` helper and network response tracking in `public/app.js`.
  - Added the live data meter display to the Home view.

### Phase 5: Content & Accessibility
- **Candidate Authored/Decided**:
  - Categorized vocabulary domains (farm, market, health, phone, transport, family, time) relevant to Indian ESL learners.
  - Established unambiguous distractor requirements.
- **AI Generated**:
  - Expanded `server/content.js` to 65 questions with accurate Hindi translations.
  - Added automated tests in `test/game.test.js` validating question count, unique ids, distractors, and unique words/emojis.
  - Polished CSS contrast tokens, focus indicators, and safe-area padding.

### Phase 6: Presentation & Documentation
- **Candidate Authored/Decided**:
  - Wrote the personal narrative in `EXPLAINER.md` focusing on the three hardest engineering trade-offs.
  - Outlined the 2:30 video screen recording script in `docs/DEMO_SCRIPT.md`.
- **AI Generated**:
  - Formatted the Mermaid architecture diagram and design decisions table in `README.md`.
