// Roz client: vanilla JS, no framework, no build step. Total payload target < 25 KB gzipped.
const $ = (s) => document.querySelector(s);
const app = $("#app"), tabs = $("#tabs");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
let token = store.get("roz.token"), showHi = store.get("roz.hi") !== "0", sound = true;
const KIND = { correct: "Right answers", complete: "Finished today", perfect: "Perfect day bonus", streak: "Streak bonus" };

async function api(path, body) {
  let r;
  try {
    r = await fetch(path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new Error("No internet. Please try again."); }
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) { token = null; store.set("roz.token", ""); go("join"); throw new Error(data.error); }
  if (!r.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
const speak = (text) => {
  if (!sound || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = "en-IN"; u.rate = 0.8; speechSynthesis.speak(u);
};
const buzz = (ms) => navigator.vibrate?.(ms);

function setTab(name) { tabs.hidden = !["home", "board", "points"].includes(name); tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.go === name)); }
tabs.onclick = (e) => { const b = e.target.closest("button"); if (b) go(b.dataset.go); };

async function go(view) {
  setTab(view);
  try { await views[view](); } catch (e) { if (view !== "join") app.innerHTML = `<div class="card center"><p class="err">${esc(e.message)}</p><button class="btn" id="retry">Try again</button></div>`; $("#retry")?.addEventListener("click", () => go(view)); }
}

const views = {
  async join() {
    app.innerHTML = `<h1>Roz 👋</h1><p>Learn English in 3 minutes a day. Listen, tap the right picture, earn points.</p>
      <form class="card" id="f"><label for="n"><b>Choose a name</b> <span class="muted">(other players will see it)</span></label>
      <input id="n" maxlength="16" autocomplete="nickname" placeholder="e.g. Ravi_22" required>
      <p class="err" id="e"></p><button class="btn">Start</button></form>`;
    $("#f").onsubmit = async (ev) => {
      ev.preventDefault();
      try { ({ token } = await api("/api/join", { nick: $("#n").value })); store.set("roz.token", token); go("home"); }
      catch (e) { $("#e").textContent = e.message; }
    };
  },
  async home() {
    if (!token) return go("join");
    const m = await api("/api/me");
    const pct = Math.round((m.into / m.span) * 100);
    app.innerHTML = `<div class="row"><h1>Hi ${esc(m.nick)}</h1><button class="btn ghost" id="hi" style="width:auto;min-height:44px;font-size:16px" aria-pressed="${showHi}">हिंदी ${showHi ? "on" : "off"}</button></div>
      <div class="card row"><div class="stat"><span class="big">🔥${m.streak}</span><small>day streak</small></div><div class="stat"><span class="big">${m.xp}</span><small>points</small></div><div class="stat"><span class="big">${m.level}</span><small>level</small></div></div>
      <div class="card"><div class="row"><span>Level ${m.level}</span><span class="muted">${m.span - m.into} points to level ${m.level + 1}</span></div><div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>
      ${m.doneToday ? `<div class="card center pop"><div class="big">✅</div><p><b>Done today: ${m.correctToday}/5 right.</b></p><p class="muted">Come back tomorrow to keep your streak. New questions at midnight.</p></div>`
        : `<button class="btn" id="play">▶ Play today’s 5 (3 min)</button>`}
      <h2>This week</h2><div class="week">${m.week.map((d) => `<span class="dot ${d.played ? "on" : ""}" title="${d.day}">${d.played ? "✓" : new Date(d.day + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "narrow", timeZone: "UTC" })}</span>`).join("")}</div>
      <h2>Badges</h2><div class="badges">${m.badges.map((b) => `<div class="badge ${b.earned ? "" : "off"}" title="${esc(b.how)}"><b>${b.icon}</b>${esc(b.name)}</div>`).join("")}</div>`;
    $("#play")?.addEventListener("click", () => go("play"));
    $("#hi").onclick = () => { showHi = !showHi; store.set("roz.hi", showHi ? "1" : "0"); go("home"); };
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
        <button class="btn ghost" id="say" aria-label="Play the sentence again">🔊 Listen again</button>
        <p class="say">${esc(q.say)}</p>${showHi ? "" : ""}
        <p class="muted">Which picture matches?</p>
        <div class="opts">${q.options.map((o) => `<button class="opt" data-id="${o.id}"><b>${o.emoji}</b>${esc(o.word)}</button>`).join("")}</div><p id="fb" class="center say"></p>`;
      $("#say").onclick = () => speak(q.say); speak(q.say);
      app.querySelector(".opts").onclick = async (e) => {
        const btn = e.target.closest(".opt"); if (!btn || btn.disabled) return;
        app.querySelectorAll(".opt").forEach((b) => (b.disabled = true));
        try {
          const r = await api("/api/answer", { qid: q.id, optionId: btn.dataset.id });
          btn.classList.add(r.correct ? "right" : "wrong");
          app.querySelector(`[data-id="${r.correctId}"]`).classList.add("right");
          const word = q.options.find((o) => o.id === r.correctId);
          $("#fb").innerHTML = `${r.correct ? "✅ Correct!" : "❌ It was " + esc(word.word)}${showHi ? `<br><small class="muted">${esc(q.hi)}</small>` : ""}`;
          buzz(r.correct ? 30 : [60, 40, 60]); i++;
          app.insertAdjacentHTML("beforeend", `<button class="btn" id="nx" style="margin-top:12px">${i >= d.questions.length ? "See my result" : "Next"}</button>`);
          $("#nx").onclick = next; $("#nx").focus();
        } catch (er) { $("#fb").innerHTML = `<span class="err">${esc(er.message)}</span>`; app.querySelectorAll(".opt").forEach((b) => (b.disabled = false)); }
      };
    };
    const finish = async () => {
      const r = await api("/api/finish", {});
      app.innerHTML = `<div class="card center pop"><div class="big">${r.correct === 5 ? "🎯" : "🎉"}</div><h1>${r.correct} of 5 right</h1>
        <p class="big" style="color:var(--gold)">+${r.total}</p><p class="muted">points</p>
        <table class="lb">${r.lines.map((l) => `<tr><td>${KIND[l.kind]}</td><td>+${l.points}</td></tr>`).join("")}</table>
        <p>🔥 ${r.streak}-day streak ${r.levelUp ? "· 🆙 <b>Level " + r.level + "!</b>" : ""}</p></div>
        <button class="btn" id="h">Done</button><button class="btn ghost" id="b" style="margin-top:8px">See leaderboard</button>`;
      $("#h").onclick = () => go("home"); $("#b").onclick = () => go("board"); buzz(80);
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
    app.innerHTML = `<h1>My points 🧾</h1><p class="muted">Every point you earned, and why.</p><div class="card">${d.lines.length ? `<table class="lb">${d.lines.map((l) => `<tr><td>${l.day}</td><td>${KIND[l.kind]}</td><td>+${l.points}</td></tr>`).join("")}</table>` : "<p class='center muted'>Nothing yet. Play today’s game!</p>"}</div>`;
  }
};

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
go(token ? "home" : "join");
