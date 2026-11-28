using Pibbo.Domain.Content;

namespace Pibbo.Api.Contracts;

/// <summary>A stored picture or recording.</summary>
public sealed record AssetResponse
{
    /// <summary>The path it is served at.</summary>
    public required string Path { get; init; }
}

/// <summary>A published content version.</summary>
public sealed record PublishedVersionResponse
{
    public required string ContentVersion { get; init; }

    /// <summary>The ETag the manifest is served with from now on.</summary>
    public required string ETag { get; init; }
}

/// <summary>A content version to publish: the same shape as <c>content.json</c>.</summary>
public sealed record PublishContentRequest
{
    public string? Version { get; init; }

    public IReadOnlyList<PublishActivityRequest>? Activities { get; init; }

    public IReadOnlyList<PublishLessonRequest>? Lessons { get; init; }

    public ContentSet ToContentSet() => new(
        Version ?? string.Empty,
        (Activities ?? []).Select(activity => new Activity(
            activity.Id ?? string.Empty,
            activity.Group ?? string.Empty,
            activity.Name ?? string.Empty,
            activity.Glyph ?? string.Empty,
            activity.Recording ?? string.Empty,
            activity.Pictures ?? [],
            activity.Recordings ?? [])).ToArray(),
        (Lessons ?? []).Select(lesson => new Lesson(
            lesson.Id ?? string.Empty,
            lesson.Name ?? string.Empty,
            lesson.Recording ?? string.Empty,
            lesson.Activities ?? [])).ToArray());
}

public sealed record PublishActivityRequest
{
    public string? Id { get; init; }

    public string? Group { get; init; }

    public string? Name { get; init; }

    public string? Glyph { get; init; }

    public string? Recording { get; init; }

    public IReadOnlyList<string>? Pictures { get; init; }

    public IReadOnlyList<string>? Recordings { get; init; }
}

public sealed record PublishLessonRequest
{
    public string? Id { get; init; }

    public string? Name { get; init; }

    public string? Recording { get; init; }

    public IReadOnlyList<string>? Activities { get; init; }
}
