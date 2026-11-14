/* Code School: the screens. Talks to the C# engine through the WebView2 bridge (see Engine.cs). */
{
"use strict";
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/* ---------- bridge to the app engine (falls back to a local dev server when opened in a browser) ---------- */
const host = window.chrome && window.chrome.webview;
const pending = {}; let seq = 0;
const partials = {};
if (host) host.addEventListener("message", e => {
  const d = e.data || {};
  if (d.partial != null) { if (partials[d.id]) partials[d.id](d.partial); return; }   // a streamed piece of a coach answer
  const f = pending[d.id]; if (f) { delete pending[d.id]; delete partials[d.id]; f(d.result || {}); }
});
function call(type, payload, onPartial) {
  if (host) return new Promise(res => { const id = String(++seq); pending[id] = res; if (onPartial) partials[id] = onPartial; host.postMessage({id, type, payload: payload || {}}); });
  return fetch("/api/" + type, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})})
    .then(r => r.json()).catch(() => ({error: "The engine isn't running."}));
}

/* ---------- course: written units + projects + units the coach teaches live ---------- */
const JOB = window.ON_THE_JOB || {};
const UNITS = window.COURSE.map((u, i) => ({...u, n: i + 1, lessons: u.lessons.map((l, j) => ({...l, key: u.id + "_" + j, unit: u.name, color: u.color,
  steps: JOB[l.t] ? [...l.steps, {k: "L", h: "On the job", t: JOB[l.t]}] : l.steps}))}));
window.LATER.forEach(([id, name, color, topics]) => UNITS.push({id, name, color, n: UNITS.length + 1, sub: "Taught live by your coach",
  lessons: topics.map((t, j) => ({t, gen: true, key: id + "_" + j, unit: name, color}))}));
const PROJECTS = window.PROJECTS.map(p => ({...p, key: p.id, unit: "Project", project: true}));
const LESSONS = UNITS.flatMap(u => u.lessons);
const byKey = k => LESSONS.find(l => l.key === k) || PROJECTS.find(p => p.key === k);

/* ---------- saved progress ---------- */
let S = {done: {}, ran: 0, days: [], missed: [], gen: {}, carry: {}, rev: {}};
const today = () => new Date().toISOString().slice(0, 10);
let saveTimer = 0;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => call("save", {data: S}), 300); }
const doneCount = () => Object.keys(S.done).length;
const nextLesson = () => LESSONS.find(l => !S.done[l.key]) || LESSONS[LESSONS.length - 1];

/* ---------- small text renderer: paragraphs, `inline code`, ```blocks``` ---------- */
function rich(box, text) {
  String(text || "").split(/```(?:\w+)?\n?/).forEach((part, i) => {
    if (i % 2) { box.append(el("pre", null, part.replace(/\n$/, ""))); return; }
    part.split(/\n{2,}/).forEach(par => {
      if (!par.trim()) return;
      const p = el("p");
      par.split(/`([^`]+)`/).forEach((bit, k) => p.append(k % 2 ? el("code", null, bit) : bit));
      box.append(p);
    });
  });
}

