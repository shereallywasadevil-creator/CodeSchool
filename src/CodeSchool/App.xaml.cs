using System.Windows;

namespace CodeSchool;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        // Any crash shows a plain message instead of the app silently vanishing.
        DispatcherUnhandledException += (_, args) =>
        {
            MessageBox.Show("Something went wrong:\n\n" + args.Exception.Message, "Code School",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            args.Handled = true;
        };
        base.OnStartup(e);
    }
}
