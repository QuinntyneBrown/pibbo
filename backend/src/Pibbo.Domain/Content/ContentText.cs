using System.Text;

namespace Pibbo.Domain.Content;

/// <summary>
/// Text a child is shown and that is spoken: 1 to 80 characters from an allow-list of letters,
/// digits, spaces and a few marks. Nothing that markup, a template or a script needs.
/// </summary>
public static class ContentText
{
    public const int MaxLength = 80;
    public const string AllowedMarks = "'’-?!.,+_♪";
    public const string Allowed = "letters, digits, spaces and ' ’ - ? ! . , + _ ♪";

    public static bool HasAllowedLength(string? text) =>
        !string.IsNullOrWhiteSpace(text) && text.Length <= MaxLength;

    public static bool HasOnlyAllowedCharacters(string? text) =>
        text is not null && text.EnumerateRunes().All(IsAllowed);

    private static bool IsAllowed(Rune rune) =>
        rune.Value == ' '
        || Rune.IsLetter(rune)
        || Rune.IsDigit(rune)
        || Rune.GetUnicodeCategory(rune) is System.Globalization.UnicodeCategory.NonSpacingMark
            or System.Globalization.UnicodeCategory.SpacingCombiningMark
        || (rune.IsBmp && AllowedMarks.Contains((char)rune.Value));
}
