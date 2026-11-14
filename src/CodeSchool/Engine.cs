using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace CodeSchool;

/// <summary>
/// Everything the lesson screens ask for:
///  run / trace - run the learner's Python (real Python, in a throwaway folder, stopped after 10 seconds);
///  coach       - ask the learner's Local AI (Ollama on this PC) a question;
///  lesson      - have the Local AI write a new lesson, keeping only exercises PROVEN to be passable;
///  load / save - progress, kept in %LOCALAPPDATA%\CodeSchool\progress.json.
/// </summary>
public sealed class Engine
{
    public static readonly string DataDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CodeSchool");
    private static readonly string PythonDir = Path.Combine(DataDir, "python");
    private static readonly string ProgressFile = Path.Combine(DataDir, "progress.json");
    private static readonly SemaphoreSlim PythonLock = new(1, 1);
    private static string? _python;
    private static string _webDir = "";

    private const string Ollama = "http://127.0.0.1:11434";
    private static readonly string[] Preferred = { "qwen3.5:9b", "qwen2.5-coder:7b", "qwen3.5:2b" };
    private static readonly HttpClient Http = new(new HttpClientHandler { UseProxy = false }) { Timeout = TimeSpan.FromMinutes(5) };
    private const int RunSeconds = 10;

    // ---------------------------------------------------------------- startup ----

