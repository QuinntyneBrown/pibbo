using Pibbo.Domain.Content;

namespace Pibbo.Application.Content;

/// <summary>Adds content versions. A published version is never changed or removed.</summary>
public interface IContentVersions
{
    Task<PublishOutcome> PublishAsync(ContentSet content, string publishedBy, CancellationToken cancellationToken);
}

/// <summary>What publishing did. <see cref="ETag"/> is the tag the content is served with.</summary>
public sealed record PublishOutcome(bool Published, string ETag, bool SameContent);