/* ---------- voice coach: natural voices (Piper, on this PC) or Windows voices; speaks praise and reads steps on request ---------- */
const VOICE = {catalog: null, have: {ready: false}, audio: null, token: 0, cache: new Map(), busy: false};
const SPEEDS = [["Relaxed", 0.88], ["Normal", 1], ["Quick", 1.14]];
const winVoices = () => window.speechSynthesis ? speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)) : [];
function bestWin() {
  const vs = winVoices(), want = (S.voiceKey || "").startsWith("win:") ? S.voiceKey.slice(4) : "";
  const score = v => (v.name === want ? 100 : 0) + (/natural|neural|online/i.test(v.name) ? 20 : 0) + (/aria|jenny|ava|emma|andrew|brian|guy|michelle|sonia|libby/i.test(v.name) ? 6 : 0) + (/en-US/i.test(v.lang) ? 2 : 0) + (/zira|david|mark/i.test(v.name) ? -3 : 0);
  return [...vs].sort((a, b) => score(b) - score(a))[0] || null;
}
const natural = () => { const k = S.voiceKey || ""; return VOICE.have.ready && /^k:\d+$/.test(k) ? +k.slice(2) : null; };   // Kokoro voice number, or null
const voiceLabel = () => { const k = natural(); if (k != null) return (VOICE.catalog.voices.find(v => v.sid === k) || {}).name || "Natural"; const w = bestWin(); return w ? w.name.replace(/^Microsoft\s+/, "").replace(/\s*-.*$/, "").replace(/\s*\(.*$/, "") : "Pick a voice"; };
const voiceOn = () => S.voice !== false;
const cleanSpeech = t => String(t || "").replace(/```[\s\S]*?```/g, " (see the code on screen) ").replace(/[`*#_>]/g, "").replace(/\s+/g, " ").trim().slice(0, 1500);
function talking(on) { $("voicebox").classList.toggle("talking", on); }
function hush() { VOICE.token++; if (VOICE.audio) { VOICE.audio.pause(); VOICE.audio = null; } if (window.speechSynthesis) speechSynthesis.cancel(); talking(false); }
function chunks(t) {                                        // short pieces, so the first words start quickly
  const out = []; let buf = "";
  (t.match(/[^.!?]+[.!?]*\s*/g) || [t]).forEach(s => { if ((buf + s).length > 240 && buf) { out.push(buf); buf = ""; } buf += s; });
  if (buf.trim()) out.push(buf); return out;
}
function synth(sid, text) {
  const id = sid + "|" + (S.voiceSpeed || 1) + "|" + text;
  if (VOICE.cache.has(id)) return VOICE.cache.get(id);
  const p = call("say", {sid, text, speed: S.voiceSpeed || 1}).then(r => r.audio ? "data:audio/wav;base64," + r.audio : null);
  VOICE.cache.set(id, p); if (VOICE.cache.size > 40) VOICE.cache.delete(VOICE.cache.keys().next().value);
  p.then(u => { if (!u) VOICE.cache.delete(id); });
  return p;
}
const play = (url, my) => new Promise(res => {
  if (my !== VOICE.token) return res();
  const a = new Audio(url); VOICE.audio = a; a.onended = a.onerror = () => res(); talking(true); a.play().catch(() => res());
});
function winSpeak(t) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(t), v = bestWin(); if (v) u.voice = v;
  u.rate = 1.03 * (S.voiceSpeed || 1); u.pitch = 1.04;
  u.onstart = () => talking(true); u.onend = u.onerror = () => talking(false);
  speechSynthesis.speak(u);
}
async function speak(text, force, sidOverride) {
  if (!voiceOn() && !force) return;
  hush(); const my = VOICE.token, t = cleanSpeech(text); if (!t) return;
  const key = sidOverride != null ? sidOverride : natural();
  if (key == null) return winSpeak(t);
  const parts = chunks(t); let next = synth(key, parts[0]);
  $("voicebox").classList.add("warming");
  for (let i = 0; i < parts.length; i++) {
    const url = await next; $("voicebox").classList.remove("warming");
    if (my !== VOICE.token) return;
    if (i + 1 < parts.length) next = synth(key, parts[i + 1]);   // make the next piece while this one plays
    if (!url) { winSpeak(parts.slice(i).join(" ")); return; }    // the natural voice failed: never go silent
    await play(url, my);
  }
  if (my === VOICE.token) talking(false);
}
function drawVoice() {
  const b = $("voice-toggle"); b.textContent = voiceOn() ? "On" : "Off"; b.setAttribute("aria-pressed", String(voiceOn()));
  $("voice-name").textContent = voiceOn() ? voiceLabel() : "Muted";
}
async function loadVoices() {
  try { VOICE.catalog = await (await fetch("voices.json")).json(); } catch { VOICE.catalog = {voices: []}; }
  const r = await call("voices"); if (r && !r.error) VOICE.have = r;
  drawVoice();
}
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = drawVoice;
$("voice-toggle").addEventListener("click", () => { S.voice = !voiceOn(); if (!S.voice) hush(); drawVoice(); save(); if (S.voice) speak("Voice coach is on. I've got your back.", true); });
$("voice-pick").addEventListener("click", openVoices);
function listenButton(getText) { const b = el("button", "listen", "Read it to me"); b.addEventListener("click", () => speak(getText(), true)); return b; }

/* the voice picker: hear each voice, download natural ones with one click, set the speed */
const SAMPLE = n => `Hey Dilan, I'm ${n}. You're doing really well. Let's write some code together.`;
function openVoices() {
  const d = $("voicepick"), body = $("vp-body"); body.replaceChildren();
  const sp = el("div", "seg"); sp.setAttribute("role", "group"); sp.setAttribute("aria-label", "Speaking speed");
  SPEEDS.forEach(([name, v]) => { const b = el("button", (S.voiceSpeed || 1) === v ? "on" : "", name); b.setAttribute("aria-pressed", String((S.voiceSpeed || 1) === v));
    b.addEventListener("click", () => { S.voiceSpeed = v; save(); openVoices(); speak("This is how fast I'll talk.", true); }); sp.append(b); });
  const speedRow = el("div", "vp-row"); speedRow.append(el("b", null, "Speed"), sp); body.append(speedRow);

  const C = VOICE.catalog, ready = VOICE.have.ready;
  body.append(el("h3", null, "Natural voices"), el("p", "note", ready ? "These sound the most human. They run on your PC, offline." : `These sound the most human (they're made by Kokoro and run on your PC, offline). One download unlocks all ${C.voices.length}: about ${C.engine.mb + C.pack.mb} MB, one time.`));
  if (!ready) {
    const box = el("div", "vget"), get = el("button", "go", `Download the natural voices · about ${C.engine.mb + C.pack.mb} MB`);
    const bar = el("div", "vbar"), fill = el("i"); bar.append(fill); bar.hidden = true;
    const msg = el("small", "vmsg");
    get.addEventListener("click", async () => {
      if (VOICE.busy) return; VOICE.busy = true; get.disabled = true; bar.hidden = false; msg.textContent = "Starting…";
      const r = await call("voice_get", {}, p => {
        if (p.startsWith("pct ")) { fill.style.width = p.slice(4) + "%"; msg.textContent = msg.dataset.step + " · " + p.slice(4) + "%"; }
        else if (p.startsWith("step ")) { fill.style.width = "0%"; msg.dataset.step = p.slice(5); msg.textContent = p.slice(5) + "…"; }
      });
      VOICE.busy = false;
      if (r.error) { msg.textContent = r.error; get.disabled = false; bar.hidden = true; return; }
      const l = await call("voices"); if (l && !l.error) VOICE.have = l;
      S.voiceKey = "k:" + C.voices[0].sid; S.voice = true; save(); drawVoice(); openVoices(); speak(SAMPLE(C.voices[0].name), true);
    });
    box.append(get, bar, msg); body.append(box);
  }
  const grid = el("div", "vp-grid"); body.append(grid);
  C.voices.forEach((v, i) => {
    const using = natural() === v.sid;
    const c = el("div", "vcard" + (using ? " using" : "") + (ready ? "" : " locked")); c.style.setProperty("--i", i);
    const top = el("div", "vtop"); top.append(el("span", "vav", v.name[0]), el("div"));
    top.lastChild.append(el("b", null, v.name), el("small", null, v.who));
    if (v.best) top.append(el("span", "tag", "Most natural"));
    c.append(top, el("p", "note", v.blurb));
    if (ready) {
      const row = el("div", "vbtns");
      const hear = el("button", null, "Hear it"); hear.addEventListener("click", () => speak(SAMPLE(v.name), true, v.sid));
      const use = el("button", using ? "go" : "", using ? "In use" : "Use this"); use.disabled = using;
      use.addEventListener("click", () => { S.voiceKey = "k:" + v.sid; S.voice = true; save(); drawVoice(); openVoices(); speak(SAMPLE(v.name), true); });
      row.append(hear, use); c.append(row);
    }
    grid.append(c);
  });

  const wv = winVoices();
  body.append(el("h3", null, "Built into Windows"), el("p", "note", wv.length ? "These work right away, no download. They sound more robotic." : "No Windows voices were found on this PC."));
  const list = el("div", "vp-list"); body.append(list);
  wv.forEach(w => {
    const k = "win:" + w.name, using = !natural() && bestWin() === w;
    const r = el("div", "vrow" + (using ? " using" : "")); r.append(el("span", null, w.name.replace(/^Microsoft\s+/, "")));
    const hear = el("button", null, "Hear it"); hear.addEventListener("click", () => { hush(); const u = new SpeechSynthesisUtterance(SAMPLE(w.name.split(" ")[1] || "your coach")); u.voice = w; u.rate = 1.03 * (S.voiceSpeed || 1); speechSynthesis.speak(u); });
    const use = el("button", using ? "go" : "", using ? "In use" : "Use this"); use.disabled = using;
    use.addEventListener("click", () => { S.voiceKey = k; S.voice = true; save(); drawVoice(); openVoices(); });
    r.append(hear, use); list.append(r);
  });
  if (!d.open) d.showModal();
}
$("vp-close").addEventListener("click", () => $("voicepick").close());
$("voicepick").addEventListener("click", e => { if (e.target === $("voicepick")) $("voicepick").close(); });

/* ---------- views ---------- */
function moveGlide() {                                       // the sidebar highlight glides to the place you picked
  const on = document.querySelector(".nav.on"), g = $("glide"); if (!on || !g) return;
  const first = !g.classList.contains("ready");
  if (first) g.style.transition = "none";                    // appear in place the first time, glide after that
  g.style.transform = `translateY(${on.offsetTop}px)`; g.style.height = on.offsetHeight + "px";
  if (first) { void g.offsetHeight; g.style.transition = ""; g.classList.add("ready"); }
}
window.addEventListener("resize", moveGlide);
let view = "route";
document.querySelectorAll(".nav").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));
function show(v) {
  view = v;
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  moveGlide();
  const main = $("main"); main.replaceChildren(); main.scrollTop = 0;
  ({route: drawRoute, projects: drawProjects, practice: drawPractice, playground: drawPlayground, coach: drawCoach})[v](main);
  $("side-note").textContent = doneCount() ? `${doneCount()} lesson${doneCount() === 1 ? "" : "s"} done` : "";
}
function countUp(b) {
  const end = parseInt(b.textContent, 10) || 0; if (!end || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const t0 = performance.now(), dur = 700;
  const tick = now => { const k = Math.min(1, (now - t0) / dur); b.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function greeting() { const h = new Date().getHours(); return h < 5 ? "Up late, Dilan" : h < 12 ? "Good morning, Dilan" : h < 18 ? "Good afternoon, Dilan" : "Good evening, Dilan"; }

function drawRoute(main) {
  const v = el("div", "view"); main.append(v);
  v.append(el("h1", null, greeting()));
  v.append(el("p", "lead", doneCount() ? "Pick up where you left off. Every stop is about 5 to 8 minutes." : "This is your route from zero to working in tech. Ride it one stop at a time: read a little, watch code run, then write your own."));
  const nx = nextLesson(), hero = el("div", "hero"), card = el("div", "next");
  card.style.setProperty("--c", nx.color);
  card.append(el("small", null, (doneCount() ? "Up next · " : "Start here · ") + nx.unit), el("h2", null, nx.t),
    el("div", "note", nx.gen ? "Your coach writes this lesson for you" : `${(nx.steps || []).length} steps · about ${Math.max(4, Math.round((nx.steps || []).length * 0.8))} minutes`));
  const go = el("button", "go", doneCount() ? "Keep going" : "Start my first lesson"); go.addEventListener("click", () => openLesson(nx)); card.append(go);
  const facts = el("div", "facts");
  [[doneCount(), "lessons done"], [S.ran, "programs you ran"], [S.days.length, S.days.length === 1 ? "day learning" : "days learning"]]
    .forEach(([n, t]) => { const f = el("div", "fact"); f.append(el("b", null, String(n)), el("span", null, t)); facts.append(f); });
  hero.append(card, facts); v.append(hero);
  hero.classList.add("rise");
  facts.querySelectorAll("b").forEach(b => countUp(b));
  const due = dueReviews();
  if (due.length) {
    const r = el("div", "review"); r.append(el("div", null, `${due.length} question${due.length === 1 ? "" : "s"} from earlier lessons ${due.length === 1 ? "is" : "are"} ready for review. Two minutes now keeps them from fading.`));
    const b = el("button", "go", "Review now"); b.addEventListener("click", startReview); r.append(b); v.append(r);
  }
  const map = el("div", "map"); v.append(map);
  UNITS.forEach(u => {
    const box = el("section", "unit"); box.style.setProperty("--c", u.color);
    const fin = u.lessons.filter(l => S.done[l.key]).length;
    const h = el("div", "uhead"), t = el("div"); t.append(el("b", null, u.name), el("span", null, u.sub));
    h.append(el("i", null, String(u.n)), t, el("span", "pct", `${fin} of ${u.lessons.length}`));
    const bar = el("div", "ubar"), fill = el("i"); bar.append(fill); requestAnimationFrame(() => { fill.style.width = Math.round(100 * fin / u.lessons.length) + "%"; });
    box.classList.add("rise"); box.style.animationDelay = Math.min(u.n * 45, 700) + "ms";
    const line = el("div", "line");
    const stops = [...u.lessons, ...PROJECTS.filter(p => p.after === u.id)];
    stops.forEach(l => {
      const b = el("button", "stop" + (S.done[l.key] ? " done" : "") + (l === nx ? " here" : "") + (l.project ? " proj" : ""));
      b.append(el("span", "dot"), el("span", null, l.project ? "Project: " + l.t : l.t),
        el("small", null, S.done[l.key] ? "done" : l === nx ? "you are here" : l.project ? "build it" : l.gen ? "with your coach" : ""));
      b.addEventListener("click", () => openLesson(l)); line.append(b);
    });
    box.append(h, bar, line); map.append(box);
  });
}

function drawProjects(main) {
  const v = el("div", "view"); main.append(v);
  v.append(el("h1", null, "Projects"), el("p", "lead", "Real programs you build piece by piece. Your code carries over from milestone to milestone, the way real apps grow."));
  const cards = el("div", "cards"); v.append(cards);
  PROJECTS.forEach(p => {
    const c = el("div", "card"); c.style.setProperty("--c", p.color);
    const ready = UNITS.find(u => u.id === p.after);
    c.append(el("span", "tag", S.done[p.key] ? "Built" : "Best after " + ready.name), el("h3", null, p.t), el("p", "note", p.blurb));
    const b = el("button", S.done[p.key] ? null : "go", S.done[p.key] ? "Build it again" : "Start building");
    b.addEventListener("click", () => openLesson(p)); c.append(b); cards.append(c);
  });
  const c = el("div", "card"); c.style.setProperty("--c", "#ff5a4e");
  c.append(el("span", "tag", "With your coach"), el("h3", null, "Design your own project"), el("p", "note", "Tell your coach what you'd like to build. It will break it into milestones you can tackle one at a time."));
  const b = el("button", null, "Plan it with my coach"); b.addEventListener("click", () => { show("coach"); setTimeout(() => { $("ask").value = "Help me plan a small project I could build with what I know. Break it into milestones."; $("ask").focus(); }, 50); });
  c.append(b); cards.append(c);
}

function drawPractice(main) {
  const v = el("div", "view"); main.append(v);
  v.append(el("h1", null, "Practice"), el("p", "lead", "Practice is where things stick. Redo what tripped you up, or get fresh exercises on anything you've learned."));
  const cards = el("div", "cards"); v.append(cards);
  const due = dueReviews(), rc = el("div", "card");
  rc.append(el("span", "tag", "Daily review"), el("h3", null, due.length ? `${due.length} ready today` : "All caught up"),
    el("p", "note", due.length ? "Questions you got right before come back after 1, 3, 7 and 21 days. Remembering them from memory is what makes them stick." : `${Object.keys(S.rev).length} questions are scheduled. They'll come back right before you'd start to forget them.`));
  const rb = el("button", "go", "Start review"); rb.disabled = !due.length; rb.addEventListener("click", startReview); rc.append(rb); cards.append(rc);
  const m = el("div", "card");
  m.append(el("span", "tag", "Your mistakes"), el("h3", null, S.missed.length ? `${S.missed.length} question${S.missed.length === 1 ? "" : "s"} to lock in` : "Nothing to review"),
    el("p", "note", S.missed.length ? "Questions you got wrong before. Getting them right now is how they stick." : "When you miss a question, it lands here so you can come back to it."));
  const mb = el("button", "go", "Practice my mistakes"); mb.disabled = !S.missed.length;
  mb.addEventListener("click", () => openLesson({t: "Practice my mistakes", key: "review", unit: "Practice", color: "#ff5a4e", review: true, steps: S.missed.slice(-12)}));
  m.append(mb); cards.append(m);
  const finished = LESSONS.filter(l => S.done[l.key]);
  const t = el("div", "card");
  t.append(el("span", "tag", "Fresh exercises"), el("h3", null, "More practice on a topic"), el("p", "note", finished.length ? "Your coach writes new exercises, and each one is checked before you see it." : "Finish a lesson first, then come back for extra practice on it."));
  const list = el("div", "row"); finished.slice(-8).reverse().forEach(l => { const b = el("button", null, l.t); b.addEventListener("click", () => extraPractice(l)); list.append(b); });
  t.append(list); cards.append(t);
}

let playCode = 'scores = [12, 30, 25]\ntotal = 0\nfor s in scores:\n    total = total + s\nprint("Total:", total)\n';
function drawPlayground(main) {
  const v = el("div", "view"); main.append(v);
  v.append(el("h1", null, "Playground"), el("p", "lead", "Try anything. Run it, or press Watch it run to step through line by line."));
  const bench = workbench(playCode, c => { playCode = c; });
  v.append(bench.node);
}

let talk = [];
function drawCoach(main) {
  const v = el("div", "view"); main.append(v);
  v.append(el("h1", null, "Your coach"), el("p", "lead", "Ask anything: a concept, your code, what to learn next, or how to get a job in tech. No question is too basic."));
  const chat = el("div", "chat"); chat.id = "chat"; v.append(chat);
  if (!talk.length) chat.append(sayBox("Hi Dilan. I'm your coach. I'll explain things as many ways as it takes, and I'd rather help you figure it out than hand you the answer. What's on your mind?"));
  talk.forEach(m => chat.append(sayBox(m.content.replace(/^\(Coach notes:[\s\S]*?\)\n\n/, ""), m.role === "user")));
  const f = el("form", "ask"); const inp = el("input"); inp.id = "ask"; inp.placeholder = "Ask your coach…"; inp.setAttribute("aria-label", "Ask your coach"); inp.autocomplete = "off";
  const b = el("button", "go", "Ask"); f.append(inp, b); v.append(f);
  f.addEventListener("submit", async e => {
    e.preventDefault(); const q = inp.value.trim(); if (!q) return; inp.value = "";
    chat.append(sayBox(q, true));
    const done = LESSONS.filter(l => S.done[l.key]).map(l => l.t).slice(-10).join(", ") || "none yet";
    talk.push({role: "user", content: `(Coach notes: you are Dilan's coding coach. He started from zero and wants to work in tech. Lessons done: ${done}. Be warm, encouraging and concrete. Explain simply with examples; check understanding with a question when it helps; don't just hand over full solutions to exercises.)\n\n${q}`});
    const box = sayBox("Thinking…"); chat.append(box); main.scrollTop = 1e6;
    const r = await call("coach", {messages: talk.slice(-10)}, t => { box.replaceChildren(); rich(box, t); main.scrollTop = 1e6; });
    box.replaceChildren();
    if (r.error) { talk.pop(); rich(box, r.error); } else { rich(box, r.text); talk.push({role: "assistant", content: r.text}); box.append(listenButton(() => r.text)); }
    main.scrollTop = 1e6;
  });
}
function sayBox(text, me) { const d = el("div", "say" + (me ? " me" : "")); rich(d, text); return d; }

/* ---------- workbench: editor + run + watch it run ---------- */
function workbench(start, onChange) {
  const node = el("div", "bench");
  const wrap = el("div", "edwrap"), gut = el("div", "gut"), ed = el("textarea", "ed");
  ed.spellcheck = false; ed.value = start || ""; ed.setAttribute("aria-label", "Your code");
  const lines = () => { gut.textContent = Array.from({length: Math.max(ed.value.split("\n").length, 1)}, (_, i) => i + 1).join("\n"); };
  ed.addEventListener("input", () => { lines(); if (onChange) onChange(ed.value); });
  ed.addEventListener("scroll", () => { gut.scrollTop = ed.scrollTop; });
  ed.addEventListener("keydown", e => {
    if (e.key === "Tab") { e.preventDefault(); ed.setRangeText("    ", ed.selectionStart, ed.selectionEnd, "end"); lines(); }
    if (e.key === "Enter" && !e.ctrlKey) {                 // keep the indent, and indent after a colon
      const s = ed.selectionStart, line = ed.value.slice(0, s).split("\n").pop();
      const ind = (line.match(/^\s*/) || [""])[0] + (/:\s*$/.test(line) ? "    " : "");
      if (ind) { e.preventDefault(); ed.setRangeText("\n" + ind, s, ed.selectionEnd, "end"); lines(); }
    }
  });
  wrap.append(gut, ed); lines();
  const row = el("div", "row"), run = el("button", null, "Run"), watch = el("button", null, "Watch it run");
  row.append(run, watch); const extra = el("span", "row"); extra.style.marginTop = "0"; row.append(extra);
  const out = el("div", "out", "Output shows here."), vizBox = el("div");
  run.addEventListener("click", async () => { vizBox.replaceChildren(); out.textContent = "Running…"; const r = await call("run", {code: ed.value, test: ""}); paint(out, r); S.ran++; save(); });
  watch.addEventListener("click", () => { visualize(vizBox, ed.value); });
  node.append(wrap, row, out, vizBox);
  return {node, ed, out, extra, focus: () => ed.focus()};
}
function paint(out, r) {
  out.replaceChildren();
  if (r.printed) out.append(r.printed);
  if (r.err) { const s = el("span", "err", (r.printed ? "\n" : "") + r.err); out.append(s); }
  if (!r.printed && !r.err) out.textContent = "(ran with no output)";
}

/* ---------- the visualizer: step through code, watch variables change ---------- */
async function visualize(box, code) {
  box.replaceChildren(el("div", "note", "Getting ready to step through your code…"));
  const r = await call("trace", {code});
  box.replaceChildren();
  if (r.error) { box.append(el("div", "out err", r.error)); return; }
  const steps = r.steps || [];
  if (!steps.length) { box.append(el("div", "out", r.err ? r.err : "Nothing to step through.")); return; }
  const viz = el("div", "viz"), vcode = el("div", "vcode"), side = el("div", "vside");
  const src = code.split("\n");
  const rows = src.map((t, i) => { const d = el("div", "vl"); d.append(el("span", "n", String(i + 1)), el("span", "a", ""), el("span", null, t || " ")); vcode.append(d); return d; });
  const vars = el("div", "vbox"), out = el("div", "vbox"); vars.append(el("h4", null, "Variables (what each name holds right now)")); out.append(el("h4", null, "Output (what has been printed)"));
  const vlist = el("div"), vout = el("div", "vout"); vars.append(vlist); out.append(vout); side.append(vars, out);
  const ctl = el("div", "vctl"), back = el("button", null, "◀ Back"), next = el("button", "go", "Next ▶"), play = el("button", null, "Play"), slide = el("input"), where = el("span", "where");
  slide.type = "range"; slide.min = 0; slide.max = steps.length - 1; slide.value = 0; slide.setAttribute("aria-label", "Step");
  ctl.append(back, next, play, slide, where);
  viz.append(vcode, side, ctl); box.append(viz);
  if (r.capped) box.append(el("p", "note", "Showing the first 400 steps."));
  if (r.err) box.append(el("div", "out err", "Then it stopped with an error: " + r.err));
  let i = 0, timer = 0, prev = {};
  const render = () => {
    const s = steps[i];
    rows.forEach((d, k) => { d.classList.toggle("cur", k + 1 === s.line); d.children[1].textContent = k + 1 === s.line ? "→" : ""; });
    const seen = new Set(steps.slice(0, i + 1).map(x => x.line)); rows.forEach((d, k) => d.classList.toggle("ran", seen.has(k + 1) && k + 1 !== s.line));
    vlist.replaceChildren();
    const names = Object.keys(s.vars);
    if (!names.length) vlist.append(el("div", "note", "No variables yet"));
    names.forEach(n => { const d = el("div", "var" + (prev[n] !== s.vars[n] ? " new" : "")); d.append(el("b", null, n), el("span", null, s.vars[n])); vlist.append(d); });
    if (s.ret !== undefined && s.in) { const d = el("div", "var new"); d.append(el("b", null, s.in + " returns"), el("span", null, s.ret)); vlist.append(d); }
    vout.textContent = s.out || "";
    where.textContent = `Step ${i + 1} of ${steps.length}` + (s.in ? ` · inside ${s.in}()` : "");
    back.disabled = i === 0; next.disabled = i === steps.length - 1; slide.value = i; prev = s.vars;
  };
  const go = j => { prev = j === i + 1 ? steps[i].vars : (steps[j - 1] || {vars: {}}).vars; i = Math.max(0, Math.min(steps.length - 1, j)); render(); };
  back.addEventListener("click", () => go(i - 1)); next.addEventListener("click", () => go(i + 1));
  slide.addEventListener("input", () => go(+slide.value));
  play.addEventListener("click", () => {
    if (timer) { clearInterval(timer); timer = 0; play.textContent = "Play"; return; }
    if (i === steps.length - 1) go(0);
    play.textContent = "Pause"; timer = setInterval(() => { if (i >= steps.length - 1) { clearInterval(timer); timer = 0; play.textContent = "Play"; return; } go(i + 1); }, 700);
  });
  render();
  return {next};
}

/* ---------- lesson player ---------- */
const PRAISE = ["Yes! That's it.", "Nailed it.", "Exactly right.", "That's how a developer thinks.", "Clean. Really clean.", "Look at you go.", "Perfect.", "You're getting fast at this.", "Sharp.", "That's the one."];
const STREAK = {3: "Three in a row. You're in the zone.", 5: "Five straight. This is clicking.", 8: "Eight in a row. Seriously impressive.", 12: "Twelve in a row. Unstoppable."};
const SOFT = ["Not quite, and that's how learning works.", "Close. Here's the idea:", "Good try. One small thing:", "Almost. Look at this:"];
const pick = a => a[Math.floor(Math.random() * a.length)];
let cur = null, steps = [], si = 0, state = "", run = 0, firstTry = 0, tried = 0, choice = null, wrongOnce = false, bench = null, carryCode = "";

function introSteps() {
  return [{k: "L", h: "How lessons work", t: "Every lesson is a few small steps, one screen at a time. The bar at the top shows how far along you are.\n\nYou'll see five kinds of steps:\n\n`Read`: a short idea, then Continue.\n\n`Watch the code run`: press Next to step through code and see what it does.\n\n`Quick question` and `Fill in the blank`: answer, then Check.\n\n`Your turn: write code`: type real Python, Run it to try, Check when it's right.\n\nGetting things wrong is part of it. Wrong answers come back later for practice, so nothing is wasted. Ready?"}];
}
async function openLesson(lesson) {
  cur = lesson; $("player").classList.add("on"); $("ptitle").textContent = (lesson.project ? "Project · " : lesson.unit + " · ") + lesson.t;
  run = 0; firstTry = 0; tried = 0; si = 0; $("streak").textContent = "";
  carryCode = (lesson.project && S.carry[lesson.key]) || "";
  if (lesson.gen && !S.gen[lesson.key]) { await buildLesson(lesson); if (!S.gen[lesson.key]) return; }
  steps = lesson.review || lesson.extra ? lesson.steps : lesson.gen ? S.gen[lesson.key] : lesson.steps;
  if (!S.seenIntro && !lesson.review) { steps = [...introSteps(), ...steps]; S.seenIntro = true; save(); }
  if (lesson.project && carryCode) {                       // resume a project at the first milestone not yet passed
    const k = S.carry[lesson.key + "#at"] || 0; si = Math.min(k, steps.length - 1);
  }
  showStep();
}
function closeLesson() { closeAsk(); hush(); $("player").classList.remove("on"); state = ""; show(view); }
$("close").addEventListener("click", closeLesson);
document.addEventListener("keydown", e => {
  if (!$("player").classList.contains("on")) return;
  if ($("voicepick").open) return;
  if (e.key === "Escape" && $("askpane").classList.contains("open")) { closeAsk(); $("askbtn").focus(); return; }
  if (e.target.closest && e.target.closest("#askpane")) return;      // typing a question never moves the lesson on
  if (e.key === "Escape") closeLesson();
  if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); act(); }
});
function foot(kind, title, sub, label) {
  const f = $("foot"); f.className = "foot" + (kind ? " " + kind : "");
  const m = $("msg"); m.replaceChildren(); if (title) m.append(el("b", null, title)); if (sub) m.append(el("span", null, sub));
  $("act").textContent = label; $("act").disabled = false;
}
const KIND = {L: "Read", V: "Watch the code run", P: "Quick question", F: "Fill in the blank", W: "Your turn: write code", O: "Puzzle: put the lines in order"};
const TODO = {
  L: "Read this, then press Continue at the bottom. Not clear? Press \"Explain it another way\".",
  V: "Press Next ▶ to run one line at a time. The yellow arrow is the line about to run. Variables shows what each name holds right now. Output shows what has been printed.",
  P: "Pick one answer, then press Check at the bottom.",
  F: "Type the missing word or symbol in the box, then press Check.",
  W: "1. Type your code in the dark box.  2. Press Run to try it and see what it prints.  3. When it looks right, press Check at the bottom. Stuck? Press Hint.",
  O: "Click the pieces on the left in the order they should run. Click a piece on the right to send it back. Then press Check.",
};

/* ---------- daily review: questions come back after 1, 3, 7, 21 and 60 days (spaced retrieval) ---------- */
const GAPS = [1, 3, 7, 21, 60];
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const stepKey = st => { let h = 0; const j = JSON.stringify([st.k, st.q, st.code, st.lines]); for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) | 0; return "r" + (h >>> 0).toString(36); };
function schedule(st, right) {
  if (!["P", "F", "O"].includes(st.k)) return;
  const k = stepKey(st), r = S.rev[k] || {st, lvl: -1};
  r.lvl = right ? Math.min(r.lvl + 1, GAPS.length - 1) : 0;
  r.due = addDays(GAPS[Math.max(r.lvl, 0)]); S.rev[k] = r;
}
const dueReviews = () => Object.values(S.rev).filter(r => r.due <= today()).slice(0, 15);

function showStep() {
  const st = steps[si], stage = $("stage"); stage.replaceChildren(); stage.scrollTop = 0;
  $("bar").style.width = Math.round(100 * si / steps.length) + "%";
  choice = null; wrongOnce = false; bench = null;
  const wide = st.k === "W" || st.k === "V";
  const box = el("div", "step" + (wide ? " wide" : "")); stage.append(box);
  const text = el("div", "text"); box.append(text);
  text.append(el("div", "kind", (cur.project && st.k === "W" ? "Milestone · " : "") + KIND[st.k]));
  const todo = el("div", "todo", TODO[st.k]);
  if (st.k === "L" || st.k === "V") {
    text.append(el("h2", null, st.h)); rich(text, st.t); text.append(todo);
    text.append(listenButton(() => st.h + ". " + st.t));
    if (st.k === "L" && st.code) {
      text.append(el("pre", null, st.code));
      const tb = el("button", null, "Watch it run"), vb = el("div"); tb.addEventListener("click", () => visualize(vb, st.code)); text.append(tb, vb);
    }
    const again = el("button", "ghost", "Explain it another way"), exp = el("div");
    again.addEventListener("click", () => explainAgain(st, exp)); text.append(el("div", "row")); text.lastChild.append(again); text.append(exp);
    if (st.k === "V") { const right = el("div"); box.append(right); visualize(right, st.code); }
    state = "next"; foot("", "", "", "Continue"); return;
  }
  text.append(el("h2", null, st.q.split("\n\n")[0]));
  rich(text, st.q.split("\n\n").slice(1).join("\n\n"));
  text.append(todo);
  text.append(listenButton(() => st.q + (st.k === "P" ? ". The options are: " + st.opts.join(". ") : "")));
  if (st.code && st.k !== "W") text.append(el("pre", null, st.code));
  if (st.k === "P") {
    const opts = el("div", "opts"); text.append(opts);
    st.opts.map((_, i) => i).sort(() => Math.random() - 0.5).forEach(i => {
      const b = el("button", "opt", st.opts[i]); b.dataset.i = i;
      b.addEventListener("click", () => { if (state !== "check") return; choice = i; opts.querySelectorAll(".opt").forEach(x => x.classList.toggle("pick", x === b)); $("act").disabled = false; });
      opts.append(b);
    });
    state = "check"; foot("", "", "", "Check"); $("act").disabled = true;
  } else if (st.k === "F") {
    const inp = el("input", "fill"); inp.id = "fill"; inp.autocomplete = "off"; inp.spellcheck = false; inp.setAttribute("aria-label", "Your answer");
    inp.addEventListener("input", () => { $("act").disabled = !inp.value.trim(); });
    inp.addEventListener("keydown", e => { if (e.key === "Enter" && inp.value.trim()) act(); });
    text.append(inp); state = "check"; foot("", "", "", "Check"); $("act").disabled = true; setTimeout(() => inp.focus(), 60);
  } else if (st.k === "O") {
    const pieces = st.lines.map((t, i) => ({t, i})).sort(() => Math.random() - 0.5);
    const board = el("div", "puzzle"), left = el("div", "pz"), right = el("div", "pz");
    left.append(el("h4", null, "Pieces")); right.append(el("h4", null, "Your program"));
    const lpool = el("div", "pzlist"), rpool = el("div", "pzlist"); left.append(lpool); right.append(rpool);
    let placed = [];
    const draw = () => {
      lpool.replaceChildren(); rpool.replaceChildren();
      pieces.filter(p => !placed.includes(p)).forEach(p => { const b = el("button", "piece", p.t || "(blank line)"); b.addEventListener("click", () => { if (state !== "check") return; placed.push(p); draw(); }); lpool.append(b); });
      placed.forEach(p => { const b = el("button", "piece", p.t || "(blank line)"); b.addEventListener("click", () => { if (state !== "check") return; placed = placed.filter(x => x !== p); draw(); }); rpool.append(b); });
      if (!placed.length) rpool.append(el("p", "note", "Click pieces in the order they should run."));
      $("act").disabled = placed.length !== pieces.length;
    };
    board.append(left, right); text.append(board);
    bench = {order: () => placed.map(p => p.i)};
    state = "check"; foot("", "", "", "Check"); draw();
  } else if (st.k === "W") {
    let start = st.start;
    if (st.carry || start == null) start = (carryCode ? carryCode.replace(/\s*$/, "") + "\n\n" : "") + (st.start || "# " + st.q.split("\n")[0].replace(/^Milestone \d+\. /, "") + "\n");
    bench = workbench(start, null);
    const hint = el("button", null, "Hint"), coachB = el("button", null, "Ask my coach");
    hint.addEventListener("click", () => { bench.out.textContent = "Hint: " + (st.hint || "Break it into small pieces and try one line at a time."); });
    coachB.addEventListener("click", () => nudge(st, bench));
    bench.extra.append(hint, coachB);
    box.append(bench.node);

    state = "check"; foot("", "", "", "Check"); setTimeout(() => bench.focus(), 60);
  }
}

async function act() {
  const st = steps[si];
  if (state === "close") return closeLesson();
  if (state === "more") return extraPractice(cur);
  if (state === "next") { si++; if (si >= steps.length) return finish(); return showStep(); }
  if (state !== "check" || $("act").disabled) return;
  let ok = false, why = st.why || "";
  if (st.k === "P") {
    ok = choice === st.a;
    document.querySelectorAll(".opt").forEach(b => { if (+b.dataset.i === st.a) b.classList.add("right"); else if (+b.dataset.i === choice) b.classList.add("wrong"); });
  } else if (st.k === "F") {
    const v = $("fill").value.replace(/\s+/g, "").toLowerCase();
    ok = st.a.some(a => String(a).replace(/\s+/g, "").toLowerCase() === v);
    if (!ok) why = "The answer is " + st.a[0] + ". " + why;
  } else if (st.k === "O") {
    const order = bench.order(); ok = order.every((v, i) => st.lines[v] === st.lines[i]);
    if (!ok) why = "The right order is:\n" + st.lines.join("\n") + "\n\n" + why;
  } else if (st.k === "W") {
    $("act").disabled = true; $("act").textContent = "Checking…";
    const r = await call("run", {code: bench.ed.value, test: st.test}); paint(bench.out, r); S.ran++;
    ok = !!r.pass; why = r.err ? "Your code hit an error. Read its last line, fix that spot, then check again." : (r.fail || "");
    if (ok) { carryCode = bench.ed.value; if (cur.project) { S.carry[cur.key] = carryCode; S.carry[cur.key + "#at"] = si + 1; } }
  }
  if (!wrongOnce) tried++;
  if (!wrongOnce || cur.review) schedule(st, ok);
  if (ok) {
    if (!wrongOnce) firstTry++;
    run++; burst();
    const praise = STREAK[run] || pick(PRAISE);
    foot("good", praise, st.k === "W" ? " Your code passed every check." : (st.why ? " " + st.why : ""), "Continue");
    speak(praise + (st.k === "W" ? " Your code passed every check." : ""));
    state = "next";
  } else {
    run = 0; wrongOnce = true;
    if (st.k !== "W" && !cur.review && !cur.daily && !S.missed.some(m => JSON.stringify(m) === JSON.stringify(st))) { S.missed.push(st); S.missed = S.missed.slice(-40); }
    if (st.k === "W") { foot("bad", "Not yet. Keep going.", " " + why, "Check again"); speak(pick(["Not yet, but you're close. Read the hint at the bottom.", "Almost there. Check the message at the bottom and try again.", "That's okay. Every developer hits this. Look at the hint and give it another go."])); }
    else { const soft = pick(SOFT); foot("bad", soft, " " + why, "Continue"); state = "next"; speak(soft + " " + (st.why || "")); }
  }
  $("streak").textContent = run >= 2 ? run + " in a row" : "";
  save();
}
$("act").addEventListener("click", act);

function finish() {
  const first = !S.done[cur.key] && !cur.review && !cur.extra && !cur.daily;
  if (!cur.review && !cur.extra && !cur.daily) S.done[cur.key] = today();
  if (cur.review) S.missed = S.missed.filter(m => !steps.includes(m));
  if (!S.days.includes(today())) S.days.push(today());
  if (cur.project) { delete S.carry[cur.key]; delete S.carry[cur.key + "#at"]; }
  save();
  $("bar").style.width = "100%";
  const stage = $("stage"); stage.replaceChildren();
  const box = el("div", "step finished"); stage.append(box);
  const pct = tried ? Math.round(100 * firstTry / tried) : 100;
  const head = cur.project ? "You built it." : pct === 100 ? "Flawless. Every single one." : pct >= 80 ? "That was strong." : pct >= 50 ? "You pushed through. That's the real skill." : "You finished. That's what counts.";
  box.append(el("div", "kind", cur.unit), el("h2", null, head));
  const n = doneCount();
  box.append(el("p", null, first ? `"${cur.t}" is done. That's ${n} stop${n === 1 ? "" : "s"} on your route and ${S.ran} program${S.ran === 1 ? "" : "s"} you've run yourself.` : "Practice like this is exactly how it sticks."));
  const b3 = el("div", "big3");
  [[pct + "%", "right first try"], [steps.length, "steps"], [S.days.length, S.days.length === 1 ? "day learning" : "days learning"]].forEach(([v, l]) => { const d = el("div"); d.append(el("b", null, String(v)), el("span", null, l)); b3.append(d); });
  box.append(b3);
  const note = el("p", "note"); box.append(note);
  if (first) call("coach", {prompt: `Dilan is a beginner learning to code toward a tech job. He just finished "${cur.t}" (${cur.unit}) with ${pct}% right first try, and has now finished ${n} lessons. Write one or two sentences of genuine, specific encouragement naming what he can now do that he couldn't before. Warm, plain, no emoji.`})
    .then(r => { if (r.text) { note.textContent = r.text; note.className = ""; setTimeout(() => speak(r.text), 2600); } });
  confetti();
  speak(head + (first ? ` That's ${n} lesson${n === 1 ? "" : "s"} done. I'm proud of you, Dilan.` : ""));
  if (cur.project && cur.yours) {
    const y = el("div", "explain"); y.style.textAlign = "left";
    y.append(el("h3", null, "Make it yours"), el("p", "note", "This is where real skill comes from: add something the steps didn't tell you to. Pick one and build it in the Playground with your code."));
    const ul = el("ul"); cur.yours.forEach(t => ul.append(el("li", null, t))); y.append(ul);
    const pb = el("button", "go", "Open my code in the Playground"); const code = carryCode;
    pb.addEventListener("click", () => { playCode = code + "\n\n# Make it yours: add your feature below\n"; closeLesson(); show("playground"); }); y.append(pb);
    box.append(y);
  }
  if (!cur.review && !cur.project) {
    const more = el("button", null, "Extra practice on this"); more.addEventListener("click", () => extraPractice(cur));
    const row = el("div", "row"); row.style.justifyContent = "center"; row.append(more); box.append(row);
  }
  state = "close"; foot("good", cur.project ? "Project complete" : "Lesson complete", "", "Back to my route");
}

function startReview() {
  const due = dueReviews(); if (!due.length) return;
  openLesson({t: "Daily review", key: "daily", unit: "Practice", color: "#3ecf8e", review: true, daily: true, steps: due.map(r => r.st)});
}

/* ---------- the coach inside lessons ---------- */
async function explainAgain(st, box) {
  box.className = "explain"; box.replaceChildren(el("p", "note", "Your coach is thinking of another way to explain it…"));
  const r = await call("coach", {prompt: `Explain this idea to a total beginner in a different way than before: use a new everyday analogy, then a tiny code example with what it prints. Keep it under 150 words.\n\nThe idea: ${st.h}\n${st.t}\n${st.code || ""}`}, t => { box.replaceChildren(); rich(box, t); });
  box.replaceChildren(); rich(box, r.error || r.text);
}
async function nudge(st, b) {
  b.out.textContent = "Your coach is looking at your code… (the first answer can take up to a minute while your Local AI wakes up)";
  const r = await call("coach", {prompt: `You're a kind coding coach for a beginner. The exercise: ${st.q}\n\nHis code:\n${b.ed.value}\n\nWhat happened when he ran it:\n${b.out.textContent}\n\nGive ONE helpful nudge in 2-3 sentences that gets him unstuck. Point at the line or idea to look at. Don't write the full solution.`}, t => { b.out.textContent = t; });
  b.out.textContent = r.error || r.text;
}

/* ---------- ask a question mid-lesson: a drawer beside the lesson that knows the step and his code ---------- */
const ASK = {talk: [], lessonKey: null, busy: false};
function stepContext() {
  const st = steps[si] || {};
  const bits = [`Lesson: "${cur.t}" (${cur.unit}). He is on step ${si + 1} of ${steps.length}, a "${KIND[st.k] || "Read"}" step.`];
  if (st.h) bits.push("Step heading: " + st.h);
  if (st.t) bits.push("What the step says:\n" + st.t);
  if (st.q) bits.push("The question or exercise:\n" + st.q);
  if (st.code) bits.push("Code on screen:\n" + st.code);
  if (bench && bench.ed) bits.push("His code right now:\n" + bench.ed.value);
  if (bench && bench.out && bench.out.textContent.trim()) bits.push("The latest output or message:\n" + bench.out.textContent.slice(0, 800));
  return bits.join("\n\n").slice(0, 2500);
}
function askBubble(text, me) {
  const d = el("div", "say" + (me ? " me" : "")); rich(d, text);
  $("ask-log").append(d); $("ask-log").scrollTop = 1e6; return d;
}
function openAsk(prefill) {
  if (ASK.lessonKey !== cur.key) {                          // a fresh conversation for each lesson
    ASK.lessonKey = cur.key; ASK.talk = []; $("ask-log").replaceChildren();
    askBubble("Stuck, curious, or just want it said another way? Ask anything about this step. I can see what you're looking at and your code.");
  }
  const p = $("askpane"); p.style.top = document.querySelector(".ptop").offsetHeight + "px"; p.classList.add("open"); p.inert = false; $("askbtn").setAttribute("aria-expanded", "true");
  $("player").classList.add("asking");
  if (prefill) $("ask-q").value = prefill;
  setTimeout(() => $("ask-q").focus(), 60);
}
function closeAsk() {
  const p = $("askpane"); p.classList.remove("open"); p.inert = true; $("askbtn").setAttribute("aria-expanded", "false");
  $("player").classList.remove("asking");
}
async function sendAsk(q) {
  q = q.trim(); if (!q || ASK.busy) return;
  ASK.busy = true; $("ask-send").disabled = true; $("ask-q").value = "";
  askBubble(q, true);
  ASK.talk.push({role: "user", content: `(Coach notes: you are Dilan's coding coach. He started from zero. He is in the middle of a lesson and asked about it. Answer his exact question in plain words, using this step's own example where you can, in under 180 words. If it's an exercise, guide him toward the answer without writing the full solution unless he asks for it outright. End with one short check-in question only if it helps.\n\n${stepContext()})\n\n${q}`});
  const box = askBubble("Thinking"); box.classList.add("thinking");
  const t0 = Date.now(), slow = setInterval(() => {
    if (!box.classList.contains("thinking")) return;
    const sec = Math.round((Date.now() - t0) / 1000);
    box.firstChild.textContent = sec < 20 ? "Thinking" : `Still waiting (${sec}s). Your Local AI is probably busy with the Builder's lessons, so your question is in line. It will answer`;
  }, 1000);
  const r = await call("coach", {messages: ASK.talk.slice(-8)}, t => { box.classList.remove("thinking"); box.replaceChildren(); rich(box, t); $("ask-log").scrollTop = 1e6; });
  clearInterval(slow); box.classList.remove("thinking");
  if (r.error || !r.text) { box.replaceChildren(el("p", null, (r.error || "No answer came back.") + " Is your Local AI running? You can ask again.")); ASK.talk.pop(); }
  else {
    box.replaceChildren(); rich(box, r.text); ASK.talk.push({role: "assistant", content: r.text});
    box.append(listenButton(() => r.text));
  }
  ASK.busy = false; $("ask-send").disabled = false; $("ask-q").focus();
}
$("askbtn").addEventListener("click", () => $("askpane").classList.contains("open") ? closeAsk() : openAsk());
$("ask-close").addEventListener("click", closeAsk);
$("ask-form").addEventListener("submit", e => { e.preventDefault(); sendAsk($("ask-q").value); });
$("ask-q").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAsk($("ask-q").value); } });
document.querySelectorAll("#ask-chips button").forEach(b => b.addEventListener("click", () => sendAsk(b.textContent)));

