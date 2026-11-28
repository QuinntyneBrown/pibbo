namespace Pibbo.Infrastructure.Content;

/// <summary>
/// Where the content lives on disk: <c>{Root}/content.json</c>, with pictures and recordings
/// under <c>{AssetsRoot}/pictures</c> and <c>{AssetsRoot}/recordings</c>.
/// </summary>
public sealed class ContentStoreOptions
{
    public const string Section = "Content";

    public string Root { get; set; } = "content";

    /// <summary>Defaults to <c>{Root}/assets</c>.</summary>
    public string? AssetsRoot { get; set; }

    public string ContentFile => Path.Combine(Path.GetFullPath(Root), "content.json");

    public string AssetsDirectory => Path.GetFullPath(AssetsRoot ?? Path.Combine(Root, "assets"));
}
