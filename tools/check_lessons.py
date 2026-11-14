"""Build check: every written exercise must PASS with a known-correct answer and FAIL with its starter code,
and every "Watch it run" example must trace without errors. Run by the GitHub build before the exe is made.

    python tools/check_lessons.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "src" / "CodeSchool" / "web"
SOLUTIONS = json.loads((ROOT / "tools" / "solutions.json").read_text(encoding="utf-8"))


def run(job):
    with tempfile.TemporaryDirectory() as d:
        Path(d, "job.json").write_text(json.dumps(job), encoding="utf-8")
        Path(d, "runner.py").write_text((WEB / "runner.py").read_text(encoding="utf-8"), encoding="utf-8")
        r = subprocess.run([sys.executable, "-I", "runner.py", "job.json"], cwd=d, capture_output=True, text=True, timeout=20)
        return json.loads(r.stdout.rpartition("@@RESULT@@")[2])


def course():
    """Read lessons.js with a tiny JavaScript-free trick: node isn't needed, the file's data is extracted by
    evaluating it in a JS engine when available, else via the JSON copy written by tools/export_lessons.js."""
    data = ROOT / "tools" / "lessons.json"
    return json.loads(data.read_text(encoding="utf-8"))


def main():
    c = course()
    problems = 0
    for group in c["exercises"]:
        carried = ""
        for ex in group["steps"]:
            sol = SOLUTIONS[ex["id"]]
            code = (carried + "\n" + sol) if ex.get("carry") else sol
            carried = code
            good = run({"mode": "run", "code": code, "test": ex["test"]})
            ok = good.get("res") == "PASS"
            starter_passes = False
            if ex.get("start") is not None:
                bad = run({"mode": "run", "code": ex["start"], "test": ex["test"]})
                starter_passes = bad.get("res") == "PASS"
            if not ok or starter_passes:
                problems += 1
            print(("OK   " if ok and not starter_passes else "BAD  ") + ex["id"] +
                  ("" if ok else f"  (correct answer fails: {good.get('res') or good.get('err')})") +
                  ("  (starter code already passes)" if starter_passes else ""))
    for v in c["watch"]:
        t = run({"mode": "trace", "code": v["code"]})
        if t.get("err") or not t.get("steps"):
            problems += 1
            print("BAD  watch: " + v["id"] + " " + t.get("err", "no steps"))
        else:
            print(f"OK   watch: {v['id']} ({len(t['steps'])} steps)")
    print(f"\n{problems} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
