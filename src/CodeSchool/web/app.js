/* Code School: the screens. Talks to the C# engine through the WebView2 bridge (see Engine.cs). */
{
"use strict";
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/* ---------- bridge to the app engine (falls back to a local dev server when opened in a browser) ---------- */
const host = window.chrome && window.chrome.webview;
const pending = {}; let seq = 0;
if (host) host.addEventListener("message", e => { const d = e.data || {}; const f = pending[d.id]; if (f) { delete pending[d.id]; f(d.result || {}); } });
function call(type, payload) {
  if (host) return new Promise(res => { const id = String(++seq); pending[id] = res; host.postMessage({id, type, payload: payload || {}}); });
  return fetch("/api/" + type, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})})
    .then(r => r.json()).catch(() => ({error: "The engine isn't running."}));
}

/* ---------- course: written units + projects + units the coach teaches live ---------- */
const UNITS = window.COURSE.map((u, i) => ({...u, n: i + 1, lessons: u.lessons.map((l, j) => ({...l, key: u.id + "_" + j, unit: u.name, color: u.color}))}));
window.LATER.forEach(([id, name, color, topics]) => UNITS.push({id, name, color, n: UNITS.length + 1, sub: "Taught live by your coach",
  lessons: topics.map((t, j) => ({t, gen: true, key: id + "_" + j, unit: name, color}))}));
const PROJECTS = window.PROJECTS.map(p => ({...p, key: p.id, unit: "Project", project: true}));
const LESSONS = UNITS.flatMap(u => u.lessons);
const byKey = k => LESSONS.find(l => l.key === k) || PROJECTS.find(p => p.key === k);

/* ---------- saved progress ---------- */
let S = {done: {}, ran: 0, days: [], missed: [], gen: {}, carry: {}};
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

