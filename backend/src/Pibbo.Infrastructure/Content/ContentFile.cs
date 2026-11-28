using System.Security.Cryptography;
using System.Text.Json;
using Pibbo.Domain.Content;

namespace Pibbo.Infrastructure.Content;

/// <summary>Reads the reviewed content file and checks it, with the files it names.</summary>
public static class ContentFile
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public sealed record Loaded(ContentSet? Content, string? ETag, IReadOnlyList<string> Problems);

    public static async Task<Loaded> LoadAsync(ContentStoreOptions options, CancellationToken cancellationToken)
    {
        try
        {
            var bytes = await File.ReadAllBytesAsync(options.ContentFile, cancellationToken);
            var document = JsonSerializer.Deserialize<ContentDocument>(bytes, Json);
            var content = new ContentSet(
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
                    lesson.Activities ?? [])).ToArray());

            var problems = ContentCheck.Problems(content);
            if (problems.Count == 0)
            {
                problems = content.Assets()
                    .Where(asset => !File.Exists(Path.Combine(options.AssetsDirectory, asset.TrimStart('/'))))
                    .Select(asset => $"The file is missing: {asset}")
                    .ToArray();
            }

            return problems.Count > 0
                ? new Loaded(null, null, problems)
                : new Loaded(content, $"\"{Convert.ToHexStringLower(SHA256.HashData(bytes))[..32]}\"", []);
        }
        catch (Exception exception) when (exception is JsonException or IOException or UnauthorizedAccessException)
        {
            return new Loaded(null, null, [$"The content file could not be read: {exception.Message}"]);
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
