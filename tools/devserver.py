"""Development server: runs the Code School screens in a normal browser, without building the Windows app.

    python tools/devserver.py          then open http://127.0.0.1:8790

It answers the same requests as the app's C# engine (Engine.cs) using the same runner.py, so the lessons,
"Watch it run" and code checks behave exactly as in the app. The coach uses Ollama if it's running.
"""
import json
import subprocess
import sys
import tempfile
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent / "src" / "CodeSchool" / "web"
PROGRESS = Path(tempfile.gettempdir()) / "codeschool_dev_progress.json"
OLLAMA = "http://127.0.0.1:11434"


def runner(job):
    with tempfile.TemporaryDirectory() as d:
        Path(d, "job.json").write_text(json.dumps(job), encoding="utf-8")
        Path(d, "runner.py").write_text((WEB / "runner.py").read_text(encoding="utf-8"), encoding="utf-8")
        try:
            r = subprocess.run([sys.executable, "-I", "runner.py", "job.json"], cwd=d, capture_output=True,
                               text=True, timeout=10)
        except subprocess.TimeoutExpired:
            return {"error": "Your code ran for more than 10 seconds and was stopped. Is there a loop that never ends?"}
        if "@@RESULT@@" not in r.stdout:
            return {"error": (r.stderr or "Python stopped unexpectedly.").strip()}
        return json.loads(r.stdout.rpartition("@@RESULT@@")[2])


def coach(messages, want_json=False):
    try:
        tags = json.loads(urllib.request.urlopen(OLLAMA + "/api/tags", timeout=3).read())["models"]
        model = next(m["name"] for m in tags if "embed" not in m["name"])
        body = {"model": model, "messages": messages, "stream": False}
        if want_json:
            body["format"] = "json"
        req = urllib.request.Request(OLLAMA + "/api/chat", json.dumps(body).encode(), {"Content-Type": "application/json"})
        text = json.loads(urllib.request.urlopen(req, timeout=300).read())["message"]["content"]
        return {"json": json.loads(text[text.find("{"):text.rfind("}") + 1])} if want_json else {"text": text}
    except Exception as e:
        return {"error": f"Your coach needs Ollama running ({type(e).__name__})."}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, obj, ctype="application/json"):
        data = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        name = self.path.split("?")[0].lstrip("/") or "index.html"
        f = (WEB / name).resolve()
        if WEB not in f.parents or not f.is_file():
            self.send_error(404)
            return
        types = {".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}
        self.send(f.read_bytes(), types.get(f.suffix, "application/octet-stream"))

    def do_POST(self):
        p = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        kind = self.path.rsplit("/", 1)[-1]
        if kind == "run":
            r = runner({"mode": "run", "code": p.get("code", ""), "test": p.get("test", "")})
            if "error" in r:
                return self.send({"printed": "", "err": r["error"], "pass": False, "fail": ""})
            res = r["res"]
            return self.send({"printed": r["printed"], "err": r["err"], "pass": res == "PASS",
                              "fail": "Hint from the checker: " + res[5:] if res.startswith("FAIL:") else ""})
        if kind == "trace":
            return self.send(runner({"mode": "trace", "code": p.get("code", "")}))
        if kind == "voices":                     # natural voices need the real app (Piper on Windows)
            return self.send({"engine": False, "installed": []})
        if kind in ("voice_get", "say"):
            return self.send({"error": "Natural voices work in the desktop app."})
        if kind == "coach":
            return self.send(coach(p.get("messages") or [{"role": "user", "content": p.get("prompt", "")}]))
        if kind == "lesson":
            return self.send(coach([{"role": "user", "content": p.get("prompt", "")}], True))
        if kind == "load":
            try:
                return self.send(json.loads(PROGRESS.read_text()))
            except (OSError, ValueError):
                return self.send({})
        if kind == "save":
            PROGRESS.write_text(json.dumps(p.get("data", {})))
            return self.send({"ok": True})
        self.send({"error": "unknown request"})


if __name__ == "__main__":
    print("Code School dev server: http://127.0.0.1:8790")
    ThreadingHTTPServer(("127.0.0.1", 8790), H).serve_forever()
