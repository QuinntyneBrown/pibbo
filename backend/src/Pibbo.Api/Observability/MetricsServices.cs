using OpenTelemetry.Metrics;

namespace Pibbo.Api.Observability;

public static class MetricsServices
{
    public const string ScrapePath = "/metrics";

    /// <summary>
    /// OpenTelemetry metrics in the Prometheus text format at <c>/metrics</c>. ASP.NET Core's
    /// <c>http.server.request.duration</c> histogram gives the request rate, the error rate and
    /// the latency per route. Its labels are the method, route template, status, scheme and
    /// protocol: nothing about who asked.
    /// </summary>
    public static IServiceCollection AddPibboMetrics(this IServiceCollection services)
    {
        services.AddOpenTelemetry().WithMetrics(metrics => metrics
            .AddMeter("Microsoft.AspNetCore.Hosting", "Microsoft.AspNetCore.Server.Kestrel")
            .AddPrometheusExporter());
        return services;
    }

    public static IEndpointRouteBuilder MapPibboMetrics(this IEndpointRouteBuilder routes)
    {
        routes.MapPrometheusScrapingEndpoint(ScrapePath).ExcludeFromDescription();
        return routes;
    }
}
