using FluentValidation;
using MediatR;
using Pibbo.Domain.Content;

namespace Pibbo.Application.Content.Queries;

/// <summary>One activity of the content version now served.</summary>
public sealed record GetActivityQuery(string Id) : IRequest<ContentResult<Activity>>;

public sealed class GetActivityQueryValidator : AbstractValidator<GetActivityQuery>
{
    public GetActivityQueryValidator() => RuleFor(query => query.Id).ContentId();
}

public sealed class GetActivityQueryHandler(IContentStore store)
    : IRequestHandler<GetActivityQuery, ContentResult<Activity>>
{
    public async Task<ContentResult<Activity>> Handle(GetActivityQuery request, CancellationToken cancellationToken)
    {
        if (await store.CurrentVersionAsync(cancellationToken) is not { } version)
        {
            return ContentResult<Activity>.Unavailable();
        }

        return await store.ActivityAsync(version, request.Id, cancellationToken) is { } activity
            ? ContentResult<Activity>.Found(activity, version.ETag)
            : ContentResult<Activity>.NotFound();
    }
}