    /// <summary>Unpack the lesson screens and the Python runner from inside the exe. Returns their folder.</summary>
    public static string UnpackWeb()
    {
        var asm = Assembly.GetExecutingAssembly();
        string ver = asm.GetName().Version?.ToString() ?? "0";
        _webDir = Path.Combine(DataDir, "web-" + ver);
        Directory.CreateDirectory(_webDir);
        foreach (string name in asm.GetManifestResourceNames())
        {
            if (!name.StartsWith("web/", StringComparison.Ordinal)) continue;
            string target = Path.Combine(_webDir, name.Substring(4).Replace('\\', Path.DirectorySeparatorChar).Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            using var src = asm.GetManifestResourceStream(name)!;
            using var dst = File.Create(target);
            src.CopyTo(dst);
        }
        return _webDir;
    }

    /// <summary>Python that ships inside the exe, unpacked once. Falls back to a Python already on the PC.</summary>
    public static async Task<string?> EnsurePython()
    {
        if (_python != null) return _python;
        await PythonLock.WaitAsync();
        try
        {
            if (_python != null) return _python;
            string exe = Path.Combine(PythonDir, "python.exe");
            if (!File.Exists(exe))
            {
                using var zip = Assembly.GetExecutingAssembly().GetManifestResourceStream("python.zip");
                if (zip != null)
                {
                    string tmp = PythonDir + ".part";
                    if (Directory.Exists(tmp)) Directory.Delete(tmp, true);
                    using (var archive = new ZipArchive(zip)) archive.ExtractToDirectory(tmp);
                    if (Directory.Exists(PythonDir)) Directory.Delete(PythonDir, true);
                    Directory.Move(tmp, PythonDir);
                }
            }
            if (File.Exists(exe)) return _python = exe;
            foreach (string candidate in new[] { "python", "py" })
            {
                try
                {
                    using var p = Process.Start(new ProcessStartInfo(candidate, "--version")
                    { CreateNoWindow = true, UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true });
                    if (p != null && p.WaitForExit(5000) && p.ExitCode == 0) return _python = candidate;
                }
                catch { /* not installed */ }
            }
            return null;
        }
        finally { PythonLock.Release(); }
    }

    // --------------------------------------------------------------- requests ----

    public async Task<object> HandleAsync(string type, JsonElement payload, Action<string>? partial = null)
    {
        string Str(string key) => payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : "";
        switch (type)
        {
            case "run":
            {
                var r = await RunPython(new JsonObject { ["mode"] = "run", ["code"] = Str("code"), ["test"] = Str("test") });
                if (r["error"] != null) return Result(("printed", ""), ("err", (string?)r["error"]), ("pass", false), ("fail", ""));
                string res = (string?)r["res"] ?? "";
                return Result(("printed", (string?)r["printed"] ?? ""), ("err", (string?)r["err"] ?? ""), ("pass", res == "PASS"),
                              ("fail", res.StartsWith("FAIL:") ? "Hint from the checker: " + res.Substring(5) : ""));
            }
            case "trace":
                return await RunPython(new JsonObject { ["mode"] = "trace", ["code"] = Str("code") });
            case "coach":
            {
                JsonArray msgs;
                if (payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty("messages", out var m) && m.ValueKind == JsonValueKind.Array)
                    msgs = JsonNode.Parse(m.GetRawText())!.AsArray();
                else
                    msgs = new JsonArray { new JsonObject { ["role"] = "user", ["content"] = Str("prompt") } };
                return await Coach(msgs, false, partial);
            }
            case "lesson":
                return await MakeLesson(Str("prompt"));
            case "load":
                try { return JsonNode.Parse(await File.ReadAllTextAsync(ProgressFile)) ?? new JsonObject(); }
                catch { return new JsonObject(); }
            case "save":
            {
                Directory.CreateDirectory(DataDir);
                string tmp = ProgressFile + ".tmp";
                string data = payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty("data", out var d) ? d.GetRawText() : "{}";
                await File.WriteAllTextAsync(tmp, data);
                File.Move(tmp, ProgressFile, true);
                return Result(("ok", true));
            }
            default:
                return Result(("error", "unknown request: " + type));
        }
    }

    private static Dictionary<string, object?> Result(params (string, object?)[] items)
    {
        var d = new Dictionary<string, object?>();
        foreach (var (k, v) in items) d[k] = v;
        return d;
    }

    // ----------------------------------------------------------------- Python ----

    /// <summary>Runs runner.py on a job in a throwaway folder, with a time limit. Returns its JSON result.</summary>
    public static async Task<JsonObject> RunPython(JsonObject job)
    {
        string? py = await EnsurePython();
        if (py == null)
            return new JsonObject { ["error"] = "Python isn't available. Reinstall Code School, or install Python from python.org." };
        string dir = Path.Combine(Path.GetTempPath(), "codeschool_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        try
        {
            await File.WriteAllTextAsync(Path.Combine(dir, "job.json"), job.ToJsonString());
            File.Copy(Path.Combine(_webDir, "runner.py"), Path.Combine(dir, "runner.py"));
            var psi = new ProcessStartInfo(py, "-I runner.py job.json")
            {
                WorkingDirectory = dir, CreateNoWindow = true, UseShellExecute = false,
                RedirectStandardOutput = true, RedirectStandardError = true,
                StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8,
            };
            psi.Environment["PYTHONIOENCODING"] = "utf-8";
            using var proc = Process.Start(psi)!;
            var outTask = proc.StandardOutput.ReadToEndAsync();
            var errTask = proc.StandardError.ReadToEndAsync();
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(RunSeconds));
            try { await proc.WaitForExitAsync(cts.Token); }
            catch (OperationCanceledException)
            {
                try { proc.Kill(true); } catch { }
                return new JsonObject { ["error"] = $"Your code ran for more than {RunSeconds} seconds and was stopped. Is there a loop that never ends?" };
            }
            string stdout = await outTask, stderr = await errTask;
            int at = stdout.LastIndexOf("@@RESULT@@", StringComparison.Ordinal);
            if (at < 0)
                return new JsonObject { ["error"] = (stderr.Length > 0 ? stderr : "Python stopped unexpectedly.").Trim() };
            return JsonNode.Parse(stdout.Substring(at + 10))!.AsObject();
        }
        finally
        {
            try { Directory.Delete(dir, true); } catch { }
        }
    }

    // ------------------------------------------------------------------ coach ----

    private static async Task<string?> PickModel()
    {
        try
        {
            var tags = JsonNode.Parse(await Http.GetStringAsync(Ollama + "/api/tags"))?["models"]?.AsArray();
            var have = tags?.Select(t => (string?)t?["name"]).Where(n => n != null).Cast<string>().ToList() ?? new();
            foreach (var m in Preferred) if (have.Contains(m)) return m;
            return have.FirstOrDefault(n => !n.Contains("embed"));
        }
        catch { return null; }
    }

    /// <summary>One answer from the Local AI. Returns {text} or {json} or {error}.</summary>
    public static async Task<JsonObject> Coach(JsonArray messages, bool wantJson, Action<string>? partial = null)
    {
        string? model = await PickModel();
        if (model == null)
            return new JsonObject { ["error"] = "Your coach needs Ollama running. Open Local AI (or Ollama), then try again." };
        var body = new JsonObject
        {
            ["model"] = model, ["stream"] = !wantJson, ["keep_alive"] = "10m",
            ["think"] = false,               // thinking models (qwen3.5) otherwise think silently for minutes first
            ["messages"] = JsonNode.Parse(messages.ToJsonString()),
            ["options"] = new JsonObject { ["temperature"] = wantJson ? 0.4 : 0.7, ["num_ctx"] = 8192 },
        };
        if (wantJson) body["format"] = "json";
        string text;
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(wantJson ? 240 : 120));
        try
        {
            var req = new HttpRequestMessage(HttpMethod.Post, Ollama + "/api/chat")
            { Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json") };
            using var resp = await Http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cts.Token);
            if (!resp.IsSuccessStatusCode)
                return new JsonObject { ["error"] = "Your coach had a problem (" + (int)resp.StatusCode + "). Try again." };
            if (wantJson)
            {
                string raw = await resp.Content.ReadAsStringAsync(cts.Token);
                text = (string?)JsonNode.Parse(raw)?["message"]?["content"] ?? "";
            }
            else
            {
                // Streamed: one JSON object per line, each with a piece of the answer.
                var sb = new StringBuilder();
                using var stream = await resp.Content.ReadAsStreamAsync(cts.Token);
                using var reader = new StreamReader(stream, Encoding.UTF8);
                DateTime lastSent = DateTime.MinValue;
                string? line;
                while ((line = await reader.ReadLineAsync(cts.Token)) != null)
                {
                    if (line.Length == 0) continue;
                    var chunk = JsonNode.Parse(line);
                    sb.Append((string?)chunk?["message"]?["content"] ?? "");
                    if (partial != null && (DateTime.UtcNow - lastSent).TotalMilliseconds > 120)
                    {
                        partial(sb.ToString());
                        lastSent = DateTime.UtcNow;
                    }
                    if ((bool?)chunk?["done"] == true) break;
                }
                text = sb.ToString();
            }
        }
        catch (OperationCanceledException)
        {
            return new JsonObject { ["error"] = "Your coach is taking too long. Your Local AI may be busy with its own lessons; try again in a minute." };
        }
        catch (Exception ex)
        {
            return new JsonObject { ["error"] = "Couldn't reach your coach (" + ex.GetType().Name + "). Is Ollama running?" };
        }
        text = Regex.Replace(text, "<think>.*?</think>", "", RegexOptions.Singleline).Trim();
        if (!wantJson) return new JsonObject { ["text"] = text };
        int a = text.IndexOf('{'), b = text.LastIndexOf('}');
        try { return new JsonObject { ["json"] = JsonNode.Parse(text.Substring(a, b - a + 1)) }; }
        catch { return new JsonObject { ["error"] = "The coach's lesson came back garbled. Try again." }; }
    }

