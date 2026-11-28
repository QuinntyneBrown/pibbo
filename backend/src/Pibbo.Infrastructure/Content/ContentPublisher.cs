using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pibbo.Application.Content;
using Pibbo.Domain.Content;
using Pibbo.Infrastructure.Persistence;

namespace Pibbo.Infrastructure.Content;

/// <summary>
/// Publishes the reviewed content file into the database as a new version. It looks at the
/// file again only when the file changes. A file that does not pass the check is not
/// published, and the version already served stays served.
/// </summary>
public sealed partial class ContentPublisher(ContentStoreOptions options, ILogger<ContentPublisher> log) : IDisposable
{
    public const string PublishedByFile = "content-file";

    private readonly SemaphoreSlim _gate = new(1, 1);
    private bool _schemaReady;
    private (DateTime Written, long Length)? _stamp;

    public void Dispose() => _gate.Dispose();

    public async Task SyncAsync(
        ContentDbContext database,
        IValidator<ContentSet> validator,
        IContentVersions versions,
        CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (!_schemaReady)
            {
                if (database.Database.IsRelational())
                {
                    await database.Database.MigrateAsync(cancellationToken);
                }
                else
                {
                    await database.Database.EnsureCreatedAsync(cancellationToken);
                }

                _schemaReady = true;
            }

            var file = new FileInfo(options.ContentFile);
            if (!file.Exists)
            {
                _stamp = null;
                return;
            }

            var stamp = (file.LastWriteTimeUtc, file.Length);
            if (_stamp == stamp)
            {
                return;
            }

            await PublishAsync(validator, versions, cancellationToken);
            _stamp = stamp;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task PublishAsync(IValidator<ContentSet> validator, IContentVersions versions, CancellationToken cancellationToken)
    {
        var loaded = await ContentFile.LoadAsync(options, cancellationToken);
        if (loaded.Content is not { } content)
        {
            NotPublished(log, loaded.Problem ?? "The content file is empty.");
            return;
        }

        var result = await validator.ValidateAsync(content, cancellationToken);
        if (!result.IsValid)
        {
            NotPublished(log, string.Join(' ', result.Errors.Select(error => $"{error.PropertyName}: {error.ErrorMessage}")));
            return;
        }

        var outcome = await versions.PublishAsync(content, PublishedByFile, cancellationToken);
        if (outcome.Published)
        {
            Published(log, content.Version, content.Activities.Count, content.Lessons.Count);
        }
        else if (!outcome.SameContent)
        {
            NotPublished(log, $"Version '{content.Version}' is already published with other content. Give the change a new version.");
        }
    }

    [LoggerMessage(
        EventId = 10,
        Level = LogLevel.Information,
        Message = "Published content version {ContentVersion}: {Activities} activities, {Lessons} lessons")]
    private static partial void Published(ILogger logger, string contentVersion, int activities, int lessons);

    [LoggerMessage(EventId = 11, Level = LogLevel.Warning, Message = "The content file was not published: {Problems}")]
    private static partial void NotPublished(ILogger logger, string problems);
}
