using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;

namespace Pibbo.Api.Security;

public static class HardeningServices
{
    public const string HealthPath = "/health";

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
                context.Request.Path.StartsWithSegments(HealthPath)
                    ? RateLimitPartition.GetNoLimiter("health")
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
    /// Redirects HTTP to HTTPS unless <c>Transport:RequireHttps</c> is false. A health probe is
    /// not redirected: a redirect would read as healthy.
    /// </summary>
    public static IApplicationBuilder UseHttpsOnly(this WebApplication app)
    {
        if (app.Configuration.GetValue("Transport:RequireHttps", true))
        {
            app.UseWhen(
                context => !context.Request.Path.StartsWithSegments(HealthPath),
                branch => branch.UseHttpsRedirection());
        }

        return app;
    }
}
