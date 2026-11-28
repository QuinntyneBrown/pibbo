using FluentValidation;

namespace Pibbo.Application.Content.Queries;

public static class ContentIdRule
{
    /// <summary>The id is well formed. The message never repeats what was sent.</summary>
    public static IRuleBuilderOptions<T, string> ContentId<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(Domain.Content.ContentId.IsWellFormed)
            .OverridePropertyName("id")
            .WithErrorCode("content-id")
            .WithMessage($"An id matches {Domain.Content.ContentId.Pattern}.");
}
