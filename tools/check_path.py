"""Build check for the path to advanced (web/path.js): every exercise's solution must PASS its test and its
starting code must FAIL; every predict-the-output answer must be exactly what the code really prints (and no other
option may match); every worked example must run cleanly. Run by the GitHub build.

    python tools/check_path.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "src" / "CodeSchool" / "web"


def load_path():
    js = ("const window = {}; " + (WEB / "path.js").read_text(encoding="utf-8") + "\n" + (WEB / "path_teach.js").read_text(encoding="utf-8") +
          "\nconsole.log(JSON.stringify({path: window.PATH, teach: window.PATH_TEACH, coach: window.PATH_COACH, builds: window.WEEKLY_BUILDS}));")
    with tempfile.TemporaryDirectory() as d:           # a file, not "node -e": Windows caps command-line length
        f = Path(d, "dump_path.js")
        f.write_text(js, encoding="utf-8")
        r = subprocess.run(["node", str(f)], capture_output=True, text=True, encoding="utf-8")
    if r.returncode:
        sys.exit("path.js doesn't load: " + r.stderr[-800:])
    return json.loads(r.stdout)


def run(job):
    with tempfile.TemporaryDirectory() as d:
        Path(d, "job.json").write_text(json.dumps(job), encoding="utf-8")
        Path(d, "runner.py").write_text((WEB / "runner.py").read_text(encoding="utf-8"), encoding="utf-8")
        try:
            r = subprocess.run([sys.executable, "-I", "runner.py", "job.json"], cwd=d, capture_output=True, text=True, timeout=8)
        except subprocess.TimeoutExpired:          # e.g. a "this never stops" bug hunt: counts as failing, as in the app
            return {"res": "TIMEOUT", "err": "ran over 8 seconds", "printed": ""}
        return json.loads(r.stdout.rpartition("@@RESULT@@")[2])


def main():
    data = load_path()
    bad, n = 0, 0
    for sk in data["path"]:
        exercises = [("faded", sk["faded"]), ("write", sk["write"]), ("bug", sk["bug"])] + [(f"prove{i + 1}", p) for i, p in enumerate(sk["prove"])]
        for name, ex in exercises:
            n += 1
            good = run({"mode": "run", "code": ex["sol"], "test": ex["test"]})
            start = run({"mode": "run", "code": ex["start"], "test": ex["test"]})
            ok, starter = good.get("res") == "PASS", start.get("res") == "PASS"
            if not ok or starter:
                bad += 1
                print(f"BAD  {sk['id']}/{name}: " + ("" if ok else f"solution fails ({good.get('res') or good.get('err')}) ") + ("starter already passes" if starter else ""))
        for i, pr in enumerate(sk["predict"]):
            n += 1
            r = run({"mode": "run", "code": pr["code"], "test": ""})
            printed = (r.get("printed") or "").rstrip("\n")
            right = pr["opts"][pr["a"]]
            others = [o for j, o in enumerate(pr["opts"]) if j != pr["a"] and o == printed]
            if r.get("err") or printed != right or others:
                bad += 1
                print(f"BAD  {sk['id']}/predict{i + 1}: prints {printed!r}, answer says {right!r}" + (f", error {r.get('err')}" if r.get("err") else ""))
        n += 1
        t = run({"mode": "trace", "code": sk["worked"]["code"]})
        if t.get("err") or not t.get("steps"):
            bad += 1
            print(f"BAD  {sk['id']}/worked: {t.get('err', 'no steps')}")
    for sk in data["path"]:                            # the line-order puzzle (built in app.js from the "finish it" answer)
        lines = [l for l in sk["faded"]["sol"].rstrip().split("\n") if l.strip() and not l.strip().startswith("#")]
        if 3 <= len(lines) <= 10:
            n += 1
            r = run({"mode": "run", "code": "\n".join(lines), "test": sk["faded"]["test"]})
            if r.get("res") != "PASS":
                bad += 1; print(f"BAD  {sk['id']}/puzzle: its lines don't pass the test on their own ({r.get('err') or r.get('res')})")
    for sk in data["path"]:                            # the teaching: every skill has it, and its code runs cleanly
        t = data["teach"].get(sk["id"])
        if not t or not t.get("card") or not t.get("teach") or not t.get("try"):
            bad += 1; print(f"BAD  {sk['id']}: missing teaching, card or try-it"); continue
        for i, code in enumerate([x["code"] for x in t["teach"] if x.get("code")] + [t["try"]["start"]]):
            n += 1
            r = run({"mode": "run", "code": code, "test": ""})
            if r.get("err") or r.get("res") == "TIMEOUT":
                bad += 1; print(f"BAD  {sk['id']}/teach code {i + 1}: {r.get('err')}")
    print(f"{len(data['path'])} skills, {n} items checked, {bad} problem(s)")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
