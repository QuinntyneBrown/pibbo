using FluentValidation;
using Pibbo.Application.Assets;
using Pibbo.Domain.Assets;
using Pibbo.Domain.Content;

namespace Pibbo.Application.Content.Validation;

/// <summary>The rules every request and content version shares. A message never repeats what was sent.</summary>
public static class ContentRules
{
    public static IRuleBuilderOptions<T, string> ContentId<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(Domain.Content.ContentId.IsWellFormed)
            .WithErrorCode("content-id")
            .WithMessage($"An id matches {Domain.Content.ContentId.Pattern}.");

    public static IRuleBuilderOptions<T, string> ContentText<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(Domain.Content.ContentText.HasAllowedLength)
            .WithErrorCode("text-length")
            .WithMessage($"Text must be 1 to {Domain.Content.ContentText.MaxLength} characters.")
            .Must(Domain.Content.ContentText.HasOnlyAllowedCharacters)
            .WithErrorCode("text-characters")
            .WithMessage($"Text holds a character that is not allowed. Only {Domain.Content.ContentText.Allowed} are allowed.");

    public static IRuleBuilderOptions<T, string> Asset<T>(
        this IRuleBuilder<T, string> rule,
        IAssetStore assets,
        Func<string, bool> inFolder) =>
        rule.Must(path => AssetPath.IsWellFormed(path) && inFolder(path))
            .WithErrorCode("asset-path")
            .WithMessage("The path is not a well-formed path in the right folder.")
            .MustAsync((path, cancellationToken) => assets.ExistsAsync(path, cancellationToken))
            .WithErrorCode("asset-missing")
            .WithMessage("The file is missing. Upload it first.");
}
