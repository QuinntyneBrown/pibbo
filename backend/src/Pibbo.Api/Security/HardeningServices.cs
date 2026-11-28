using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;

namespace Pibbo.Api.Security;

public static class HardeningServices
{
    /// <summary>Health probes and the metrics scrape: never redirected, never rate-limited.</summary>
    public static bool IsProbe(PathString path) =>
        path.StartsWithSegments("/health") || path.StartsWithSegments(Observability.MetricsServices.ScrapePath);

    /// <summary>CORS for the one configured frontend origin, the rate limit and the HTTPS redirect.</summary>
    public static IServiceCollection AddHardening(this IServiceCollection services, IConfiguration configuration)
    {
        var frontendOrigin = configuration["Cors:FrontendOrigin"];
        services.AddCors(cors => cors.AddDefaultPolicy(policy =>
        {
            // With no origin configured, none is allowed: the frontend is served from the same origin.
            if (!string.IsNullOrWhiteSpace(frontendOrigin))
            {
                policy.WithOrigins(frontendOrigin.TrimEnd('/')).WithMethods("GET", "HEAD");
            }
        }));

        var requestsPerMinute = configuration.GetValue("RateLimit:RequestsPerMinute", 300);
        services.AddRateLimiter(limiter =>
        {
            limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Counted by address in memory only; the address is never written down. Idle
            // partitions are dropped by the limiter, so the count does not grow without bound.
            limiter.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                IsProbe(context.Request.Path)
                    ? RateLimitPartition.GetNoLimiter("probe")
                    : RateLimitPartition.GetFixedWindowLimiter(
                        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = requestsPerMinute,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                        }));

            limiter.OnRejected = async (rejected, _) =>
            {
                var retryAfter = rejected.Lease.TryGetMetadata(MetadataName.RetryAfter, out var wait)
                    ? wait
                    : TimeSpan.FromMinutes(1);
                var response = rejected.HttpContext.Response;
                response.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
                await rejected.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>().TryWriteAsync(
                    new ProblemDetailsContext
                    {
                        HttpContext = rejected.HttpContext,
                        ProblemDetails = new ProblemDetails
                        {
                            Type = "https://tools.ietf.org/html/rfc6585#section-4",
                            Status = StatusCodes.Status429TooManyRequests,
                            Title = "Too many requests. Try again shortly.",
                        },
                    });
            };
        });

        services.AddHttpsRedirection(redirect =>
        {
            redirect.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
            redirect.HttpsPort = configuration.GetValue("Transport:HttpsPort", 443);
        });

        return services;
    }

    /// <summary>
    /// Redirects HTTP to HTTPS unless <c>Transport:RequireHttps</c> is false. A probe or a scrape
    /// is not redirected: a redirect would read as healthy, and scrapers speak plain HTTP.
    /// </summary>
    public static IApplicationBuilder UseHttpsOnly(this WebApplication app)
    {
        if (app.Configuration.GetValue("Transport:RequireHttps", true))
        {
            app.UseWhen(
                context => !IsProbe(context.Request.Path),
                branch => branch.UseHttpsRedirection());
        }

        return app;
    }
}
