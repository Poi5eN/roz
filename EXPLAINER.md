# Explainer: Roz

## What I built
Roz is a 3-minute daily English listening game. Five questions a day: the phone *says* a sentence, you tap the matching picture. Points, a streak, levels, six badges and a weekly leaderboard bring you back; a Hindi hint helps when English is the hard part.

## Why this idea
Kenpath builds voice and language technology for Indian users, and your note says users read English as a second language on modest phones. A *listening* game with pictures needs little reading, tiny data (no images, no fonts, no video) and matches the voice-first thinking at Kenpath. What appeals to me most is the discipline of building under strict constraints: creating an engaging, polished experience that respects a user's bandwidth, phone hardware, and time.

## Choices I made
- **Fairness first, because the rewards are worth real money.** The server holds the answers, everyone gets the same questions, one attempt a day, an append-only points ledger that itemises every point, a too-fast completion check (average under 1.5 s per question), and persistent audit logging in a `flags` table.
- **Anti-abuse hardening.** Added a limit of max 5 new accounts per IP address per day to block sybil farming, and rejected answers submitted faster than 400 ms after the question was served (preventing automated scripted guessing).
- **Daily challenge twist.** Sunday is "Double Points Day": all points earned on Sunday IST are multiplied by 2x and recorded as an itemised `Sunday 2x bonus` ledger line.
- **Voice robustness & accessibility.** Detects whether browser speech synthesis is present and prioritises Indian-English (`en-IN`) voices. If TTS is missing or unsupported, displays a clear fallback notice rather than blocking play. Added a visible mute toggle, 48px+ touch targets, high-visibility focus states, Devanagari font clarity, and a 3-bullet introductory card on the join screen.
- **Content expanded to 65+ questions.** Everyday vocabulary spanning farm, market, health, phone/tech, transport, family, and time routines, with 2 unambiguous distractors per question and unit tests verifying uniqueness.
- **Weak phones.** No framework, no build step, ~5 KB first load, offline shell via service worker, emoji instead of image assets, browser text-to-speech instead of heavy audio files.
- **Plain English.** Short sentences, a "Listen again" button, visible text fallback, and an on/off Hindi hint toggle.
- **Streaks without cruelty.** A missed day resets the streak, but points and badges are permanent.
- **Zero dependencies.** Clone and `npm start`. Uses Node's built-in SQLite (`node:sqlite`) and native test runner (`node:test`).

## What I left out (on purpose)
- **Real payouts / withdrawals, KYC, fraud review.** Needs a payment gateway partner and policy decisions. The ledger and `flags` audit table are designed to feed it.
- **Proper login (phone OTP).** Today a player picks a name and the device keeps a token in local storage; clearing browser data loses the account.
- **Durable hosting database.** Free tiers wipe the ephemeral disk on rebuilds; production would use Postgres (or Turso / libsql).
- **Studio-grade voice generation.** Browser voices vary across Android builds; integrating Kenpath's open `svara-TTS` would provide consistent, natural Indian-accented speech and regional language audio.
- **Push notifications, streak freezes, social sharing.**

## What I would do next
Move to OTP login and Postgres, add a payout request queue backed by the ledger and flags table, integrate svara-TTS for pre-rendered lightweight audio clips, and field-test with learners on Android Go devices.

## Where I used AI
I used Google Antigravity as an AI pair-programmer to accelerate implementation:
1. **Content Generation & Validation**: Scaffolding 65 everyday vocabulary items in `server/content.js` and writing test assertions for distractors and uniqueness.
2. **Game Mechanics**: Implementing the Sunday double-points rules in `server/game.js` and connecting the UI banner in `public/app.js`.
3. **Anti-Abuse Hardening**: Adding the `ip_signups` and `flags` database tables, adding the 400 ms answer threshold, and writing the automated test cases in `test/api.test.js`.
4. **Front-end Polish**: Styling responsive layout improvements, Devanagari readability, and testing the flow on mobile viewport.

I reviewed, tested, and refined all code, database queries, and test assertions myself to ensure accuracy and architectural integrity.
