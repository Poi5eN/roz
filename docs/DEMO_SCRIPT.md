# Demo Screen-Recording Script (2:30)

Target Duration: **2 minutes 30 seconds**  
Device Setup: Mobile device mode in Chrome DevTools (360x640, Slow 3G throttling simulation) or an actual Android phone.

---

### [0:00 - 0:20] The Problem & The User
- **Visual**: Start on phone screen at `Roz` join screen with the 3 bullets in English + Hindi.
- **Voiceover**: 
  > *"Millions of people in India are trying to learn English on budget Android smartphones over mobile data. Most reward apps pay for mindless tapping. Roz pays for learning: a 3-minute daily listening and speaking game where points are worth real money to the learner, every point is mathematically verifiable, and data consumption is measured in mere kilobytes."*

---

### [0:20 - 1:10] One Full Daily Routine
- **Visual**: 
  - Enter name `Ravi_22`, tap Start.
  - Home screen appears: Show streak (🔥), level progress, and the Sunday 2x challenge banner.
  - Tap `Play today's 5 (3 min)`.
  - Hear sentence via TTS (`"Please drink some water."`), show Hindi translation toggle, select matching picture card.
  - Quick feedback with haptic buzz and immediate answer validation. Complete 5 questions.
  - **Speaking Challenge**: Show Round 2 Speaking screen. Tap the mic, pronounce the sentence, and watch real-time word-level scoring (green/red word highlights).
- **Voiceover**: 
  > *"Each day has 5 listening questions. The phone speaks natural Indian-English, with an instant Hindi fallback hint. After listening, learners get a speaking round powered by browser speech recognition. Words are scored using Levenshtein distance: get above 70% match and you earn practice points."*

---

### [1:10 - 1:40] The Tamper-Evident Ledger & Spaced Repetition
- **Visual**: 
  - Finish card appears: show itemized points breakdown.
  - Tap `Points` tab: Show the green shield banner: `Verified: 7 entries, none altered`.
  - Show how each point has an append-only chained cryptographic hash.
  - Tap `Home` tab: Point out `🧠 Memory (Spaced Repetition)`: Words known (box 4-5) and due for review. Tap `Practice` to review due vocabulary.
- **Voiceover**: 
  > *"Because these points represent real value to learners, fairness is paramount. The points ledger uses cryptographic SHA-256 hash chaining—just like a block header. Any manual database tampering breaks the chain immediately. For vocabulary retention, we use an integrated 5-box Leitner spaced repetition scheduler, so forgotten words resurface at 1, 2, 4, 8, and 16 day intervals."*

---

### [1:40 - 2:00] Data Meter & Network Transparency
- **Visual**: 
  - Point out `📶 Data used today: 4.8 KB` on Home screen.
  - Show Chrome DevTools Network tab: total first load is only 11.2 KB gzipped, and daily gameplay uses just ~2.1 KB.
- **Voiceover**: 
  > *"On 1.5 GB daily data plans, every megabyte counts. We built Roz with zero frontend frameworks, zero build steps, and zero heavy image files. An entire day of play transfers under 3 KB of data. Learners can see their live data consumption right on the home screen."*

---

### [2:00 - 2:20] Design Choices & Trade-offs
- **Visual**: Show the weekly Leaderboard (`🏆 Board`) and point out how practice/speaking points are excluded for pure competition fairness.
- **Voiceover**: 
  > *"We made three tough decisions: First, because device speech recognition cannot be verified server-side, speaking earns practice points only, keeping the weekly leaderboard 100% fair. Second, anti-abuse limits cap daily IP creations to 5 and reject answers under 400 milliseconds. Third, zero external dependencies—the entire app runs natively on Node 22."*

---

### [2:20 - 2:30] Next Steps with Kenpath
- **Visual**: Close on the Roz interface with Kenpath Labs attribution.
- **Voiceover**: 
  > *"Next, we plan to plug in Kenpath's open-source svara-TTS for natural Indian voices across Indic languages, add phone OTP login, and wire the ledger into a micro-payout queue. Thank you!"*
