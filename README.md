# Code School

A Windows app that teaches coding from zero to job-ready, one small step at a time.

- **Your route:** 18 units on a transit-style map, from your first `print()` to system design and interviews.
- **Small steps:** read a little, watch code run line by line, answer a quick check, write real code that gets tested.
- **Watch it run:** step through any code and see each variable change, like a debugger built for learning.
- **Projects:** a league scoreboard, an odds calculator and a text adventure engine, built milestone by milestone.
- **Practice:** redo what you missed, or get fresh exercises on anything you've learned.
- **Your coach:** your own Local AI (Ollama) explains, hints and writes later lessons. Every exercise it writes is
  run against its own answer before you see it, so you never get stuck on a broken check.

## Download

Get **Code School.exe** from this repository's Releases page, or from the newest run on the Actions tab (Artifacts).
It's one file: Python and the lessons are inside. It needs Windows 10 or 11 with the WebView2 runtime (built into
Windows 11). The coach needs [Ollama](https://ollama.com) running with a chat model.

## How it's built

| Part | File | Job |
|---|---|---|
| Window | `src/CodeSchool/MainWindow.xaml(.cs)` | WPF window holding a WebView2 that shows the lessons |
| Engine | `src/CodeSchool/Engine.cs` | Runs Python, talks to Ollama, proves coach-written exercises, saves progress |
| Screens | `src/CodeSchool/web/index.html`, `app.css`, `app.js` | Route map, lesson player, visualizer, projects, practice, coach |
| Lessons | `src/CodeSchool/web/lessons.js` | Hand-written course content and projects |
| Runner | `src/CodeSchool/web/runner.py` | Runs code and checks; `trace` mode records each line for the visualizer |
| Build | `.github/workflows/build.yml` | Checks every lesson, bundles Python, builds the single-file exe on GitHub |

The page and the engine talk through WebView2 messages: the page sends `{id, type, payload}` (`run`, `trace`,
`coach`, `lesson`, `load`, `save`) and the engine answers `{id, result}`.

### Working on it

- `python tools/devserver.py` runs the screens in a normal browser at http://127.0.0.1:8790, using the same runner.
- After editing `lessons.js`: `node tools/export_lessons.js`, add the new answers to `tools/solutions.json`, then
  `python tools/check_lessons.py`. The build refuses to ship an exercise that can't be passed.

Progress is saved in `%LOCALAPPDATA%\CodeSchool\progress.json`.
