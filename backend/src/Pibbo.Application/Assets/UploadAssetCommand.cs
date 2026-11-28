using FluentValidation;
using MediatR;
using Pibbo.Domain.Assets;

namespace Pibbo.Application.Assets;

/// <summary>
/// Stores a picture or a recording. <see cref="Content"/> holds at most one byte more than
/// <see cref="MediaType.MaxUploadBytes"/>: anything longer was not read.
/// </summary>
public sealed record UploadAssetCommand(string Path, byte[] Content) : IRequest<UploadAssetResult>;

public sealed record UploadAssetResult(string Path, bool Created);

/// <summary>The error codes the API answers with 413 and 415; any other failure is 400.</summary>
public static class UploadErrorCodes
{
    public const string TooLarge = "payload-too-large";
    public const string Unsupported = "unsupported-media-type";
}

public sealed class UploadAssetCommandValidator : AbstractValidator<UploadAssetCommand>
{
    public UploadAssetCommandValidator()
    {
        ClassLevelCascadeMode = CascadeMode.Stop;

        RuleFor(command => command.Path)
            .Must(AssetPath.IsWellFormed)
            .OverridePropertyName("path")
            .WithErrorCode("asset-path")
            .WithMessage("A path is /pictures/… or /recordings/… in lowercase letters, digits, hyphens and underscores.");

        RuleFor(command => command.Content)
            .Must(content => content.Length <= MediaType.MaxUploadBytes)
            .OverridePropertyName("file")
            .WithErrorCode(UploadErrorCodes.TooLarge)
            .WithMessage($"No file may be larger than {MediaType.MaxUploadBytes / MediaType.Megabyte} MB.");

        RuleFor(command => command)
            .Must(command => MediaType.Sniff(command.Content) is { } type
                && type.FitsPath(command.Path)
                && (type != MediaType.Svg || SvgSanitiser.Sanitise(command.Content) is not null))
            .OverridePropertyName("file")
            .WithErrorCode(UploadErrorCodes.Unsupported)
            .WithMessage("A file is MP3 or Ogg audio under /recordings, or a WebP or SVG picture under /pictures, named for what it is.");

        RuleFor(command => command)
            .Must(command => command.Content.Length <= MediaType.Sniff(command.Content)!.MaxBytes)
            .OverridePropertyName("file")
            .WithErrorCode(UploadErrorCodes.TooLarge)
            .WithMessage("A recording may be at most 1 MB and a picture at most 2 MB.");
    }
}

public sealed class UploadAssetCommandHandler(IAssetStore assets) : IRequestHandler<UploadAssetCommand, UploadAssetResult>
{
    public async Task<UploadAssetResult> Handle(UploadAssetCommand request, CancellationToken cancellationToken)
    {
        var content = MediaType.Sniff(request.Content) == MediaType.Svg
            ? SvgSanitiser.Sanitise(request.Content)!
            : request.Content;
        var created = await assets.SaveAsync(request.Path, content, cancellationToken);
        return new UploadAssetResult(request.Path, created);
    }
}
