# Brief for Google Antigravity (paste this into the agent)

You are helping me finish a hiring build task for **Kenpath Labs** (Bengaluru; AI-first studio building voice AI and public-good products: open-source svara-TTS, agriculture, education, accessibility). The repo you are in is a working starter called **Roz**. First run `npm test` and `npm start` and read README.md. Do not rewrite it from scratch.

## The brief we must satisfy
Small responsive web app people would open every day: a short task, rewarded (streaks, levels, points, badges, leaderboard, daily challenge; pick what fits, make it work properly). Users: modest Android phones, mobile data, English as a second language, and **earnings are worth real money to them**. Deliver: live link (free tier, opened on a phone first), repo with README (clone -> run), explainer. Hard rule: README's first line must stay `Ref: KL-7Q4`. We will be judged on the app, the explainer and the repo. A small idea done well beats a big one half done.

## Priorities (do in order, stop when time is up; each must keep `npm test` green)
1. **Mobile QA at 360x640 and Slow 3G throttling.** Fix any overflow, tap target under 48px, or layout shift. Verify the home -> play -> result -> leaderboard flow in Chrome DevTools device mode. Keep first load under 15 KB gzipped.
2. **Voice robustness.** Browser TTS may be missing or not en-IN. Detect it, and if absent show a clear "sound unavailable, read the sentence" state. Add a visible mute toggle. Never block play on audio.
3. **Content to 60+ questions** in `server/content.js` (same row format). Everyday vocabulary: farm, market, health, phone, transport, family, time. Every distractor must be clearly wrong (no ambiguous emoji). Add a test that every item has 2 distractors and unique words per question.
4. **Daily challenge twist.** Keep the 5 daily questions; add a Sunday "double points" day via `pointsFor` and show it on Home. Unit test it.
5. **Anti-abuse hardening (the real-money angle).** Add: max 5 new accounts per IP per day; reject answers submitted faster than 400 ms after the question was served (store a served-at time); log suspicious finishes in a `flags` table. Tests for each. Document in README under Design rules.
6. **Polish and accessibility.** Focus states, aria-live feedback for right/wrong, reduced motion, dark mode check, readable Devanagari. Add a tiny first-run explainer (3 bullets) on the join screen.
7. **Deploy** to Render free tier using `render.yaml`; put the live URL in README. Test the live link on a real phone. Note the ephemeral-disk limitation honestly.

## Rules
- No new runtime dependencies unless essential; no frontend framework; no build step.
- Server stays the only authority on answers and points.
- Keep functions small and tested; keep README accurate after every change.
- Produce a short `CHANGELOG`-style note of what you changed so I can disclose AI use accurately in the explainer.

## Final checklist before I email Shashank
- [ ] Live URL works on my phone over mobile data
- [ ] `git clone` -> `npm start` works on a clean machine
- [ ] README starts with `Ref: KL-7Q4`
- [ ] EXPLAINER.md rewritten in my own words, AI use disclosed
- [ ] Optional: 2-3 minute screen recording (script: problem -> demo of one full day -> 3 choices -> what I left out -> next steps)
- [ ] Reply email contains: live link, repo link, explainer (or video link)
