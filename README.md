Ref: KL-7Q4

# Roz - English in 3 minutes a day

A tiny daily game for people who are learning English on a budget Android phone. Each day there are **5 questions**: you *hear* a short sentence, then tap the picture that matches. You earn points, keep a streak, level up, collect badges and climb a weekly leaderboard.

- Live: `<add your deployed URL here>`
- Explainer: [EXPLAINER.md](EXPLAINER.md)
- Built with AI help: see "Where I used AI" in the explainer.

## Run it (2 commands)

Needs **Node 22.13 or newer**. No `npm install` is needed: there are zero dependencies.

```bash
git clone <repo-url> roz && cd roz
npm start            # http://localhost:3000
```

Run the tests: `npm test` (10 tests: game rules + full API journey with a fake clock).
Dev mode with auto-restart: `npm run dev`.

| Env var | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `./data/roz.db` | SQLite file (created automatically) |

## Deploy (free)

`render.yaml` is included: connect the repo on Render, choose the free web service, deploy. Any host that runs Node 22 works (Railway, Fly, a VPS).
Note: free tiers have an ephemeral disk, so the demo database may reset on redeploy. See "What I left out" in the explainer.

## How it works

```
public/        Static client (vanilla JS, ~3.5 KB gzipped JS, no framework, no build step)
server/
  game.js      Pure rules: daily questions, points, streaks, levels, badges  (unit tested)
  app.js       HTTP API + static files, all game logic enforced server-side
  db.js        SQLite schema (users, attempts, append-only points ledger, badges)
  content.js   Question bank: add a row to add a question
test/          node:test suites
```

API: `POST /api/join`, `GET /api/me`, `GET /api/daily`, `POST /api/answer`, `POST /api/finish`, `GET /api/leaderboard`, `GET /api/ledger`.

## Design rules (because points are worth real money to players)

1. **Server decides everything.** Answer keys never reach the browser; each answer is checked on the server; points come only from `/api/finish`.
2. **One attempt per day**, same questions for everybody, so the leaderboard is fair.
3. **Every point is explained.** An append-only ledger shows exactly why each point was given ("Right answers", "Streak bonus"...).
4. **Too-fast finishes are rejected** (average under 1.5 s per question), plus a per-IP rate limit.
5. **The day is the Indian day.** It rolls over at midnight IST.

## Built for low-end phones and weak data

- First load is about 5 KB gzipped (HTML + JS + CSS). No images and no web fonts: pictures are emoji, audio is the phone's own text-to-speech.
- Works offline for the app shell (service worker); only answers need the network.
- Large tap targets (56 px+), high contrast, dark mode, reduced-motion respected, Hindi hints on by default (toggle).
