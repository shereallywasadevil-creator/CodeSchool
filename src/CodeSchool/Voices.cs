using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace CodeSchool;

/// <summary>
/// Human-sounding voices with Kokoro, run by sherpa-onnx on this PC (no internet once set up, nothing in the cloud).
/// One download (the engine + one voice pack) unlocks every voice. Nothing downloads until the learner clicks.
/// Files go to %LOCALAPPDATA%\CodeSchool\kokoro-engine and \kokoro-voices-hq.
///   voices      -> {"ready": bool}
///   voice_get   -> downloads + unpacks both (with Windows' own tar.exe); streams "step ..." and "pct NN"
///   say         -> {"audio": base64 wav} in voice number `sid`
/// The engine runs only while it is speaking, so it holds no memory between sentences.
/// </summary>
public static class Voices
{
    private static readonly string EngineDir = Path.Combine(Engine.DataDir, "kokoro-engine");
    private static readonly string PackDir = Path.Combine(Engine.DataDir, "kokoro-voices-hq");   // full quality; the older compressed pack in kokoro-voices is left untouched
    private static readonly HttpClient Web = new() { Timeout = TimeSpan.FromMinutes(40) };
    private static readonly SemaphoreSlim DownloadLock = new(1, 1);
    private static readonly SemaphoreSlim SpeakLock = new(1, 1);

    static Voices() { Web.DefaultRequestHeaders.UserAgent.ParseAdd("CodeSchool/1.0"); }

    private static JsonObject Catalog() => JsonNode.Parse(File.ReadAllText(Path.Combine(Engine.WebDir, "voices.json")))!.AsObject();
    private static JsonObject Err(string m) => new() { ["error"] = m };

    private static string? Find(string dir, string pattern) =>
        Directory.Exists(dir) ? Directory.EnumerateFiles(dir, pattern, SearchOption.AllDirectories).FirstOrDefault() : null;
    private static string? Exe() => Find(EngineDir, "sherpa-onnx-offline-tts.exe");
    private static string? Model() => Find(PackDir, "model.onnx");
    private static bool Ready() => Exe() != null && Model() != null;

    public static JsonObject List() => new() { ["ready"] = Ready() };

    public static async Task<JsonObject> Get(Action<string>? partial)
    {
        if (!await DownloadLock.WaitAsync(0)) return Err("The voices are already downloading. Give it a moment.");
        try
        {
            var cat = Catalog();
            if (Exe() == null)
                await Fetch((string)cat["engine"]!["url"]!, EngineDir, "Downloading the voice engine (1 of 2)", partial);
            if (Model() == null)
                await Fetch((string)cat["pack"]!["url"]!, PackDir, "Downloading the voices (2 of 2)", partial);
            return Ready() ? new JsonObject { ["ok"] = true } : Err("The download finished but the voice files weren't inside. Try again later.");
        }
        catch (Exception ex) { return Err("The download didn't finish (" + ex.Message + "). Check your internet and try again."); }
        finally { DownloadLock.Release(); }
    }

