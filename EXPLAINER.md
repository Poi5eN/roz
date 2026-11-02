# Explainer: Roz

> Draft - edit the bracketed parts so it is truly in your own words, then send.

## What I built
Roz is a 3-minute daily English listening game. Five questions a day: the phone *says* a sentence, you tap the matching picture. Points, a streak, levels, six badges and a weekly leaderboard bring you back; a Hindi hint helps when English is the hard part.

## Why this idea
Kenpath builds voice and language technology for Indian users, and your note says users read English as a second language on modest phones. A *listening* game with pictures needs little reading, tiny data (no images, no fonts, no video) and matches the voice-first thinking at Kenpath. [Add one sentence of your own about why this appeals to you.]

## Choices I made
- **Fairness first, because the rewards are worth real money.** The server holds the answers, everyone gets the same questions, one attempt a day, a points ledger that explains every point, a too-fast check and rate limiting.
- **Weak phones.** No framework, no build step, ~5 KB first load, offline shell, emoji instead of images, browser text-to-speech instead of audio files.
- **Plain English.** Short sentences, a "Listen again" button, the sentence is always shown, Hindi hint toggle.
- **Streaks without cruelty.** A missed day resets the streak, but points are never taken away.
- **Zero dependencies.** Clone and `npm start`. Uses Node's built-in SQLite and test runner.

## What I left out (on purpose)
- **Real payouts / withdrawals, KYC, fraud review.** Needs a payment partner and policy decisions. The ledger is designed to feed it.
- **Proper login (phone OTP).** Today a player picks a name and the device keeps a token; clearing browser data loses the account.
- **Durable hosting database.** Free tiers wipe the disk; production would use Postgres/Turso.
- **Real voices in more languages.** Browser voices vary by phone; Kenpath's open svara-TTS could give consistent Indian-English and Indic audio.
- **More content and levels.** 28 questions now; the bank grows by adding rows.
- **Push reminders, streak freezes, analytics.**

## What I would do next
Move to OTP login and Postgres, add a payout ledger with review, ship svara-TTS audio, and test with real learners on real phones.

## Where I used AI
[Be specific and honest, e.g.: "I used Claude to research Kenpath and draft the plan and starter code, and Google Antigravity to extend and polish it. I reviewed and tested all code, changed X and Y myself."]
