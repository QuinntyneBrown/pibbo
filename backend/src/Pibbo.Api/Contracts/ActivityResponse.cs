using Pibbo.Domain.Content;

namespace Pibbo.Api.Contracts;

/// <summary>An activity: its name as shown and spoken, and the pictures and recordings it needs.</summary>
public sealed record ActivityResponse
{
    /// <summary>The activity's id.</summary>
    public required string Id { get; init; }

    /// <summary>The id of the group Home shows it in.</summary>
    public required string Group { get; init; }

    /// <summary>The name, shown and given as the text alternative.</summary>
    public required string Name { get; init; }

    /// <summary>The short picture-like text drawn on its card.</summary>
    public required string Glyph { get; init; }

    /// <summary>The path of the recording that speaks the name.</summary>
    public required string Recording { get; init; }

    /// <summary>The paths of the pictures to have ready before a round is shown.</summary>
    public required IReadOnlyList<string> Pictures { get; init; }

    /// <summary>The paths of the recordings to have ready before a round is shown.</summary>
    public required IReadOnlyList<string> Recordings { get; init; }

    public static ActivityResponse From(Activity activity) => new()
    {
        Id = activity.Id,
        Group = activity.Group,
        Name = activity.Name,
        Glyph = activity.Glyph,
        Recording = activity.Recording,
        Pictures = activity.Pictures,
        Recordings = activity.Recordings,
    };
}
