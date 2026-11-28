namespace Pibbo.Domain.Content;

/// <summary>
/// The check a content version passes before it is served. It mirrors the frontend's build-time
/// check: ids are well formed and unique, text is short and plain, every activity and lesson
/// has its recording, and a lesson names only activities that exist.
/// </summary>
public static class ContentCheck
{
    public const int MaxTextLength = 80;
    public const string PicturesPrefix = "/pictures/";
    public const string RecordingsPrefix = "/recordings/";

    public static IReadOnlyList<string> Problems(ContentSet content)
    {
        var problems = new List<string>();
        Text(problems, "version", content.Version);

        var activityIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var activity in content.Activities)
        {
            var where = $"activity '{activity.Id}'";
            Id(problems, where, activity.Id, activityIds);
            Id(problems, $"{where} group", activity.Group, seen: null);
            Text(problems, $"{where} name", activity.Name);
            Text(problems, $"{where} glyph", activity.Glyph);
            Asset(problems, $"{where} recording", activity.Recording, RecordingsPrefix);
            foreach (var picture in activity.Pictures)
            {
                Asset(problems, $"{where} picture", picture, PicturesPrefix);
            }

            foreach (var recording in activity.Recordings)
            {
                Asset(problems, $"{where} recording", recording, RecordingsPrefix);
            }
        }

        var lessonIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var lesson in content.Lessons)
        {
            var where = $"lesson '{lesson.Id}'";
            Id(problems, where, lesson.Id, lessonIds);
            Text(problems, $"{where} name", lesson.Name);
            Asset(problems, $"{where} recording", lesson.Recording, RecordingsPrefix);
            if (lesson.Activities.Count == 0)
            {
                problems.Add($"{where} has no activity.");
            }

            foreach (var activity in lesson.Activities.Where(activity => !activityIds.Contains(activity)))
            {
                problems.Add($"{where} names an activity that does not exist: '{activity}'.");
            }
        }

        return problems;
    }

    private static void Id(List<string> problems, string where, string? id, HashSet<string>? seen)
    {
        if (!ContentId.IsWellFormed(id))
        {
            problems.Add($"{where} has an id that does not match {ContentId.Pattern}.");
        }
        else if (seen is not null && !seen.Add(id!))
        {
            problems.Add($"{where} appears more than once.");
        }
    }

    private static void Text(List<string> problems, string where, string? text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length > MaxTextLength)
        {
            problems.Add($"{where} must be 1 to {MaxTextLength} characters.");
        }
        else if (text.Any(character => char.IsControl(character) || character is '<' or '>'))
        {
            problems.Add($"{where} holds a character that is not allowed.");
        }
    }

    private static void Asset(List<string> problems, string where, string? path, string prefix)
    {
        var wellFormed = path is not null
            && path.StartsWith(prefix, StringComparison.Ordinal)
            && path.Length > prefix.Length
            && path.Split('/').Skip(1).All(part => part.Length > 0 && part != "." && part != "..")
            && path.All(character => char.IsAsciiLetterOrDigit(character) || character is '/' or '-' or '_' or '.');
        if (!wellFormed)
        {
            problems.Add($"{where} is not a path under {prefix}: '{path}'.");
        }
    }
}
