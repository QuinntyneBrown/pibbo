namespace Pibbo.Api.Security;

/// <summary>
/// The hardening headers, on every response. They match the ones the frontend's host sends,
/// narrowed for a service that returns data and files and no page.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public const string ContentSecurityPolicy =
        "default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'";

    public const string StrictTransportSecurity = "max-age=31536000; includeSubDomains";

    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(
            static state =>
            {
                var headers = ((HttpResponse)state).Headers;
                headers.ContentSecurityPolicy = ContentSecurityPolicy;
                headers.XContentTypeOptions = "nosniff";
                headers["Referrer-Policy"] = "no-referrer";
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
                headers["Cross-Origin-Opener-Policy"] = "same-origin";
                headers.StrictTransportSecurity = StrictTransportSecurity;
                return Task.CompletedTask;
            },
            context.Response);
        return next(context);
    }
}
