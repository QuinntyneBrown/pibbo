using System.Diagnostics;

namespace Pibbo.Api.Observability;

/// <summary>
/// Writes one entry per request: method, route template, status, duration and trace id. It
/// never writes the path, the query string, a header, a cookie or an address, so nothing
/// about who asked is stored.
/// </summary>
public sealed partial class RequestLogMiddleware(RequestDelegate next, ILoggerFactory loggers)
{
    public const string Category = "Pibbo.Api.Requests";
    public const string RouteItem = "pibbo.route";
    private const string NoRoute = "(no route)";

    private static readonly string[] KnownMethods = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"];

    private readonly ILogger _log = loggers.CreateLogger(Category);

    public async Task InvokeAsync(HttpContext context)
    {
        var started = Stopwatch.GetTimestamp();
        try
        {
            await next(context);
        }
        finally
        {
            Completed(
                _log,
                MethodOf(context),
                RouteOf(context),
                context.Response.StatusCode,
                Math.Round(Stopwatch.GetElapsedTime(started).TotalMilliseconds, 3),
                TraceIds.Of(context));
        }
    }

    // A method is whatever the caller typed, so only the known ones are written.
    private static string MethodOf(HttpContext context) =>
        KnownMethods.FirstOrDefault(known => known.Equals(context.Request.Method, StringComparison.OrdinalIgnoreCase))
        ?? "OTHER";

    private static string RouteOf(HttpContext context) =>
        context.Items[RouteItem] as string
        ?? (context.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText
        ?? NoRoute;

    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Information,
        Message = "{Method} {Route} answered {Status} in {DurationMs} ms (trace {TraceId})")]
    private static partial void Completed(
        ILogger logger,
        string method,
        string route,
        int status,
        double durationMs,
        string traceId);
}
