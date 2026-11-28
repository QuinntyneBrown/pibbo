using FluentValidation;
using MediatR;
using Pibbo.Application.Content.Validation;
using Pibbo.Domain.Content;

namespace Pibbo.Application.Content.Queries;

/// <summary>One lesson of the content version now served.</summary>
public sealed record GetLessonQuery(string Id) : IRequest<ContentResult<Lesson>>;

public sealed class GetLessonQueryValidator : AbstractValidator<GetLessonQuery>
{
    public GetLessonQueryValidator() => RuleFor(query => query.Id).ContentId().OverridePropertyName("id");
}

public sealed class GetLessonQueryHandler(IContentStore store)
    : IRequestHandler<GetLessonQuery, ContentResult<Lesson>>
{
    public async Task<ContentResult<Lesson>> Handle(GetLessonQuery request, CancellationToken cancellationToken)
    {
        if (await store.CurrentVersionAsync(cancellationToken) is not { } version)
        {
            return ContentResult<Lesson>.Unavailable();
        }

        return await store.LessonAsync(version, request.Id, cancellationToken) is { } lesson
            ? ContentResult<Lesson>.Found(lesson, version.ETag)
            : ContentResult<Lesson>.NotFound();
    }
}
