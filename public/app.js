// Roz client: vanilla JS, no framework, no build step.
import { scoreSpeech } from "./speech.js";

const $ = (s) => document.querySelector(s);
const app = $("#app"), tabs = $("#tabs");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
 };

let token = store.get("roz.token");
let showHi = store.get("roz.hi") !== "0";
let sound = store.get("roz.sound") !== "0";

// Robust Browser TTS detection (en-IN priority + hi-IN for Hindi hints)
let ttsAvailable = false;
let preferredVoice = null;
let hindiVoice = null;

function checkTTS() {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    ttsAvailable = false;
    return;
  }
  ttsAvailable = true;
  const selectVoice = () => {
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length > 0) {
        preferredVoice = voices.find((v) => v.lang === "en-IN" || v.lang === "en_IN")
          || voices.find((v) => v.lang.startsWith("en"))
          || voices[0]
          || null;
        hindiVoice = voices.find((v) => v.lang === "hi-IN" || v.lang === "hi_IN" || v.lang.startsWith("hi")) || null;
      }
    } catch {
      preferredVoice = null;
      hindiVoice = null;
    }
  };
  selectVoice();
  if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
    window.speechSynthesis.onvoiceschanged = selectVoice;
  }
}
checkTTS();

const KIND = {
  correct: "Right answers",
  complete: "Finished today",
  perfect: "Perfect day bonus",
  streak: "Streak bonus",
  sunday: "Sunday 2x bonus",
  speak: "Speaking challenge (practice)",
  practice: "Personal practice (practice)"
};

// Data usage metering per IST day
function addDailyBytes(bytes) {
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const key = "roz.data." + today;
  const current = Number(store.get(key) || 0);
  store.set(key, String(current + bytes));
}
function getDailyDataKB() {
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const bytes = Number(store.get("roz.data." + today) || 0);
  return (bytes / 1024).toFixed(1);
}

