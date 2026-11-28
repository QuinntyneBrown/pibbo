using Pibbo.Domain.Content;

namespace Pibbo.Api.Contracts;

/// <summary>A lesson: activities in the order a child meets them.</summary>
public sealed record LessonResponse
{
    /// <summary>The lesson's id.</summary>
    public required string Id { get; init; }

    /// <summary>The name, shown and given as the text alternative.</summary>
    public required string Name { get; init; }

    /// <summary>The path of the recording that speaks the name.</summary>
    public required string Recording { get; init; }

    /// <summary>The ids of its activities, in order.</summary>
    public required IReadOnlyList<string> Activities { get; init; }

    public static LessonResponse From(Lesson lesson) => new()
    {
        Id = lesson.Id,
        Name = lesson.Name,
        Recording = lesson.Recording,
        Activities = lesson.Activities,
    };
}
