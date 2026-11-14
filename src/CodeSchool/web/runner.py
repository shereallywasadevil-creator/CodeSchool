"""Code School's Python runner. Runs a learner's code in a fresh process and reports back as JSON.

Modes (read from job.json: {"mode": "run" | "trace", "code": "...", "test": "..."}):
  run   - run the code, then the lesson's checks (OUT = everything printed). Result: printed, err, res.
  trace - run the code line by line and record every step: the line, the variables at that moment and the
          output so far, for the "Watch it run" visualizer. Capped so a long loop can't flood the app.
"""
import io
import json
import sys
import traceback

MAX_STEPS = 400


def _short(v):
    try:
        r = repr(v)
    except Exception:
        r = "<?>"
    return r if len(r) <= 80 else r[:77] + "..."


def _err_text(ex):
    msg = "".join(traceback.format_exception_only(type(ex), ex)).strip()
    lines = [f.lineno for f in traceback.extract_tb(ex.__traceback__) if f.filename == "your_code.py"]
    return (f"Line {lines[-1]}: " if lines else "") + msg


def run(code, test):
    buf, old = io.StringIO(), sys.stdout
    sys.stdout = buf
    ns, err, res = {"__name__": "__main__"}, "", ""
    try:
        exec(compile(code, "your_code.py", "exec"), ns)
    except BaseException as ex:  # noqa: BLE001 - report every error to the learner
        err = _err_text(ex)
    sys.stdout = old
    printed = buf.getvalue()
    if not err and test:
        ns["OUT"] = printed
        try:
            exec(compile(test, "checks.py", "exec"), ns)
            res = "PASS"
        except AssertionError as ex:
            res = "FAIL:" + (str(ex) or "one of the checks didn't pass")
        except BaseException as ex:  # noqa: BLE001
            res = "FAIL:" + type(ex).__name__ + ": " + str(ex)
    return {"printed": printed, "err": err, "res": res}


def trace(code):
    buf, old = io.StringIO(), sys.stdout
    steps, ns = [], {"__name__": "__main__"}

    class Stop(Exception):
        pass

    def snapshot(frame):
        src = frame.f_locals if frame.f_code.co_name != "<module>" else frame.f_globals
        vs = {k: _short(v) for k, v in src.items()
              if not k.startswith("__") and not callable(v) and type(v).__name__ != "module"}
        fns = [k for k, v in frame.f_globals.items() if callable(v) and not k.startswith("__")
               and getattr(v, "__module__", None) == "__main__"]
        return vs, fns

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "your_code.py":
            return tracer
        if event in ("line", "return"):
            if len(steps) >= MAX_STEPS:
                raise Stop()
            vs, fns = snapshot(frame)
            where = frame.f_code.co_name
            step = {"line": frame.f_lineno, "vars": vs, "out": buf.getvalue(),
                    "in": "" if where == "<module>" else where, "fns": fns}
            if event == "return":
                step["ret"] = _short(arg)
            steps.append(step)
        return tracer

    sys.stdout = buf
    err, capped = "", False
    sys.settrace(tracer)
    try:
        exec(compile(code, "your_code.py", "exec"), ns)
    except Stop:
        capped = True
    except BaseException as ex:  # noqa: BLE001
        err = _err_text(ex)
    finally:
        sys.settrace(None)
        sys.stdout = old
    return {"steps": steps, "printed": buf.getvalue(), "err": err, "capped": capped}


if __name__ == "__main__":
    job = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "job.json", encoding="utf-8"))
    out = trace(job.get("code", "")) if job.get("mode") == "trace" else run(job.get("code", ""), job.get("test", ""))
    sys.stdout.write("\n@@RESULT@@" + json.dumps(out))
