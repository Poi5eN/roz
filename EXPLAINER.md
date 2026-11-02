# Explainer: Roz

## The Problem and the Product Thesis

Most reward apps pay users for mindless tapping—spinning wheels, watching ads, or clicking arbitrary buttons. 

Roz takes a different stand:
> **Roz pays for learning: you listen, you speak, and the words you forget come back at the right time. And because the points matter, every point is explained and can be verified.**

Our target learners are Indian adults reading English as a second language on budget Android phones (often Android Go or devices with 1–2 GB RAM) over prepaid mobile data plans. For these users, points that convert to real value aren't trivial gamification—they represent real money. That reality shaped every engineering decision I made.

---

## Why Listen, Speak, and Remember?

1. **Listen:** Reading-heavy interfaces fail learners whose spoken comprehension outpaces their literacy. By pairing speech synthesis (tuned to Indian-accented English) with unambiguous emoji representations and an optional Hindi hint, Roz removes the reading barrier.
2. **Speak:** Language isn't acquired passively. Adding an immediate speaking round after listening requires the learner to produce the sounds they just heard. We score their pronunciation at the word level using dynamic programming edit distance.
3. **Remember:** Learning that disappears after one day doesn't help anyone. By feeding both daily mistakes and practice sessions into a 5-box Leitner spaced repetition scheduler, vocabulary resurfaces at scientifically grounded intervals (1, 2, 4, 8, and 16 days).

---

## The Three Hardest Engineering Decisions

### 1. Leaderboard Fairness vs. Personalized Practice
When rewards carry real-world value, competition must be undeniably fair. If personalized spaced repetition questions were scored on the weekly leaderboard, players with older accounts or curated vocabulary would have an unfair advantage over newcomers.
- **The Choice:** I strictly bifurcated the game into two tracks. The **Daily Challenge** (the same 5 questions for every user on that calendar day) is the *only* source of competitive points for the weekly leaderboard. The **Personal Practice** round runs on the learner's individual Leitner schedule and awards practice points (capped at 30/day), completely excluded from the leaderboard.

### 2. Unverifiable Speech = Practice Points Only
I wanted learners to speak, but Web Speech API recognition runs entirely on the client device. A malicious user or script could easily spoof speech events or mock microphone streams.
- **The Choice:** Rather than naively awarding high-stakes reward points for unverified client speech, I established a strict integrity rule: **speaking earns practice points only** (ledger kind `speak`, capped at 30/day, excluded from the leaderboard and future payout calculations). This allows honest learners to practice speaking aloud with real-time feedback without introducing an attack vector into the reward economy.

### 3. Tamper-Evident Hash-Chained Points Ledger
In a centralized database, a rogue admin or a SQL injection vulnerability could quietly inflate a user's point total before a payout. A plain total column or even a standard append-only log provides zero cryptographic proof against tampering.
- **The Choice:** I implemented block-header-style SHA-256 chaining on the `ledger` table:
  `hash = sha256(prev_hash | user_id | day | kind | points | id)`
  Every user's points form an unbroken cryptographic chain. The `GET /api/ledger/verify` endpoint recomputes this chain on demand. If even a single point value or row is manually altered in the database, the chain breaks at that exact ID, displaying an immediate warning.

---

## What I Left Out (On Purpose)

1. **Real Payment Rails & KYC:** Integrating payment gateways (UPI, Paytm, IMPS) and identity verification requires formal banking and legal compliance. The tamper-evident ledger and the `flags` table were specifically architected to feed into an audited payout queue.
2. **Phone OTP Sign-in:** Currently, authentication uses a client-stored token. While lightweight, clearing browser storage loses access. In production, SMS/WhatsApp OTP tied to an Indian mobile number is the natural next step.
3. **Durable Database on Free Hosting:** Vercel and Render free tiers use ephemeral filesystems that reset between deployments. Production requires a hosted Postgres instance or distributed SQLite (Turso / libsql).
4. **Heavy Frontend Frameworks & Asset Bundles:** Zero React, zero Vue, zero Tailwind, zero build tools. This kept the initial transfer size down to **11.23 KB gzipped** and daily gameplay to **~2.1 KB**, ensuring the app loads instantly on 2G/3G connections.

---

## What I Would Do Next with Kenpath

1. **Integrate Kenpath's svara-TTS:** Replace browser-native speech synthesis with Kenpath's open-source `svara-TTS`. This would give learners natural, high-quality, Indian-accented English and regional Indic language prompts across all Android versions.
2. **Expand Across Indic Languages:** Extend Hindi hints to Tamil, Telugu, Kannada, Bengali, and Marathi, making English accessible across India's linguistic landscape.
3. **Audio-Streamed Pronunciation Assessment:** Move speech evaluation from the client to an audio-streaming backend to allow server-verifiable pronunciation scoring for competitive rewards.

---

## AI Usage Disclosure

In compliance with the hiring brief, I used Google Antigravity as an AI pair-programming assistant during development. A complete, itemized factual log of candidate-designed architecture versus AI-generated scaffolding is documented in [docs/AI_USAGE.md](docs/AI_USAGE.md).
