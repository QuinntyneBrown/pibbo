using FluentValidation;
using MediatR;
using Pibbo.Application.Content.Validation;
using Pibbo.Domain.Content;

namespace Pibbo.Application.Content.Commands;

/// <summary>Publishes a reviewed content version, which is served from then on.</summary>
public sealed record PublishContentCommand(ContentSet Content, string PublishedBy) : IRequest<PublishContentResult>;

public sealed record PublishContentResult(bool Published, string ContentVersion, string ETag);

public sealed class PublishContentCommandValidator : AbstractValidator<PublishContentCommand>
{
    public PublishContentCommandValidator(ContentSetValidator content) =>
        RuleFor(command => command.Content).CustomAsync(async (set, context, cancellationToken) =>
        {
            // The content's own field names, not "Content.…": the request is the content.
            foreach (var failure in (await content.ValidateAsync(set, cancellationToken)).Errors)
            {
                context.AddFailure(failure);
            }
        });
}

public sealed class PublishContentCommandHandler(IContentStore store, IContentVersions versions)
    : IRequestHandler<PublishContentCommand, PublishContentResult>
{
    public async Task<PublishContentResult> Handle(PublishContentCommand request, CancellationToken cancellationToken)
    {
        // The store is brought up to date first, so the reviewed file never lands after, and
        // over, a version an editor publishes now.
        await store.CurrentVersionAsync(cancellationToken);
        var outcome = await versions.PublishAsync(request.Content, request.PublishedBy, cancellationToken);
        return new PublishContentResult(outcome.Published, request.Content.Version, outcome.ETag);
    }
}
