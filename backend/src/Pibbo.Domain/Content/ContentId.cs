using System.Text.RegularExpressions;

namespace Pibbo.Domain.Content;

/// <summary>The id of an activity or a lesson: lowercase letters, digits and hyphens, 1 to 64 long.</summary>
public static partial class ContentId
{
    public const string Pattern = "^[a-z0-9-]{1,64}$";

    public static bool IsWellFormed(string? id) => id is not null && WellFormed().IsMatch(id);

    // \z, not $: a trailing newline is not part of an id.
    [GeneratedRegex(@"\A[a-z0-9-]{1,64}\z", RegexOptions.CultureInvariant)]
    private static partial Regex WellFormed();
}
