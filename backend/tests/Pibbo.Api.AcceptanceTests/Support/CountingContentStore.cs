using Pibbo.Application.Content;
using Pibbo.Domain.Content;

namespace Pibbo.Api.AcceptanceTests.Support;

/// <summary>Counts every call to the store, so a test can show that none was made.</summary>
public sealed class CountingContentStore(IContentStore inner, CountingContentStore.Counter counter) : IContentStore
{
    public Task<PublishedVersion?> CurrentVersionAsync(CancellationToken cancellationToken)
    {
        counter.Count();
        return inner.CurrentVersionAsync(cancellationToken);
    }

    public Task<ContentSet> ContentAsync(PublishedVersion version, CancellationToken cancellationToken)
    {
        counter.Count();
        return inner.ContentAsync(version, cancellationToken);
    }

    public Task<Activity?> ActivityAsync(PublishedVersion version, string id, CancellationToken cancellationToken)
    {
        counter.Count();
        return inner.ActivityAsync(version, id, cancellationToken);
    }

    public Task<Lesson?> LessonAsync(PublishedVersion version, string id, CancellationToken cancellationToken)
    {
        counter.Count();
        return inner.LessonAsync(version, id, cancellationToken);
    }

    public sealed class Counter
    {
        private int _lookups;

        public int Lookups => _lookups;

        public void Count() => Interlocked.Increment(ref _lookups);
    }
}
