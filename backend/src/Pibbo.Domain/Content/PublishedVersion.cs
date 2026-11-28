namespace Pibbo.Domain.Content;

/// <summary>A content version that passed the check and is served, with the entity tag that
/// changes whenever the content does.</summary>
public sealed record PublishedVersion(string Version, string ETag);
