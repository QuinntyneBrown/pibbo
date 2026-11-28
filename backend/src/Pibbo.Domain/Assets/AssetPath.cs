using System.Text.RegularExpressions;

namespace Pibbo.Domain.Assets;

/// <summary>
/// The path of a picture or a recording: under <c>/pictures/</c> or <c>/recordings/</c>, in
/// lowercase segments of letters, digits, hyphens and underscores, the last with an optional
/// extension. No segment can be empty, hidden, <c>.</c> or <c>..</c>, so a path never leaves
/// its folder.
/// </summary>
public static partial class AssetPath
{
    public const string Pictures = "pictures";
    public const string Recordings = "recordings";
    public const int MaxLength = 256;

    public static bool IsWellFormed(string? path) =>
        path is { Length: <= MaxLength } && WellFormed().IsMatch(path);

    public static bool IsPicture(string path) => path.StartsWith($"/{Pictures}/", StringComparison.Ordinal);

    public static bool IsRecording(string path) => path.StartsWith($"/{Recordings}/", StringComparison.Ordinal);

    /// <summary>The extension without its dot, or an empty string.</summary>
    public static string ExtensionOf(string path)
    {
        var name = path[(path.LastIndexOf('/') + 1)..];
        var dot = name.LastIndexOf('.');
        return dot < 0 ? string.Empty : name[(dot + 1)..];
    }

    [GeneratedRegex(
        @"\A/(pictures|recordings)(/[a-z0-9][a-z0-9_-]*)*/[a-z0-9][a-z0-9_-]*(\.[a-z0-9]+)?\z",
        RegexOptions.CultureInvariant)]
    private static partial Regex WellFormed();
}
