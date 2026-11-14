// Writes tools/lessons.json from src/CodeSchool/web/lessons.js so the Python build check can read it.
//   node tools/export_lessons.js
global.window = {};
require("../src/CodeSchool/web/lessons.js");
const ex = [], watch = [];
for (const u of window.COURSE) for (const l of u.lessons) {
  const steps = [];
  l.steps.forEach((s, i) => { if (s.k === "W") steps.push({id: `${l.t}#${i}`, start: s.start, test: s.test, carry: !!s.carry}); if (s.k === "V") watch.push({id: `${l.t}: ${s.h}`, code: s.code}); });
  if (steps.length) ex.push({group: l.t, steps});
}
for (const p of window.PROJECTS) ex.push({group: p.t, steps: p.steps.map((s, i) => ({s, i})).filter(x => x.s.k === "W").map(({s, i}) => ({id: `${p.t}#${i}`, start: s.start, test: s.test, carry: !!s.carry}))});
require("fs").writeFileSync(__dirname + "/lessons.json", JSON.stringify({exercises: ex, watch}, null, 1));
console.log(`${ex.reduce((n, g) => n + g.steps.length, 0)} exercises, ${watch.length} watch-it-run examples`);
