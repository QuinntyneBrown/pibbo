namespace Pibbo.Api.Privacy;

/// <summary>No response sets a cookie, whatever an endpoint or a library tried to add.</summary>
public sealed class NoCookieMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(
            static state =>
            {
                ((HttpResponse)state).Headers.Remove("Set-Cookie");
                return Task.CompletedTask;
            },
            context.Response);
        return next(context);
    }
}
