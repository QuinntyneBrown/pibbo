namespace Pibbo.Application.Content;

/// <summary>The index of one content version: what exists and which assets it needs.</summary>
public sealed record Manifest(
    string ContentVersion,
    IReadOnlyList<ManifestActivity> Activities,
    IReadOnlyList<ManifestLesson> Lessons,
    IReadOnlyList<string> Assets);

public sealed record ManifestActivity(string Id, string Group, string Name);

public sealed record ManifestLesson(string Id, string Name);
