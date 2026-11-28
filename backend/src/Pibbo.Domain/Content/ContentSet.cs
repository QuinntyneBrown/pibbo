namespace Pibbo.Domain.Content;

/// <summary>Everything served for one content version.</summary>
public sealed record ContentSet(string Version, IReadOnlyList<Activity> Activities, IReadOnlyList<Lesson> Lessons)
{
    /// <summary>Every picture and recording this version names, each once, in a stable order.</summary>
    public IReadOnlyList<string> Assets() =>
        Activities
            .SelectMany(activity => activity.Pictures.Concat(activity.Recordings).Append(activity.Recording))
            .Concat(Lessons.Select(lesson => lesson.Recording))
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray();
}
