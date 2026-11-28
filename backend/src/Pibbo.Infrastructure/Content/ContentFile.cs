using System.Text.Json;
using Pibbo.Domain.Content;

namespace Pibbo.Infrastructure.Content;

/// <summary>Reads the reviewed content file. Checking it is the validator's.</summary>
public static class ContentFile
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public sealed record Loaded(ContentSet? Content, string? Problem);

    public static async Task<Loaded> LoadAsync(ContentStoreOptions options, CancellationToken cancellationToken)
    {
        try
        {
            await using var stream = File.OpenRead(options.ContentFile);
            var document = await JsonSerializer.DeserializeAsync<ContentDocument>(stream, Json, cancellationToken);
            return new Loaded(
                new ContentSet(
                    document?.Version ?? string.Empty,
                    (document?.Activities ?? []).Select(activity => new Activity(
                        activity.Id ?? string.Empty,
                        activity.Group ?? string.Empty,
                        activity.Name ?? string.Empty,
                        activity.Glyph ?? string.Empty,
                        activity.Recording ?? string.Empty,
                        activity.Pictures ?? [],
                        activity.Recordings ?? [])).ToArray(),
                    (document?.Lessons ?? []).Select(lesson => new Lesson(
                        lesson.Id ?? string.Empty,
                        lesson.Name ?? string.Empty,
                        lesson.Recording ?? string.Empty,
                        lesson.Activities ?? [])).ToArray()),
                null);
        }
        catch (Exception exception) when (exception is JsonException or IOException or UnauthorizedAccessException)
        {
            return new Loaded(null, $"The content file could not be read: {exception.Message}");
        }
    }

    private sealed record ContentDocument(
        string? Version,
        List<ActivityDocument>? Activities,
        List<LessonDocument>? Lessons);

    private sealed record ActivityDocument(
        string? Id,
        string? Group,
        string? Name,
        string? Glyph,
        string? Recording,
        List<string>? Pictures,
        List<string>? Recordings);

    private sealed record LessonDocument(string? Id, string? Name, string? Recording, List<string>? Activities);
}
