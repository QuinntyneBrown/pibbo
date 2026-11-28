namespace Pibbo.Domain.Content;

/// <summary>A checked content version and the entity tag that changes whenever it does.</summary>
public sealed record ContentSnapshot(ContentSet Content, string ETag);
