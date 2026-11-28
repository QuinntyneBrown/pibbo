using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pibbo.Infrastructure.Persistence;

namespace Pibbo.Infrastructure.Content;

/// <summary>
/// Publishes the reviewed content file into the database as a new version. It looks at the
/// file again only when the file changes. A file that does not pass the check is not
/// published, and the version already served stays served.
/// </summary>
public sealed partial class ContentPublisher(ContentStoreOptions options, ILogger<ContentPublisher> log) : IDisposable
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private bool _schemaReady;
    private (DateTime Written, long Length)? _stamp;

    public void Dispose() => _gate.Dispose();

    public async Task SyncAsync(ContentDbContext database, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (!_schemaReady)
            {
                if (database.Database.IsRelational())
                {
                    await database.Database.MigrateAsync(cancellationToken);
                }
                else
                {
                    await database.Database.EnsureCreatedAsync(cancellationToken);
                }

                _schemaReady = true;
            }

            var file = new FileInfo(options.ContentFile);
            if (!file.Exists)
            {
                _stamp = null;
                return;
            }

            var stamp = (file.LastWriteTimeUtc, file.Length);
            if (_stamp == stamp)
            {
                return;
            }

            await PublishAsync(database, cancellationToken);
            _stamp = stamp;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task PublishAsync(ContentDbContext database, CancellationToken cancellationToken)
    {
        var loaded = await ContentFile.LoadAsync(options, cancellationToken);
        if (loaded.Content is not { } content || loaded.ETag is not { } eTag)
        {
            NotPublished(log, string.Join(' ', loaded.Problems));
            return;
        }

        var existing = await database.Versions.AsNoTracking()
            .FirstOrDefaultAsync(version => version.Version == content.Version, cancellationToken);
        if (existing is not null)
        {
            if (existing.ETag != eTag)
            {
                NotPublished(log, $"Version '{content.Version}' is already published with other content. Give the change a new version.");
            }

            return;
        }

        database.Versions.Add(new ContentVersionRow
        {
            Version = content.Version,
            ETag = eTag,
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
        await database.SaveChangesAsync(cancellationToken);
        Published(log, content.Version, content.Activities.Count, content.Lessons.Count);
    }

    [LoggerMessage(
        EventId = 10,
        Level = LogLevel.Information,
        Message = "Published content version {ContentVersion}: {Activities} activities, {Lessons} lessons")]
    private static partial void Published(ILogger logger, string contentVersion, int activities, int lessons);

    [LoggerMessage(EventId = 11, Level = LogLevel.Warning, Message = "The content file was not published: {Problems}")]
    private static partial void NotPublished(ILogger logger, string problems);
}
