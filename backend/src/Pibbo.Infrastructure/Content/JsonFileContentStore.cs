using System.Security.Cryptography;
using System.Text.Json;
using Pibbo.Application.Content;
using Pibbo.Domain.Content;

namespace Pibbo.Infrastructure.Content;

/// <summary>
/// Content kept as one reviewed JSON file beside its pictures and recordings. The file is read
/// again only when it changes, so publishing a version is replacing the file. A version that
/// does not pass the check is never served.
/// </summary>
public sealed class JsonFileContentStore(ContentStoreOptions options) : IContentStore
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    private readonly Lock _gate = new();
    private (DateTime Written, long Length)? _stamp;
    private ContentSnapshot? _snapshot;

    /// <summary>Why nothing is served, for the operator's log. Null while content is served.</summary>
    public string? Problem { get; private set; }

    public ContentSnapshot? Read()
    {
        lock (_gate)
        {
            var file = new FileInfo(options.ContentFile);
            if (!file.Exists)
            {
                _stamp = null;
                Problem = $"The content file was not found: {file.FullName}";
                return _snapshot = null;
            }

            var stamp = (file.LastWriteTimeUtc, file.Length);
            if (_stamp == stamp)
            {
                return _snapshot;
            }

            _stamp = stamp;
            return _snapshot = Load(file);
        }
    }

    private ContentSnapshot? Load(FileInfo file)
    {
        try
        {
            var bytes = File.ReadAllBytes(file.FullName);
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

            if (problems.Count > 0)
            {
                Problem = "The content did not pass the check: " + string.Join(' ', problems);
                return null;
            }

            Problem = null;
            return new ContentSnapshot(content, $"\"{Convert.ToHexStringLower(SHA256.HashData(bytes))[..32]}\"");
        }
        catch (Exception exception) when (exception is JsonException or IOException or UnauthorizedAccessException)
        {
            Problem = $"The content file could not be read: {exception.Message}";
            return null;
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
