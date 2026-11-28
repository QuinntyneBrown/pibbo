using Pibbo.Domain.Content;

namespace Pibbo.Application.Content;

/// <summary>The read-only use cases of the content service. There are no commands: nothing is written.</summary>
public sealed class ContentQueries(IContentStore store)
{
    public ContentResult<Manifest> GetManifest()
    {
        if (store.Read() is not { } snapshot)
        {
            return ContentResult<Manifest>.Failed(ContentOutcome.Unavailable);
        }

        var content = snapshot.Content;
        var manifest = new Manifest(
            content.Version,
            content.Activities.Select(activity => new ManifestActivity(activity.Id, activity.Group, activity.Name)).ToArray(),
            content.Lessons.Select(lesson => new ManifestLesson(lesson.Id, lesson.Name)).ToArray(),
            content.Assets());
        return ContentResult<Manifest>.Found(manifest, snapshot.ETag);
    }

    public ContentResult<Activity> GetActivity(string id) =>
        Find(id, content => content.Activities.FirstOrDefault(activity => activity.Id == id));

    public ContentResult<Lesson> GetLesson(string id) =>
        Find(id, content => content.Lessons.FirstOrDefault(lesson => lesson.Id == id));

    private ContentResult<T> Find<T>(string id, Func<ContentSet, T?> find)
        where T : class
    {
        // The id is checked before the store is touched: a malformed id makes no lookup.
        if (!ContentId.IsWellFormed(id))
        {
            return ContentResult<T>.Failed(ContentOutcome.InvalidId);
        }

        if (store.Read() is not { } snapshot)
        {
            return ContentResult<T>.Failed(ContentOutcome.Unavailable);
        }

        return find(snapshot.Content) is { } found
            ? ContentResult<T>.Found(found, snapshot.ETag)
            : ContentResult<T>.Failed(ContentOutcome.NotFound);
    }
}
