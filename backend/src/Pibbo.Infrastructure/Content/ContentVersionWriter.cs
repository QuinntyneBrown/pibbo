using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Pibbo.Application.Content;
using Pibbo.Domain.Content;
using Pibbo.Infrastructure.Persistence;

namespace Pibbo.Infrastructure.Content;

/// <summary>Adds a content version to the database. A version already there is never rewritten.</summary>
public sealed class ContentVersionWriter(ContentDbContext database) : IContentVersions
{
    public async Task<PublishOutcome> PublishAsync(ContentSet content, string publishedBy, CancellationToken cancellationToken)
    {
        var eTag = ETagOf(content);
        if (await Existing(content.Version, cancellationToken) is { } existing)
        {
            return new PublishOutcome(false, existing.ETag, existing.ETag == eTag);
        }

        database.Versions.Add(new ContentVersionRow
        {
            Version = content.Version,
            ETag = eTag,
            PublishedBy = publishedBy,
            Activities = content.Activities.Select((activity, position) => new ActivityRow
            {
                Position = position,
                ActivityId = activity.Id,
                Group = activity.Group,
                Name = activity.Name,
                Glyph = activity.Glyph,
                Recording = activity.Recording,
                Pictures = [.. activity.Pictures],
                Recordings = [.. activity.Recordings],
            }).ToList(),
            Lessons = content.Lessons.Select((lesson, position) => new LessonRow
            {
                Position = position,
                LessonId = lesson.Id,
                Name = lesson.Name,
                Recording = lesson.Recording,
                Activities = [.. lesson.Activities],
            }).ToList(),
        });

        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return new PublishOutcome(true, eTag, true);
        }
        catch (DbUpdateException)
        {
            // Another instance may have published the same version first.
            database.ChangeTracker.Clear();
            if (await Existing(content.Version, cancellationToken) is not { } raced)
            {
                throw;
            }

            return new PublishOutcome(false, raced.ETag, raced.ETag == eTag);
        }
    }

    /// <summary>A strong tag over the content itself, so the same content always has the same tag.</summary>
    public static string ETagOf(ContentSet content) =>
        $"\"{Convert.ToHexStringLower(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(content)))[..32]}\"";

    private Task<ContentVersionRow?> Existing(string version, CancellationToken cancellationToken) =>
        database.Versions.AsNoTracking().FirstOrDefaultAsync(row => row.Version == version, cancellationToken);
}
