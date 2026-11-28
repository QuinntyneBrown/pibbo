using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Pibbo.Api.Health;

public static class HealthEndpoints
{
    public static IServiceCollection AddHealth(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<ContentStoreHealthCheck>("content-store", tags: [ContentStoreHealthCheck.ReadyTag]);
        return services;
    }

    public static IEndpointRouteBuilder MapHealth(this IEndpointRouteBuilder routes)
    {
        // Live: the process answers. Ready: the content can be served.
        routes.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
        routes.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains(ContentStoreHealthCheck.ReadyTag),
        });
        return routes;
    }
}