async function api(path, body) {
  let r;
  try {
    r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("No internet. Please check your data connection and tap to retry.");
  }
  const text = await r.text();
  addDailyBytes(text.length + 120); // Track payload & header bytes
  const data = text ? JSON.parse(text) : {};
  if (r.status === 401) {
    token = null;
    store.set("roz.token", "");
    go("join");
    throw new Error(data.error);
  }
  if (!r.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

const speak = (text) => {
  if (!sound || !ttsAvailable || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (preferredVoice) u.voice = preferredVoice;
    u.lang = preferredVoice?.lang || "en-IN";
    u.rate = 0.8;
    u.onerror = () => {};
    window.speechSynthesis.speak(u);
  } catch {}
};

const speakHindi = (text) => {
  if (!ttsAvailable || !("speechSynthesis" in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (hindiVoice) u.voice = hindiVoice;
    u.lang = hindiVoice?.lang || "hi-IN";
    u.rate = 0.85;
    u.onerror = () => {};
    window.speechSynthesis.speak(u);
  } catch {}
};

const buzz = (ms) => {
  try { navigator.vibrate?.(ms); } catch {}
};

function setTab(name) {
  tabs.hidden = !["home", "board", "points"].includes(name);
  tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.go === name));
}
tabs.onclick = (e) => {
  const b = e.target.closest("button");
  if (b) go(b.dataset.go);
};

async function go(view) {
  setTab(view);
  try {
    await views[view]();
  } catch (e) {
    if (view !== "join") {
      app.innerHTML = `<div class="card center"><p class="err">${esc(e.message)}</p><button class="btn" id="retry">Try again</button></div>`;
      $("#retry")?.addEventListener("click", () => go(view));
    }
  }
}

const views = {
  async join() {
    app.innerHTML = `<h1>Roz 👋</h1>
      <p class="muted">Hear it. Say it. Keep it. English in 3 minutes a day.</p>
      <div class="card intro-box">
        <div class="intro-row"><span>🎧</span><div><b>Listen & Match (सुनो और चुनो):</b> Hear everyday English sentences and tap the picture.</div></div>
        <div class="intro-row"><span>⏱️</span><div><b>3 Minutes Daily (रोज़ 3 मिनट):</b> 5 quick questions every day to build a habit.</div></div>
        <div class="intro-row"><span>💰</span><div><b>Real Rewards (इनाम पाओ):</b> Earn points, hold streaks, and climb the weekly board.</div></div>
      </div>
      <form class="card" id="f">
        <label for="n"><b>Choose a name</b> <span class="muted">(other players will see it)</span></label>
        <input id="n" maxlength="16" autocomplete="nickname" placeholder="e.g. Ravi_22" required>
        <p class="err" id="e"></p>
        <button class="btn" type="submit">Start</button>
      </form>`;
    $("#f").onsubmit = async (ev) => {
      ev.preventDefault();
      try {
        ({ token } = await api("/api/join", { nick: $("#n").value }));
        store.set("roz.token", token);
        go("home");
      } catch (e) {
        $("#e").textContent = e.message;
      }
    };
  },

  async home() {
    if (!token) return go("join");
    const m = await api("/api/me");
    const pct = Math.round((m.into / m.span) * 100);
    const dataUsedKB = getDailyDataKB();

    app.innerHTML = `<div class="row">
        <h1>Hi ${esc(m.nick)}</h1>
        <button class="btn ghost" id="hi" style="width:auto;min-height:48px;padding:8px 16px;font-size:16px" aria-pressed="${showHi}">हिंदी ${showHi ? "on" : "off"}</button>
      </div>
      <div class="row" style="margin:2px 0 10px;font-size:13px;color:var(--muted)">
        <span>📶 Data used today: <b>${dataUsedKB} KB</b></span>
        <span>🇮🇳 India Standard Time</span>
      </div>
      ${m.isSunday ? `<div class="card center banner-sunday pop"><div class="big">⚡ 2x</div><p><b>Sunday Double Points Day!</b></p><p class="muted">All points earned today are doubled. Play now!</p></div>`
        : `<p class="muted center" style="margin:4px 0 10px;font-size:14px">⚡ <b>Sunday Challenge:</b> All points are doubled every Sunday!</p>`}
      <div class="card row">
        <div class="stat"><span class="big">🔥${m.streak}</span><small>day streak</small></div>
        <div class="stat"><span class="big">${m.xp}</span><small>points</small></div>
        <div class="stat"><span class="big">${m.level}</span><small>level</small></div>
      </div>

      <div class="card">
        <div class="row"><span>Level ${m.level}</span><span class="muted">${m.span - m.into} points to level ${m.level + 1}</span></div>
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      </div>

      ${m.doneToday ? `<div class="card center pop"><div class="big">✅</div><p><b>Done today: ${m.correctToday}/5 right.</b></p><p class="muted">Come back tomorrow to keep your streak. New questions at midnight.</p></div>`
        : `<button class="btn" id="play">▶ Play today’s 5 (3 min)</button>`}

      <div class="card">
        <div class="row">
          <div><b>🧠 Memory (Spaced Repetition)</b><div class="muted" style="font-size:13px">Words you know: <b>${m.wordsKnown || 0}</b> · Due for review: <b>${m.dueCount || 0}</b></div></div>
          <button class="btn ghost btn-sm" id="prac-btn" style="width:auto">Practice</button>
        </div>
      </div>

      <h2>This week</h2>
      <div class="week">${m.week.map((d) => `<span class="dot ${d.played ? "on" : ""}" title="${d.day}">${d.played ? "✓" : new Date(d.day + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "narrow", timeZone: "UTC" })}</span>`).join("")}</div>
      <h2>Badges</h2>
      <div class="badges">${m.badges.map((b) => `<div class="badge ${b.earned ? "" : "off"}" title="${esc(b.how)}"><b>${b.icon}</b>${esc(b.name)}</div>`).join("")}</div>`;

    $("#play")?.addEventListener("click", () => go("play"));
    $("#prac-btn")?.addEventListener("click", () => go("practice"));
    $("#hi").onclick = () => {
      showHi = !showHi;
      store.set("roz.hi", showHi ? "1" : "0");
      go("home");
    };
  },

  async play() {
    const d = await api("/api/daily");
    if (d.done) return go("home");
    setTab("play");
    let i = Object.keys(d.answered).length;

    const next = () => {
      if (i >= d.questions.length) return speakingRound();
      const q = d.questions[i];
      app.innerHTML = `<div class="progress">${d.questions.map((_, k) => `<i class="${k < i ? "d" : ""}"></i>`).join("")}</div>
        <p class="muted">Question ${i + 1} of ${d.questions.length}</p>
        ${ttsAvailable ? `
          <div class="row" style="margin-bottom:8px">
            <button class="btn ghost sound-btn" id="say" aria-label="Listen to sentence again" style="flex:1;min-height:48px">🔊 Listen again</button>
            <button class="btn ghost mute-btn" id="mute" aria-label="Toggle sound" aria-pressed="${!sound}" style="width:auto;min-width:48px;min-height:48px;padding:8px 14px;font-size:15px">${sound ? "🔊 Sound on" : "🔇 Muted"}</button>
          </div>`
          : `<div class="sound-warn" role="status"><span>🔇</span> Sound unavailable on this browser. Please read the sentence below:</div>`}
        <p class="say">${esc(q.say)}</p>
        ${showHi ? `<div class="row" style="margin:4px 0 10px"><p class="devanagari" style="margin:0">${esc(q.hi)}</p>${hindiVoice ? `<button class="btn ghost btn-sm" id="hi-voice">🔊 सुनो</button>` : ""}</div>` : ""}
        <p class="muted">Which picture matches?</p>
        <div class="opts">${q.options.map((o) => `<button class="opt" data-id="${o.id}"><b>${o.emoji}</b>${esc(o.word)}</button>`).join("")}</div>
        <div id="fb" class="center say" aria-live="assertive" role="alert" style="min-height:1.5em;margin-top:12px"></div>`;

      if (ttsAvailable) {
        $("#say").onclick = () => speak(q.say);
        $("#mute").onclick = () => {
          sound = !sound;
          store.set("roz.sound", sound ? "1" : "0");
          $("#mute").textContent = sound ? "🔊 Sound on" : "🔇 Muted";
          $("#mute").setAttribute("aria-pressed", String(!sound));
          if (sound) speak(q.say);
        };
        speak(q.say);
      }
      if (showHi && hindiVoice && $("#hi-voice")) {
        $("#hi-voice").onclick = () => speakHindi(q.hi);
      }

      app.querySelector(".opts").onclick = async (e) => {
        const btn = e.target.closest(".opt");
        if (!btn || btn.disabled) return;
        app.querySelectorAll(".opt").forEach((b) => (b.disabled = true));
        try {
          const r = await api("/api/answer", { qid: q.id, optionId: btn.dataset.id });
          btn.classList.add(r.correct ? "right" : "wrong");
          app.querySelector(`[data-id="${r.correctId}"]`).classList.add("right");
          const word = q.options.find((o) => o.id === r.correctId);
          $("#fb").innerHTML = `${r.correct ? "✅ Correct!" : "❌ It was " + esc(word.word)}${showHi ? `<br><small class="devanagari">${esc(q.hi)}</small>` : ""}`;
          buzz(r.correct ? 30 : [60, 40, 60]);
          i++;
          app.insertAdjacentHTML("beforeend", `<button class="btn" id="nx" style="margin-top:14px">${i >= d.questions.length ? "Continue to Speaking Challenge 🎙️" : "Next"}</button>`);
          $("#nx").onclick = next;
          $("#nx").focus();
        } catch (er) {
          $("#fb").innerHTML = `<span class="err">${esc(er.message)}</span>`;
          app.querySelectorAll(".opt").forEach((b) => (b.disabled = false));
        }
      };
    };

    // Phase 2: "Say it" Speaking Round
    const speakingRound = () => {
      const targetSentence = d.questions[0].say;
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

      app.innerHTML = `<div class="card speech-box pop">
        <span class="tag tag-brand">Round 2 · Speaking Challenge</span>
        <h2>Say it out loud 🎙️</h2>
        <p class="muted">Tap the mic and speak the sentence clearly in English.</p>
        <p class="say center" id="target-phrase">"${esc(targetSentence)}"</p>
        <button class="btn ghost btn-sm" id="listen-speak" style="margin:0 auto 12px;display:block">🔊 Listen to phrase</button>
        <div id="words-display" class="center" style="font-size:22px;margin:12px 0;min-height:36px"></div>
        <p class="muted center" style="font-size:12px;line-height:1.4">Note: On Android Chrome, audio recognition is processed by your device and browser. Practice points only (does not affect leaderboard ranking).</p>
        <div id="speech-action">
          ${SpeechRec ? `
            <button class="btn" id="mic-btn" style="margin-top:12px">🎙️ Tap to Speak</button>
            <p id="mic-status" class="muted center" style="margin-top:8px;font-size:14px">Tap button and speak into your phone mic</p>`
            : `<div class="sound-warn">Microphone speech recognition is not supported on this browser.</div>
               <button class="btn ghost" id="skip-speech">I spoke it aloud · Continue</button>`}
        </div>
      </div>
      <button class="btn ghost" id="finish-btn" style="margin-top:10px">Skip to result</button>`;

      $("#listen-speak")?.addEventListener("click", () => speak(targetSentence));
      $("#finish-btn")?.addEventListener("click", () => finish(false));
      $("#skip-speech")?.addEventListener("click", () => finish(false));

      if (SpeechRec) {
        let recognition = null;
        try {
          recognition = new SpeechRec();
          recognition.lang = "en-IN";
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
        } catch {
          recognition = null;
        }

        if (!recognition) {
          $("#speech-action").innerHTML = `<button class="btn ghost" id="skip-speech">I spoke it aloud · Continue</button>`;
          $("#skip-speech").onclick = () => finish(false);
          return;
        }

        $("#mic-btn").onclick = () => {
          try {
            $("#mic-btn").classList.add("mic-pulse");
            $("#mic-btn").textContent = "🔴 Listening... Speak now";
            $("#mic-status").textContent = "Say: \"" + targetSentence + "\"";
            recognition.start();
          } catch {
            recognition.stop();
          }
        };

        recognition.onresult = (ev) => {
          $("#mic-btn").classList.remove("mic-pulse");
          $("#mic-btn").textContent = "🎙️ Try Again";
          const transcript = ev.results[0][0].transcript;
          const evaluation = scoreSpeech(targetSentence, transcript);

          const formattedWords = evaluation.words.map((w) =>
            `<span class="${w.matched ? "word-match" : "word-miss"}">${esc(w.word)}</span>`
          ).join(" ");

          $("#words-display").innerHTML = formattedWords;
          $("#mic-status").innerHTML = `<b>Match score: ${evaluation.score}%</b> ${evaluation.passed ? "🎉 Passed! +10 practice points" : "Keep trying (need 70%)"}`;

          if (evaluation.passed) {
            buzz(40);
            $("#speech-action").innerHTML = `<div class="card center" style="background:color-mix(in srgb,var(--good) 12%,var(--card));border:1.5px solid var(--good);padding:12px;margin-top:10px">
              <p style="margin:0;font-weight:700;color:var(--good)">✅ Speaking challenge passed (+10 pts)!</p>
              <button class="btn" id="claim-speak" style="margin-top:12px">See my result</button>
            </div>`;
            $("#claim-speak").onclick = () => finish(true);
          }
        };

        recognition.onerror = () => {
          $("#mic-btn").classList.remove("mic-pulse");
          $("#mic-btn").textContent = "🎙️ Tap to Speak";
          $("#mic-status").textContent = "Microphone unavailable or blocked. You can still finish!";
        };
      }
    };

    const finish = async (speakPassed = false) => {
      const r = await api("/api/finish", { speakPassed });
      app.innerHTML = `<div class="card center pop"><div class="big">${r.correct === 5 ? "🎯" : "🎉"}</div><h1>${r.correct} of 5 right</h1>
        <p class="big" style="color:var(--gold)">+${r.total}</p><p class="muted">points</p>
        <table class="lb">${r.lines.map((l) => `<tr><td>${KIND[l.kind] || l.kind}</td><td>+${l.points}</td></tr>`).join("")}</table>
        <p>🔥 ${r.streak}-day streak ${r.levelUp ? "· 🆙 <b>Level " + r.level + "!</b>" : ""}</p></div>
        <button class="btn" id="h">Done</button>
        <button class="btn ghost" id="b" style="margin-top:8px">See leaderboard</button>`;
      $("#h").onclick = () => go("home");
      $("#b").onclick = () => go("board");
      buzz(80);
    };

    next();
  },

  // Phase 3: Personal Practice with Spaced Repetition (Leitner)
  async practice() {
    const d = await api("/api/practice");
    if (!d.questions.length) {
      app.innerHTML = `<h1>Personal Practice 🧠</h1>
        <div class="card center pop">
          <div class="big">🌟</div>
          <h2>All caught up!</h2>
          <p class="muted">No words are due for review right now. Come back tomorrow or play the daily challenge to add new words.</p>
        </div>
        <button class="btn" id="back-home">Back to Home</button>`;
      $("#back-home").onclick = () => go("home");
      return;
    }

    let idx = 0;
    let earnedSession = 0;

    const renderPracticeQ = () => {
      if (idx >= d.questions.length) {
        app.innerHTML = `<div class="card center pop">
          <div class="big">🎉</div>
          <h1>Practice Complete!</h1>
          <p class="big" style="color:var(--gold)">+${earnedSession}</p>
          <p class="muted">practice points earned today</p>
          <p class="muted" style="font-size:13px">Practice points build memory and level XP without affecting weekly leaderboard fairness.</p>
        </div>
        <button class="btn" id="p-home">Done</button>`;
        $("#p-home").onclick = () => go("home");
        return;
      }

      const q = d.questions[idx];
      app.innerHTML = `<div class="row"><span class="tag tag-brand">Memory Practice</span><span class="muted">${idx + 1} of ${d.questions.length}</span></div>
        <p class="say">${esc(q.say)}</p>
        ${showHi ? `<p class="devanagari">${esc(q.hi)}</p>` : ""}
        <div class="opts">${q.options.map((o) => `<button class="opt" data-word="${esc(o.word)}"><b>${o.emoji}</b>${esc(o.word)}</button>`).join("")}</div>
        <div id="p-fb" class="center say" aria-live="assertive" role="alert" style="min-height:1.5em;margin-top:12px"></div>`;

      speak(q.say);
      app.querySelector(".opts").onclick = async (e) => {
        const btn = e.target.closest(".opt");
        if (!btn || btn.disabled) return;
        app.querySelectorAll(".opt").forEach((b) => (b.disabled = true));
        try {
          const res = await api("/api/practice/check", { qid: q.id, word: btn.dataset.word });
          btn.classList.add(res.correct ? "right" : "wrong");
          earnedSession += res.awarded || 0;
          $("#p-fb").innerHTML = `${res.correct ? `✅ Correct! (+${res.awarded} pts)` : `❌ Correct word: ${esc(res.correctWord)}`}<br><small class="muted">Memory Box: ${res.newBox}/5</small>`;
          idx++;
          app.insertAdjacentHTML("beforeend", `<button class="btn" id="p-next" style="margin-top:14px">Next word</button>`);
          $("#p-next").onclick = renderPracticeQ;
          $("#p-next").focus();
        } catch (err) {
          $("#p-fb").innerHTML = `<span class="err">${esc(err.message)}</span>`;
          app.querySelectorAll(".opt").forEach((b) => (b.disabled = false));
        }
      };
    };

    renderPracticeQ();
  },

  async board() {
    const d = await api("/api/leaderboard");
    app.innerHTML = `<h1>This week 🏆</h1>
      <p class="muted">Points from Monday. Resets every Monday at midnight IST. (Practice points excluded for fairness).</p>
      <div class="card">${d.top.length ? `<table class="lb">${d.top.map((r) => `<tr class="${r.me ? "me" : ""}"><td>${r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</td><td>${esc(r.nick)}${r.me ? " (you)" : ""}</td><td>${r.pts}</td></tr>`).join("")}</table>` : "<p class='center muted'>No one has played this week yet. Be first!</p>"}</div>
      ${d.me && d.me.rank > 20 ? `<p class="center">You are #${d.me.rank} with ${d.me.pts} points.</p>` : ""}`;
  },

  async points() {
    const [d, v] = await Promise.all([
      api("/api/ledger"),
      api("/api/ledger/verify").catch(() => ({ ok: false }))
    ]);
    app.innerHTML = `<h1>My points 🧾</h1>
      <p class="muted">Every point you earned, and why.</p>
      ${v.ok ? `
        <div class="card center pop" style="background:color-mix(in srgb,var(--good) 12%,var(--card));border:1.5px solid var(--good);padding:14px">
          <p style="margin:0;font-weight:700;color:var(--good)">🛡️ Verified: ${v.count} entries, none altered</p>
          <p class="muted" style="margin:4px 0 0;font-size:13px">Your points are chained so nobody can quietly change them.</p>
        </div>`
        : `<div class="card center" style="background:color-mix(in srgb,var(--bad) 12%,var(--card));border:1.5px solid var(--bad);padding:14px">
          <p style="margin:0;font-weight:700;color:var(--bad)">⚠️ Integrity Alert: Points chain broken at record #${v.brokenAtId}!</p>
        </div>`}
      <div class="card">${d.lines.length ? `<table class="lb">${d.lines.map((l) => `<tr><td>${l.day}</td><td>${KIND[l.kind] || l.kind}</td><td>+${l.points}</td></tr>`).join("")}</table>` : "<p class='center muted'>Nothing yet. Play today’s game!</p>"}</div>`;
  }
};

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
go(token ? "home" : "join");
