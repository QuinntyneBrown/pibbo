using Microsoft.Extensions.Diagnostics.HealthChecks;
using Pibbo.Application.Content;

namespace Pibbo.Api.Health;

/// <summary>Ready only while the content store can be reached and holds a version that passed the check.</summary>
public sealed class ContentStoreHealthCheck(IContentStore store) : IHealthCheck
{
    public const string ReadyTag = "ready";

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default) =>
        await store.CurrentVersionAsync(cancellationToken) is null
            ? HealthCheckResult.Unhealthy("The content store cannot be reached or holds no published version.")
            : HealthCheckResult.Healthy();
}
