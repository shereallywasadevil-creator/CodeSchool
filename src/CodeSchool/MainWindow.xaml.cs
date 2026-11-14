using System.IO;
using System.Text.Json;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace CodeSchool;

/// <summary>
/// The app window: one WebView2 that shows the lessons (web/index.html). The page talks to the C# engine
/// with postMessage({id, type, payload}); the engine answers with {id, result}. Nothing is served over the
/// network: the page is loaded from a local folder through a private virtual host name.
/// </summary>
public partial class MainWindow : Window
{
    private readonly Engine _engine = new();

    public MainWindow()
    {
        InitializeComponent();
        Loaded += async (_, _) => await StartAsync();
    }

    private async Task StartAsync()
    {
        try
        {
            string web = Engine.UnpackWeb();
            var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Engine.DataDir, "WebView2"));
            await Web.EnsureCoreWebView2Async(env);
            var core = Web.CoreWebView2;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.AreDefaultContextMenusEnabled = true;   // keeps copy / paste on right-click
            core.SetVirtualHostNameToFolderMapping("app.codeschool", web, CoreWebView2HostResourceAccessKind.Allow);
            core.WebMessageReceived += OnMessage;
            core.NewWindowRequested += (_, a) =>
            {
                // Links to other sites open in the normal browser, never inside the app.
                a.Handled = true;
                try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(a.Uri) { UseShellExecute = true }); }
                catch { /* no browser: ignore */ }
            };
            core.Navigate("https://app.codeschool/index.html");
            Loading.Visibility = Visibility.Collapsed;
            _ = Task.Run(Engine.EnsurePython);                     // unpack Python in the background on first run
        }
        catch (WebView2RuntimeNotFoundException)
        {
            Loading.Text = "Code School needs the Microsoft Edge WebView2 Runtime (built into Windows 11).\n" +
                           "Install it from microsoft.com/edge/webview2, then open Code School again.";
        }
        catch (Exception ex)
        {
            Loading.Text = "Code School couldn't start: " + ex.Message;
        }
    }

    private async void OnMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string id = "";
        object result;
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            id = root.GetProperty("id").GetString() ?? "";
            string type = root.GetProperty("type").GetString() ?? "";
            var payload = root.TryGetProperty("payload", out var p) ? p.Clone() : default;
            string myId = id;
            result = await _engine.HandleAsync(type, payload, text =>
            {
                // Pieces of a streamed coach answer, sent as they arrive (the page shows them live).
                Dispatcher.InvokeAsync(() =>
                {
                    try { Web.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new Dictionary<string, object?> { ["id"] = myId, ["partial"] = text })); }
                    catch { }
                });
            });
        }
        catch (Exception ex)
        {
            result = new Dictionary<string, object?> { ["error"] = ex.Message };
        }
        try
        {
            Web.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new Dictionary<string, object?> { ["id"] = id, ["result"] = result }));
        }
        catch { /* window closing */ }
    }
}
