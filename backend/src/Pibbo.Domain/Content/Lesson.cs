namespace Pibbo.Domain.Content;

/// <summary>A lesson: activities in the order a child meets them.</summary>
public sealed record Lesson(string Id, string Name, string Recording, IReadOnlyList<string> Activities);
