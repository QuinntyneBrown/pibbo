using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pibbo.Application.Content;
using Pibbo.Domain.Content;
using Pibbo.Infrastructure.Persistence;

namespace Pibbo.Infrastructure.Content;

/// <summary>Content read from the database. It reads only: publishing is the publisher's.</summary>
public sealed partial class EfContentStore(
    ContentDbContext database,
    ContentPublisher publisher,
    ILogger<EfContentStore> log) : IContentStore
{
    public async Task<PublishedVersion?> CurrentVersionAsync(CancellationToken cancellationToken)
    {
        try
        {
            await publisher.SyncAsync(database, cancellationToken);
            return await database.Versions.AsNoTracking()
                .OrderByDescending(version => version.Id)
                .Select(version => new PublishedVersion(version.Version, version.ETag))
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch (DbException exception)
        {
            // Not reachable is a state, not a fault: the caller answers 503 and readiness fails.
            Unreachable(log, exception);
            return null;
        }
    }

    public async Task<ContentSet> ContentAsync(PublishedVersion version, CancellationToken cancellationToken)
    {
        var activities = await ActivitiesOf(version).OrderBy(row => row.Position).ToListAsync(cancellationToken);
        var lessons = await LessonsOf(version).OrderBy(row => row.Position).ToListAsync(cancellationToken);
        return new ContentSet(version.Version, activities.Select(ToActivity).ToArray(), lessons.Select(ToLesson).ToArray());
    }

    public async Task<Activity?> ActivityAsync(PublishedVersion version, string id, CancellationToken cancellationToken) =>
        await ActivitiesOf(version).FirstOrDefaultAsync(row => row.ActivityId == id, cancellationToken) is { } row
            ? ToActivity(row)
            : null;

    public async Task<Lesson?> LessonAsync(PublishedVersion version, string id, CancellationToken cancellationToken) =>
        await LessonsOf(version).FirstOrDefaultAsync(row => row.LessonId == id, cancellationToken) is { } row
            ? ToLesson(row)
            : null;

    private IQueryable<ActivityRow> ActivitiesOf(PublishedVersion version) =>
        database.Activities.AsNoTracking().Where(row =>
            database.Versions.Any(stored => stored.Id == row.ContentVersionId && stored.Version == version.Version));

    private IQueryable<LessonRow> LessonsOf(PublishedVersion version) =>
        database.Lessons.AsNoTracking().Where(row =>
            database.Versions.Any(stored => stored.Id == row.ContentVersionId && stored.Version == version.Version));

    private static Activity ToActivity(ActivityRow row) =>
        new(row.ActivityId, row.Group, row.Name, row.Glyph, row.Recording, row.Pictures, row.Recordings);

    private static Lesson ToLesson(LessonRow row) => new(row.LessonId, row.Name, row.Recording, row.Activities);

    [LoggerMessage(EventId = 12, Level = LogLevel.Error, Message = "The content database cannot be reached")]
    private static partial void Unreachable(ILogger logger, Exception exception);
}
