namespace Pibbo.Application.Content;

public enum ContentOutcome
{
    Found,
    NotFound,
    Unavailable,
}

/// <summary>What a query found, or why it found nothing. The API maps each outcome to a status.</summary>
public sealed record ContentResult<T>(ContentOutcome Outcome, T? Value = null, string? ETag = null)
    where T : class
{
    public static ContentResult<T> Found(T value, string eTag) => new(ContentOutcome.Found, value, eTag);

    public static ContentResult<T> NotFound() => new(ContentOutcome.NotFound);

    public static ContentResult<T> Unavailable() => new(ContentOutcome.Unavailable);
}
