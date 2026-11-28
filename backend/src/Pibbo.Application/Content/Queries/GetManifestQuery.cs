using MediatR;

namespace Pibbo.Application.Content.Queries;

/// <summary>The index of the content version now served.</summary>
public sealed record GetManifestQuery : IRequest<ContentResult<Manifest>>;

public sealed class GetManifestQueryHandler(IContentStore store)
    : IRequestHandler<GetManifestQuery, ContentResult<Manifest>>
{
    public async Task<ContentResult<Manifest>> Handle(GetManifestQuery request, CancellationToken cancellationToken)
    {
        if (await store.CurrentVersionAsync(cancellationToken) is not { } version)
        {
            return ContentResult<Manifest>.Unavailable();
        }

        var content = await store.ContentAsync(version, cancellationToken);
        var manifest = new Manifest(
            content.Version,
            content.Activities.Select(activity => new ManifestActivity(activity.Id, activity.Group, activity.Name)).ToArray(),
            content.Lessons.Select(lesson => new ManifestLesson(lesson.Id, lesson.Name)).ToArray(),
            content.Assets());
        return ContentResult<Manifest>.Found(manifest, version.ETag);
    }
}
