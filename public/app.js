// Roz client: vanilla JS, no framework, no build step. Total payload target < 25 KB gzipped.
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

// Robust Browser TTS detection (en-IN priority, graceful degradation)
let ttsAvailable = false;
let preferredVoice = null;

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
      }
    } catch {
      preferredVoice = null;
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
  sunday: "Sunday 2x bonus"
};

async function api(path, body) {
  let r;
  try {
    r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("No internet. Please check your data connection and try again.");
  }
  const data = await r.json().catch(() => ({}));
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
    u.onerror = () => {}; // Never block or fail the game on speech error
    window.speechSynthesis.speak(u);
  } catch {
    // Audio failures must never block play
  }
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
      <p class="muted">English in 3 minutes a day.</p>
      <div class="card intro-box">
        <div class="intro-row"><span>🎧</span><div><b>Listen & Match:</b> Hear everyday English and tap the matching picture.</div></div>
        <div class="intro-row"><span>⏱️</span><div><b>3 Minutes a Day:</b> 5 quick questions daily to build a real listening habit.</div></div>
        <div class="intro-row"><span>💰</span><div><b>Real Rewards:</b> Earn points, maintain streaks, and climb the leaderboard.</div></div>
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
    app.innerHTML = `<div class="row">
        <h1>Hi ${esc(m.nick)}</h1>
        <button class="btn ghost" id="hi" style="width:auto;min-height:48px;padding:8px 16px;font-size:16px" aria-pressed="${showHi}">हिंदी ${showHi ? "on" : "off"}</button>
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
      <h2>This week</h2>
      <div class="week">${m.week.map((d) => `<span class="dot ${d.played ? "on" : ""}" title="${d.day}">${d.played ? "✓" : new Date(d.day + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "narrow", timeZone: "UTC" })}</span>`).join("")}</div>
      <h2>Badges</h2>
      <div class="badges">${m.badges.map((b) => `<div class="badge ${b.earned ? "" : "off"}" title="${esc(b.how)}"><b>${b.icon}</b>${esc(b.name)}</div>`).join("")}</div>`;
    $("#play")?.addEventListener("click", () => go("play"));
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
      if (i >= d.questions.length) return finish();
      const q = d.questions[i];
      app.innerHTML = `<div class="progress">${d.questions.map((_, k) => `<i class="${k < i ? "d" : ""}"></i>`).join("")}</div>
        <p class="muted">Question ${i + 1} of ${d.questions.length}</p>
        ${ttsAvailable ? `
          <div class="row" style="margin-bottom:8px">
            <button class="btn ghost" id="say" aria-label="Listen to sentence again" style="flex:1;min-height:48px">🔊 Listen again</button>
            <button class="btn ghost" id="mute" aria-label="Toggle sound" aria-pressed="${!sound}" style="width:auto;min-width:48px;min-height:48px;padding:8px 14px;font-size:15px">${sound ? "🔊 Sound on" : "🔇 Muted"}</button>
          </div>`
          : `<div class="sound-warn" role="status"><span>🔇</span> Sound unavailable on this browser. Please read the sentence below:</div>`}
        <p class="say">${esc(q.say)}</p>
        ${showHi ? `<p class="devanagari">${esc(q.hi)}</p>` : ""}
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
          app.insertAdjacentHTML("beforeend", `<button class="btn" id="nx" style="margin-top:14px">${i >= d.questions.length ? "See my result" : "Next"}</button>`);
          $("#nx").onclick = next;
          $("#nx").focus();
        } catch (er) {
          $("#fb").innerHTML = `<span class="err">${esc(er.message)}</span>`;
          app.querySelectorAll(".opt").forEach((b) => (b.disabled = false));
        }
      };
    };

    const finish = async () => {
      const r = await api("/api/finish", {});
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

  async board() {
    const d = await api("/api/leaderboard");
    app.innerHTML = `<h1>This week 🏆</h1><p class="muted">Points from Monday. Resets every Monday.</p>
      <div class="card">${d.top.length ? `<table class="lb">${d.top.map((r) => `<tr class="${r.me ? "me" : ""}"><td>${r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</td><td>${esc(r.nick)}${r.me ? " (you)" : ""}</td><td>${r.pts}</td></tr>`).join("")}</table>` : "<p class='center muted'>No one has played this week yet. Be first!</p>"}</div>
      ${d.me && d.me.rank > 20 ? `<p class="center">You are #${d.me.rank} with ${d.me.pts} points.</p>` : ""}`;
  },

  async points() {
    const d = await api("/api/ledger");
    app.innerHTML = `<h1>My points 🧾</h1><p class="muted">Every point you earned, and why.</p>
      <div class="card">${d.lines.length ? `<table class="lb">${d.lines.map((l) => `<tr><td>${l.day}</td><td>${KIND[l.kind] || l.kind}</td><td>+${l.points}</td></tr>`).join("")}</table>` : "<p class='center muted'>Nothing yet. Play today’s game!</p>"}</div>`;
  }
};

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
go(token ? "home" : "join");
