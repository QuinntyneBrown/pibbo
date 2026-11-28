using Microsoft.Extensions.Diagnostics.HealthChecks;
using Pibbo.Application.Content;

namespace Pibbo.Api.Health;

/// <summary>Ready only while the content store can be reached and its content passes the check.</summary>
public sealed class ContentStoreHealthCheck(IContentStore store) : IHealthCheck
{
    public const string ReadyTag = "ready";

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(store.Read() is null
            ? HealthCheckResult.Unhealthy(store.Problem ?? "The content store cannot be reached.")
            : HealthCheckResult.Healthy());
}
