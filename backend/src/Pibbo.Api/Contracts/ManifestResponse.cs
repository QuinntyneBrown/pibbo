using Pibbo.Application.Content;

namespace Pibbo.Api.Contracts;

/// <summary>The index of one content version.</summary>
public sealed record ManifestResponse
{
    /// <summary>The version of the content this manifest lists.</summary>
    public required string ContentVersion { get; init; }

    /// <summary>Every activity, in the order Home shows them.</summary>
    public required IReadOnlyList<ManifestActivityResponse> Activities { get; init; }

    /// <summary>Every lesson.</summary>
    public required IReadOnlyList<ManifestLessonResponse> Lessons { get; init; }

    /// <summary>The path of every picture and recording this version needs.</summary>
    public required IReadOnlyList<string> Assets { get; init; }

    public static ManifestResponse From(Manifest manifest) => new()
    {
        ContentVersion = manifest.ContentVersion,
        Activities = manifest.Activities
            .Select(activity => new ManifestActivityResponse { Id = activity.Id, Group = activity.Group, Name = activity.Name })
            .ToArray(),
        Lessons = manifest.Lessons
            .Select(lesson => new ManifestLessonResponse { Id = lesson.Id, Name = lesson.Name })
            .ToArray(),
        Assets = manifest.Assets,
    };
}

/// <summary>An activity as the manifest lists it.</summary>
public sealed record ManifestActivityResponse
{
    /// <summary>The activity's id: GET /api/v1/activities/{id} returns it.</summary>
    public required string Id { get; init; }

    /// <summary>The id of the group Home shows it in.</summary>
    public required string Group { get; init; }

    /// <summary>The name, shown and given as the text alternative.</summary>
    public required string Name { get; init; }
}

/// <summary>A lesson as the manifest lists it.</summary>
public sealed record ManifestLessonResponse
{
    /// <summary>The lesson's id: GET /api/v1/lessons/{id} returns it.</summary>
    public required string Id { get; init; }

    /// <summary>The name, shown and given as the text alternative.</summary>
    public required string Name { get; init; }
}