    // ---------------------------------------------------------------- lessons ----

    /// <summary>
    /// A new lesson from the Local AI, where every code exercise is PROVEN before the learner sees it: the coach
    /// must include its own solution, which has to pass the exercise's checks, and the starter code must NOT pass
    /// them. Exercises that fail either test are dropped, so nobody gets stuck on a broken check.
    /// </summary>
    public static async Task<JsonObject> MakeLesson(string prompt)
    {
        JsonObject last = new() { ["error"] = "The coach couldn't build this lesson." };
        for (int attempt = 0; attempt < 2; attempt++)
        {
            var r = await Coach(new JsonArray { new JsonObject { ["role"] = "user", ["content"] = prompt } }, true);
            if (r["json"] is not JsonObject lesson) { last = r; continue; }
            var good = new JsonArray();
            int dropped = 0, checks = 0;
            foreach (var node in lesson["steps"]?.AsArray() ?? new JsonArray())
            {
                if (node is not JsonObject st) continue;
                string k = (string?)st["k"] ?? "";
                if (k == "P")
                {
                    var opts = st["opts"] as JsonArray;
                    int ans = st["a"] is JsonValue av && av.TryGetValue(out int ai) ? ai : -1;
                    if (opts == null || opts.Count < 2 || ans < 0 || ans >= opts.Count) continue;
                }
                else if (k == "F")
                {
                    if (st["a"] is not JsonArray fa || fa.Count == 0) continue;
                }
                else if (k == "W")
                {
                    string sol = (string?)st["solution"] ?? "", test = (string?)st["test"] ?? "", start = (string?)st["start"] ?? "";
                    if (sol.Length == 0 || test.Length == 0) { dropped++; continue; }
                    var ok = await RunPython(new JsonObject { ["mode"] = "run", ["code"] = sol, ["test"] = test });
                    var bad = await RunPython(new JsonObject { ["mode"] = "run", ["code"] = start, ["test"] = test });
                    if ((string?)ok["res"] != "PASS" || (string?)bad["res"] == "PASS") { dropped++; continue; }
                    st.Remove("solution");                     // never sent to the page: the learner earns it
                }
                else if (k == "O")
                {
                    if (st["lines"] is not JsonArray ol || ol.Count < 3) continue;
                }
                else if (k == "V")
                {
                    if (string.IsNullOrWhiteSpace((string?)st["code"])) continue;
                }
                else if (k != "L") continue;
                if (k != "L" && k != "V") checks++;
                good.Add(JsonNode.Parse(st.ToJsonString()));
            }
            if (checks >= 3 && good.Count > 0 && (string?)good[0]?["k"] == "L")
                return new JsonObject { ["json"] = new JsonObject { ["steps"] = good, ["dropped"] = dropped } };
            last = new JsonObject { ["error"] = "The coach's lesson didn't pass its own quality checks. Try again." };
        }
        return last;
    }
}