/* ---------- lessons the coach writes (every exercise is proven by the engine first) ---------- */
const NO_PY = /HTML|CSS|flexbox|Responsive|JavaScript|DOM|fetch|React|Accessibility|terminal|Git|VS Code|resume|interview|portfolio|Behavioral|90 days|tech path|profile|Docker|CI\/CD|Cloud|Monitoring|Deploy|Linux|Operating|Networks|website reaches|scale|Scaling|Load balancers|Queues|URL shortener|What system|Memory and the CPU|How programs run|Bits/i;
function lessonPrompt(topic, unit, mode) {
  const done = LESSONS.filter(l => S.done[l.key]).map(l => l.t).slice(-15).join(", ") || "none";
  const py = !NO_PY.test(topic);
  return `You teach coding to Dilan, who started from zero and wants to work in tech. Lessons he has finished: ${done}.
${mode === "practice" ? `Write a PRACTICE set on "${topic}": 6 to 8 steps, mostly checks and exercises, from easy to harder, with one short L reminder first.` :
`Write ONE lesson on "${topic}" (unit: ${unit}) as 10 to 14 small steps. Go slowly and in detail: explain each idea in plain words with an everyday analogy, give worked examples, and name the most common mistake. Mix learning and doing; never more than two L steps in a row.
This course prepares him for a real tech job, so the lesson MUST also teach the job itself:
- an L step titled "On the job": how working developers actually use this, day to day, on a team;
- what managers and interviewers look for in someone who does this well, and the mistakes that make juniors look inexperienced;
- HOW to do it the way a professional does, as concrete steps he can follow;
- one realistic work-style task (phrased like a ticket from a team lead: context, what's needed, how it will be checked).`}
Return ONLY JSON: {"steps": [ ... ]}. Each step is one of:
{"k":"L","h":"short heading","t":"2-4 short paragraphs separated by blank lines; use \`inline code\`","code":"optional example"}
${py ? `{"k":"V","h":"heading","t":"what to watch for","code":"a short Python example (under 12 lines, no input()) to step through line by line"}` : ""}
{"k":"P","q":"question","code":"optional code","opts":["4 options"],"a":0,"why":"why the right answer is right"}
{"k":"F","q":"fill-the-blank instruction","code":"code with ___ for the blank","a":["accepted answer"],"why":"..."}
${py ? `{"k":"O","q":"put the lines in order so that ...","lines":["the lines of a short program in the CORRECT order, indentation included"],"why":"..."} (include 1)` : ""}
${py ? `{"k":"W","q":"a Python exercise (first line is the title)","start":"starter code that does NOT pass yet","test":"Python asserts with helpful messages; OUT holds what was printed","hint":"...","solution":"your own complete correct solution: it is run against the test before Dilan sees it"} (include 2 or 3; for SQL topics use sqlite3 in memory)` : `(This topic isn't Python: use P and F steps plus L steps with real commands or snippets.)`}
Start with an L step.`;
}
async function buildLesson(lesson, mode) {
  const stage = $("stage"); stage.replaceChildren(); $("bar").style.width = "0";
  const box = el("div", "step"); stage.append(box);
  box.append(el("div", "kind", lesson.unit), el("h2", null, lesson.t), el("p", null, mode === "practice" ? "Your coach is writing fresh practice for you…" : "Your coach is writing this lesson for you. It checks every exercise works before showing it. This can take a minute…"));
  foot("", "", "", "Please wait"); $("act").disabled = true;
  const r = await call("lesson", {prompt: lessonPrompt(lesson.t, lesson.unit, mode)});
  if (r.error || !r.json) {
    box.lastChild.textContent = (r.error || "Your coach couldn't write this one.") + " You can try again.";
    state = "close"; foot("", "", "", "Back"); return null;
  }
  if (mode === "practice") return r.json.steps;
  S.gen[lesson.key] = r.json.steps; save(); return r.json.steps;
}
async function extraPractice(lesson) {
  $("player").classList.add("on"); $("ptitle").textContent = "Practice · " + lesson.t; cur = {...lesson, extra: true};
  const st = await buildLesson(cur, "practice"); if (!st) return;
  steps = st; si = 0; run = 0; firstTry = 0; tried = 0; showStep();
}

/* ---------- celebration: a burst on every right answer, confetti at the end ---------- */
const fx = $("fx"), ctx = fx.getContext("2d"); let parts = [], anim = 0;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COLS = ["#ff5a4e", "#4aa3df", "#3ecf8e", "#f6c343", "#a78bfa", "#ff9f43"];
function sizeFx() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; }
addEventListener("resize", sizeFx); sizeFx();
function spawn(x, y, n, spread, up) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * spread; parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: 60 + Math.random() * 40, c: COLS[i % COLS.length], s: 4 + Math.random() * 5, r: Math.random() * 6}); }
  if (!anim) anim = requestAnimationFrame(tick);
}
function tick() {
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.vx *= 0.99; p.life--; p.r += 0.15; ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30)); ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); ctx.restore(); });
  parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 20);
  anim = parts.length ? requestAnimationFrame(tick) : 0; if (!anim) ctx.clearRect(0, 0, innerWidth, innerHeight);
}
function burst() { if (calm) return; const r = $("act").getBoundingClientRect(); spawn(r.left + r.width / 2, r.top, 26, 5, 4); }
function confetti() { if (calm) return; for (let k = 0; k < 4; k++) setTimeout(() => spawn(innerWidth * (0.2 + 0.2 * k), innerHeight * 0.35, 40, 7, 6), k * 120); }

/* ---------- start ---------- */
call("load").then(v => { if (v && v.done) Object.assign(S, v); loadVoices(); show("route"); });
}