    /// <summary>Download a .tar.bz2, unpack it with Windows' tar into dir.part, then rename to dir.</summary>
    private static async Task Fetch(string url, string dir, string label, Action<string>? partial)
    {
        partial?.Invoke("step " + label);
        string file = dir + ".tar.bz2";
        await Download(url, file, p => partial?.Invoke("pct " + p));
        partial?.Invoke("step Unpacking");
        string part = dir + ".part";
        if (Directory.Exists(part)) Directory.Move(part, part + "-" + DateTime.Now.Ticks);   // set aside, never delete
        Directory.CreateDirectory(part);
        var psi = new ProcessStartInfo(Path.Combine(Environment.SystemDirectory, "tar.exe")) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true };
        foreach (var a in new[] { "-xf", file, "-C", part }) psi.ArgumentList.Add(a);
        using var p = Process.Start(psi)!;
        string err = await p.StandardError.ReadToEndAsync();
        await p.WaitForExitAsync();
        if (p.ExitCode != 0) throw new Exception("unpacking failed: " + err.Trim());
        if (Directory.Exists(dir)) Directory.Move(dir, dir + "-old-" + DateTime.Now.Ticks);
        Directory.Move(part, dir);
        File.Move(file, file + ".done", true);
    }

    /// <summary>Download to name.part, then rename, so a cut-off download never looks finished.</summary>
    private static async Task Download(string url, string target, Action<int>? progress)
    {
        using var resp = await Web.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
        resp.EnsureSuccessStatusCode();
        long total = resp.Content.Headers.ContentLength ?? 0, got = 0;
        string part = target + ".part";
        await using (var src = await resp.Content.ReadAsStreamAsync())
        await using (var dst = File.Create(part))
        {
            var buf = new byte[1 << 16];
            int n, last = -1;
            while ((n = await src.ReadAsync(buf)) > 0)
            {
                await dst.WriteAsync(buf.AsMemory(0, n));
                got += n;
                int pct = total > 0 ? (int)(got * 100 / total) : 0;
                if (pct != last) { last = pct; progress?.Invoke(pct); }
            }
        }
        File.Move(part, target, true);
    }

    public static async Task<JsonObject> Say(int sid, string text, double speed)
    {
        string? exe = Exe(), model = Model();
        if (exe == null || model == null) return Err("The natural voices aren't downloaded yet.");
        text = Regex.Replace(text ?? "", @"\s+", " ").Trim();
        if (text.Length == 0) return Err("Nothing to say.");
        if (text.Length > 1500) text = text[..1500];
        string pack = Path.GetDirectoryName(model)!;
        string wav = Path.Combine(Path.GetTempPath(), "codeschool_say_" + Guid.NewGuid().ToString("N") + ".wav");
        double scale = Math.Clamp(1.0 / Math.Clamp(speed, 0.6, 1.6), 0.6, 1.6);   // bigger length scale = slower
        string lexicon = Path.Combine(pack, "lexicon-us-en.txt");
        var args = new List<string>
        {
            "--kokoro-model=" + model,
            "--kokoro-voices=" + Path.Combine(pack, "voices.bin"),
            "--kokoro-tokens=" + Path.Combine(pack, "tokens.txt"),
            "--kokoro-data-dir=" + Path.Combine(pack, "espeak-ng-data"),
            "--kokoro-length-scale=" + scale.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture),
            "--num-threads=" + Math.Clamp(Environment.ProcessorCount / 2, 2, 6),
            "--sid=" + Math.Clamp(sid, 0, 60),
            "--output-filename=" + wav,
        };
        if (File.Exists(lexicon)) args.Insert(4, "--kokoro-lexicon=" + lexicon);
        args.Add(text);
        await SpeakLock.WaitAsync();
        try
        {
            var psi = new ProcessStartInfo(exe)
            {
                WorkingDirectory = Path.GetDirectoryName(exe)!, UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardError = true, RedirectStandardOutput = true,
            };
            foreach (var a in args) psi.ArgumentList.Add(a);
            using var proc = Process.Start(psi)!;
            var errTask = proc.StandardError.ReadToEndAsync();
            var outTask = proc.StandardOutput.ReadToEndAsync();
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(90));
            try { await proc.WaitForExitAsync(cts.Token); }
            catch (OperationCanceledException) { try { proc.Kill(true); } catch { } return Err("The voice took too long."); }
            if (!File.Exists(wav))
                return Err("The voice engine didn't answer: " + ((await errTask) + (await outTask)).Trim().Split('\n').LastOrDefault());
            return new JsonObject { ["audio"] = Convert.ToBase64String(await File.ReadAllBytesAsync(wav)) };
        }
        finally
        {
            SpeakLock.Release();
            try { File.Delete(wav); } catch { }   // our own temporary sound file
        }
    }
}
