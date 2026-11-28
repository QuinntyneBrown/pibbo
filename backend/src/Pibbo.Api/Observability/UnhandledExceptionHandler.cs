using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Pibbo.Api.Observability;

/// <summary>
/// An unhandled exception is logged with its trace id and answered with 500 problem details
/// that say nothing of what went wrong inside.
/// </summary>
public sealed partial class UnhandledExceptionHandler(
    ILogger<UnhandledExceptionHandler> log,
    IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        Unhandled(log, exception, TraceIds.Of(context));

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Something went wrong.",
            },
        });
    }

    [LoggerMessage(EventId = 2, Level = LogLevel.Error, Message = "Unhandled exception (trace {TraceId})")]
    private static partial void Unhandled(ILogger logger, Exception exception, string traceId);
}
