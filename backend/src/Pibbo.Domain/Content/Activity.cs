namespace Pibbo.Domain.Content;

/// <summary>
/// An activity a child can choose: its name as shown and spoken, and the pictures and
/// recordings it needs, so they can be fetched when it is chosen.
/// </summary>
public sealed record Activity(
    string Id,
    string Group,
    string Name,
    string Glyph,
    string Recording,
    IReadOnlyList<string> Pictures,
    IReadOnlyList<string> Recordings);
