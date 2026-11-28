namespace Pibbo.Infrastructure.Persistence;

/// <summary>One published content version. Versions are only ever added; the newest is served.</summary>
public sealed class ContentVersionRow
{
    public int Id { get; set; }

    public required string Version { get; set; }

    public required string ETag { get; set; }

    /// <summary>Who published it: the content file, or the staff member's id from their token.
    /// Never anything about a child.</summary>
    public required string PublishedBy { get; set; }

    public List<ActivityRow> Activities { get; set; } = [];

    public List<LessonRow> Lessons { get; set; } = [];
}

public sealed class ActivityRow
{
    public int Id { get; set; }

    public int ContentVersionId { get; set; }

    /// <summary>Its place in the order Home shows activities.</summary>
    public int Position { get; set; }

    public required string ActivityId { get; set; }

    public required string Group { get; set; }

    public required string Name { get; set; }

    public required string Glyph { get; set; }

    public required string Recording { get; set; }

    public List<string> Pictures { get; set; } = [];

    public List<string> Recordings { get; set; } = [];
}

public sealed class LessonRow
{
    public int Id { get; set; }

    public int ContentVersionId { get; set; }

    public int Position { get; set; }

    public required string LessonId { get; set; }

    public required string Name { get; set; }

    public required string Recording { get; set; }

    public List<string> Activities { get; set; } = [];
}
