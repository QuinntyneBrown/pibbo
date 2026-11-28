using Pibbo.Domain.Content;

namespace Pibbo.Application.Content;

/// <summary>Where the content is kept. It holds content only: nothing about a child or a device.</summary>
public interface IContentStore
{
    /// <summary>The version now served, or null while the store cannot be reached or holds
    /// no version that passed the check.</summary>
    Task<PublishedVersion?> CurrentVersionAsync(CancellationToken cancellationToken);

    Task<ContentSet> ContentAsync(PublishedVersion version, CancellationToken cancellationToken);

    Task<Activity?> ActivityAsync(PublishedVersion version, string id, CancellationToken cancellationToken);

    Task<Lesson?> LessonAsync(PublishedVersion version, string id, CancellationToken cancellationToken);
}
