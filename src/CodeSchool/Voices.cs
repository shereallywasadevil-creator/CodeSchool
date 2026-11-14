using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Text;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace CodeSchool;

/// <summary>
/// Natural-sounding voices with Piper, a free neural voice engine that runs on this PC with no internet once set up.
/// Nothing downloads until the learner clicks "Get this voice". Files go to %LOCALAPPDATA%\CodeSchool\piper and \voices.
///   voices      -> {"engine": bool, "installed": [keys]}
///   voice_get   -> downloads the engine (first time) and one voice from the catalog in web/voices.json; streams "pct NN"
///   say         -> {"audio": base64 wav} spoken by the chosen voice
/// Piper runs only while it is speaking, so it holds no memory between sentences.
/// </summary>
public static class Voices
{
    private static readonly string EngineDir = Path.Combine(Engine.DataDir, "piper");
    private static readonly string VoiceDir = Path.Combine(Engine.DataDir, "voices");
    private static readonly HttpClient Web = new() { Timeout = TimeSpan.FromMinutes(30) };
    private static readonly SemaphoreSlim DownloadLock = new(1, 1);
    private static readonly SemaphoreSlim SpeakLock = new(1, 1);
    private static readonly Regex KeyShape = new(@"^[a-z]{2}_[A-Z]{2}-[a-z_0-9]+-(x_low|low|medium|high)$");

    static Voices() { Web.DefaultRequestHeaders.UserAgent.ParseAdd("CodeSchool/1.0"); }

    private static string? PiperExe() =>
        Directory.Exists(EngineDir) ? Directory.EnumerateFiles(EngineDir, "piper.exe", SearchOption.AllDirectories).FirstOrDefault() : null;
    private static string ModelPath(string key) => Path.Combine(VoiceDir, key + ".onnx");
    private static bool Installed(string key) => File.Exists(ModelPath(key)) && File.Exists(ModelPath(key) + ".json");

    private static JsonObject Catalog() =>
        JsonNode.Parse(File.ReadAllText(Path.Combine(Engine.WebDir, "voices.json")))!.AsObject();

    private static JsonObject Err(string m) => new() { ["error"] = m };

    public static JsonObject List()
    {
        var keys = new JsonArray();
        foreach (var v in Catalog()["voices"]!.AsArray())
        {
            string k = (string)v!["key"]!;
            if (Installed(k)) keys.Add(k);
        }
        return new JsonObject { ["engine"] = PiperExe() != null, ["installed"] = keys };
    }

    /// <summary>Only voices listed in the app's own catalog can be fetched, from the catalog's own address.</summary>
    public static async Task<JsonObject> Get(string key, Action<string>? partial)
    {
        var cat = Catalog();
        if (!KeyShape.IsMatch(key) || !cat["voices"]!.AsArray().Any(v => (string?)v!["key"] == key))
            return Err("That voice isn't in Code School's list.");
        if (!await DownloadLock.WaitAsync(0)) return Err("Another voice is still downloading. Give it a moment.");
        try
        {
            if (PiperExe() == null)
            {
                partial?.Invoke("step Setting up the voice engine (one time)");
                string zip = Path.Combine(Engine.DataDir, "piper_download.zip");
                await Download((string)cat["engine"]!["url"]!, zip, p => partial?.Invoke("pct " + p));
                string part = EngineDir + ".part";
                if (Directory.Exists(part)) Directory.Move(part, part + "-" + DateTime.Now.Ticks);   // set aside, never delete
                ZipFile.ExtractToDirectory(zip, part);
                Directory.Move(part, EngineDir);
                File.Move(zip, zip + ".done", true);
                if (PiperExe() == null) return Err("The voice engine downloaded but piper.exe wasn't inside. Try again later.");
            }
            if (!Installed(key))
            {
                Directory.CreateDirectory(VoiceDir);
                string[] p = key.Split('-');                       // en_US-ryan-high -> en/en_US/ryan/high/en_US-ryan-high.onnx
                string url = $"{(string)cat["base"]!}/{p[0][..2]}/{p[0]}/{p[1]}/{p[2]}/{key}.onnx";
                partial?.Invoke("step Downloading the voice");
                await Download(url + ".json", ModelPath(key) + ".json", null);
                await Download(url, ModelPath(key), pct => partial?.Invoke("pct " + pct));
            }
            return new JsonObject { ["ok"] = true };
        }
        catch (Exception ex)
        {
            return Err("The download didn't finish (" + ex.Message + "). Check your internet and try again.");
        }
        finally { DownloadLock.Release(); }
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

    public static async Task<JsonObject> Say(string key, string text, double speed)
    {
        string? exe = PiperExe();
        if (exe == null || !KeyShape.IsMatch(key) || !Installed(key)) return Err("That voice isn't downloaded yet.");
        text = Regex.Replace(text ?? "", @"\s+", " ").Trim();
        if (text.Length == 0) return Err("Nothing to say.");
        if (text.Length > 1500) text = text[..1500];
        double scale = Math.Clamp(1.0 / Math.Clamp(speed, 0.6, 1.6), 0.6, 1.6);   // Piper: bigger length_scale = slower
        string wav = Path.Combine(Path.GetTempPath(), "codeschool_say_" + Guid.NewGuid().ToString("N") + ".wav");
        await SpeakLock.WaitAsync();
        try
        {
            var psi = new ProcessStartInfo(exe)
            {
                WorkingDirectory = Path.GetDirectoryName(exe)!,
                UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardInput = true, RedirectStandardError = true, RedirectStandardOutput = true,
                StandardInputEncoding = new UTF8Encoding(false),
            };
            foreach (var a in new[] { "--model", ModelPath(key), "--output_file", wav,
                                      "--length_scale", scale.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture),
                                      "--sentence_silence", "0.25" })
                psi.ArgumentList.Add(a);
            using var proc = Process.Start(psi)!;
            var errTask = proc.StandardError.ReadToEndAsync();
            var outTask = proc.StandardOutput.ReadToEndAsync();
            await proc.StandardInput.WriteLineAsync(text);
            proc.StandardInput.Close();
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(90));
            try { await proc.WaitForExitAsync(cts.Token); }
            catch (OperationCanceledException) { try { proc.Kill(true); } catch { } return Err("The voice took too long."); }
            if (!File.Exists(wav)) return Err("The voice engine didn't answer: " + (await errTask).Trim().Split('\n').LastOrDefault());
            byte[] bytes = await File.ReadAllBytesAsync(wav);
            return new JsonObject { ["audio"] = Convert.ToBase64String(bytes) };
        }
        finally
        {
            SpeakLock.Release();
            try { File.Delete(wav); } catch { }   // our own temporary sound file
        }
    }
}