/* ---------- views ---------- */
let view = "route";
document.querySelectorAll(".nav").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));
function show(v) {
  view = v;
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  const main = $("main"); main.replaceChildren(); main.scrollTop = 0;
  ({route: drawRoute, projects: drawProjects, practice: drawPractice, playground: drawPlayground, coach: drawCoach})[v](main);
  $("side-note").textContent = doneCount() ? `${doneCount()} lessons done` : "";
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
  const map = el("div", "map"); v.append(map);
  UNITS.forEach(u => {
    const box = el("section", "unit"); box.style.setProperty("--c", u.color);
    const fin = u.lessons.filter(l => S.done[l.key]).length;
    const h = el("div", "uhead"), t = el("div"); t.append(el("b", null, u.name), el("span", null, u.sub));
    h.append(el("i", null, String(u.n)), t, el("span", "pct", `${fin} of ${u.lessons.length}`));
    const line = el("div", "line");
    const stops = [...u.lessons, ...PROJECTS.filter(p => p.after === u.id)];
    stops.forEach(l => {
      const b = el("button", "stop" + (S.done[l.key] ? " done" : "") + (l === nx ? " here" : "") + (l.project ? " proj" : ""));
      b.append(el("span", "dot"), el("span", null, l.project ? "Project: " + l.t : l.t),
        el("small", null, S.done[l.key] ? "done" : l === nx ? "you are here" : l.project ? "build it" : l.gen ? "with your coach" : ""));
      b.addEventListener("click", () => openLesson(l)); line.append(b);
    });
    box.append(h, line); map.append(box);
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
    const r = await call("coach", {messages: talk.slice(-10)});
    box.replaceChildren();
    if (r.error) { talk.pop(); rich(box, r.error); } else { rich(box, r.text); talk.push({role: "assistant", content: r.text}); }
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
  const vars = el("div", "vbox"), out = el("div", "vbox"); vars.append(el("h4", null, "Variables")); out.append(el("h4", null, "Output"));
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

async function openLesson(lesson) {
  cur = lesson; $("player").classList.add("on"); $("ptitle").textContent = (lesson.project ? "Project · " : lesson.unit + " · ") + lesson.t;
  run = 0; firstTry = 0; tried = 0; si = 0; $("streak").textContent = "";
  carryCode = (lesson.project && S.carry[lesson.key]) || "";
  if (lesson.gen && !S.gen[lesson.key]) { await buildLesson(lesson); if (!S.gen[lesson.key]) return; }
  steps = lesson.review || lesson.extra ? lesson.steps : lesson.gen ? S.gen[lesson.key] : lesson.steps;
  if (lesson.project && carryCode) {                       // resume a project at the first milestone not yet passed
    const k = S.carry[lesson.key + "#at"] || 0; si = Math.min(k, steps.length - 1);
  }
  showStep();
}
function closeLesson() { $("player").classList.remove("on"); state = ""; show(view); }
$("close").addEventListener("click", closeLesson);
document.addEventListener("keydown", e => {
  if (!$("player").classList.contains("on")) return;
  if (e.key === "Escape") closeLesson();
  if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); act(); }
});
function foot(kind, title, sub, label) {
  const f = $("foot"); f.className = "foot" + (kind ? " " + kind : "");
  const m = $("msg"); m.replaceChildren(); if (title) m.append(el("b", null, title)); if (sub) m.append(el("span", null, sub));
  $("act").textContent = label; $("act").disabled = false;
}
const KIND = {L: "New idea", V: "Watch it run", P: "Quick check", F: "Fill the blank", W: "Write real code"};

function showStep() {
  const st = steps[si], stage = $("stage"); stage.replaceChildren(); stage.scrollTop = 0;
  $("bar").style.width = Math.round(100 * si / steps.length) + "%";
  choice = null; wrongOnce = false; bench = null;
  const wide = st.k === "W" || st.k === "V";
  const box = el("div", "step" + (wide ? " wide" : "")); stage.append(box);
  const text = el("div", "text"); box.append(text);
  text.append(el("div", "kind", (cur.project && st.k === "W" ? "Milestone · " : "") + KIND[st.k]));
  if (st.k === "L" || st.k === "V") {
    text.append(el("h2", null, st.h)); rich(text, st.t);
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
  } else if (st.k === "W") {
    let start = st.start;
    if (st.carry || start == null) start = (carryCode ? carryCode.replace(/\s*$/, "") + "\n\n" : "") + (st.start || "# " + st.q.split("\n")[0].replace(/^Milestone \d+\. /, "") + "\n");
    bench = workbench(start, null);
    const hint = el("button", null, "Hint"), coachB = el("button", null, "Ask my coach");
    hint.addEventListener("click", () => { bench.out.textContent = "Hint: " + (st.hint || "Break it into small pieces and try one line at a time."); });
    coachB.addEventListener("click", () => nudge(st, bench));
    bench.extra.append(hint, coachB);
    box.append(bench.node);
    text.append(el("p", "note", "Run tries your code. Check (or Ctrl+Enter) tests it."));
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
  } else if (st.k === "W") {
    $("act").disabled = true; $("act").textContent = "Checking…";
    const r = await call("run", {code: bench.ed.value, test: st.test}); paint(bench.out, r); S.ran++;
    ok = !!r.pass; why = r.err ? "Your code hit an error. Read its last line, fix that spot, then check again." : (r.fail || "");
    if (ok) { carryCode = bench.ed.value; if (cur.project) { S.carry[cur.key] = carryCode; S.carry[cur.key + "#at"] = si + 1; } }
  }
  if (!wrongOnce) tried++;
  if (ok) {
    if (!wrongOnce) firstTry++;
    run++; burst();
    foot("good", STREAK[run] || pick(PRAISE), st.k === "W" ? " Your code passed every check." : (st.why ? " " + st.why : ""), "Continue");
    state = "next";
  } else {
    run = 0; wrongOnce = true;
    if (st.k !== "W" && !cur.review && !S.missed.some(m => JSON.stringify(m) === JSON.stringify(st))) { S.missed.push(st); S.missed = S.missed.slice(-40); }
    if (st.k === "W") foot("bad", "Not yet. Keep going.", " " + why, "Check again");
    else { foot("bad", pick(SOFT), " " + why, "Continue"); state = "next"; }
  }
  $("streak").textContent = run >= 2 ? run + " in a row" : "";
  save();
}
$("act").addEventListener("click", act);

function finish() {
  const first = !S.done[cur.key] && !cur.review && !cur.extra;
  if (!cur.review && !cur.extra) S.done[cur.key] = today();
  if (cur.review) S.missed = S.missed.filter(m => !steps.includes(m));
  if (!S.days.includes(today())) S.days.push(today());
  if (cur.project) { delete S.carry[cur.key]; delete S.carry[cur.key + "#at"]; }
  save();
  $("bar").style.width = "100%";
  const stage = $("stage"); stage.replaceChildren();
  const box = el("div", "step done"); stage.append(box);
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
    .then(r => { if (r.text) { note.textContent = r.text; note.className = ""; } });
  confetti();
  if (!cur.review && !cur.project) {
    const more = el("button", null, "Extra practice on this"); more.addEventListener("click", () => extraPractice(cur));
    const row = el("div", "row"); row.style.justifyContent = "center"; row.append(more); box.append(row);
  }
  state = "close"; foot("good", cur.project ? "Project complete" : "Lesson complete", "", "Back to my route");
}

/* ---------- the coach inside lessons ---------- */
async function explainAgain(st, box) {
  box.className = "explain"; box.replaceChildren(el("p", "note", "Your coach is thinking of another way to explain it…"));
  const r = await call("coach", {prompt: `Explain this idea to a total beginner in a different way than before: use a new everyday analogy, then a tiny code example with what it prints. Keep it under 150 words.\n\nThe idea: ${st.h}\n${st.t}\n${st.code || ""}`});
  box.replaceChildren(); rich(box, r.error || r.text);
}
async function nudge(st, b) {
  b.out.textContent = "Your coach is looking at your code…";
  const r = await call("coach", {prompt: `You're a kind coding coach for a beginner. The exercise: ${st.q}\n\nHis code:\n${b.ed.value}\n\nWhat happened when he ran it:\n${b.out.textContent}\n\nGive ONE helpful nudge in 2-3 sentences that gets him unstuck. Point at the line or idea to look at. Don't write the full solution.`});
  b.out.textContent = r.error || r.text;
}

/* ---------- lessons the coach writes (every exercise is proven by the engine first) ---------- */
const NO_PY = /HTML|CSS|flexbox|Responsive|JavaScript|DOM|fetch|React|Accessibility|terminal|Git|VS Code|resume|interview|portfolio|Behavioral|90 days|tech path|profile|Docker|CI\/CD|Cloud|Monitoring|Deploy|Linux|Operating|Networks|website reaches|scale|Scaling|Load balancers|Queues|URL shortener|What system|Memory and the CPU|How programs run|Bits/i;
function lessonPrompt(topic, unit, mode) {
  const done = LESSONS.filter(l => S.done[l.key]).map(l => l.t).slice(-15).join(", ") || "none";
  const py = !NO_PY.test(topic);
  return `You teach coding to Dilan, who started from zero and wants to work in tech. Lessons he has finished: ${done}.
${mode === "practice" ? `Write a PRACTICE set on "${topic}": 6 to 8 steps, mostly checks and exercises, from easy to harder, with one short L reminder first.` :
`Write ONE lesson on "${topic}" (unit: ${unit}) as 10 to 14 small steps. Go slowly and in detail: explain each idea in plain words with an everyday analogy, show why it matters at work, give worked examples, and name the most common mistake. Mix learning and doing; never more than two L steps in a row.`}
Return ONLY JSON: {"steps": [ ... ]}. Each step is one of:
{"k":"L","h":"short heading","t":"2-4 short paragraphs separated by blank lines; use \`inline code\`","code":"optional example"}
${py ? `{"k":"V","h":"heading","t":"what to watch for","code":"a short Python example (under 12 lines, no input()) to step through line by line"}` : ""}
{"k":"P","q":"question","code":"optional code","opts":["4 options"],"a":0,"why":"why the right answer is right"}
{"k":"F","q":"fill-the-blank instruction","code":"code with ___ for the blank","a":["accepted answer"],"why":"..."}
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
call("load").then(v => { if (v && v.done) Object.assign(S, v); show("route"); });
}
