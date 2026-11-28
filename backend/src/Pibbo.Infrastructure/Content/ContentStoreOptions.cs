namespace Pibbo.Infrastructure.Content;

/// <summary>
/// Where reviewed content is picked up from: <c>{Root}/content.json</c>, with pictures and
/// recordings under <c>{AssetsRoot}/pictures</c> and <c>{AssetsRoot}/recordings</c>. Both are
/// absolute paths by the time they are used.
/// </summary>
public sealed class ContentStoreOptions
{
    public const string Section = "Content";

    public string Root { get; set; } = "content";

    /// <summary>Defaults to <c>{Root}/assets</c>.</summary>
    public string? AssetsRoot { get; set; }

    public string ContentFile => Path.Combine(Root, "content.json");

    public string AssetsDirectory => AssetsRoot ?? Path.Combine(Root, "assets");
}
