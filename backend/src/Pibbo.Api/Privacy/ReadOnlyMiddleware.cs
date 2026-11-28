using Microsoft.AspNetCore.Mvc;
using Pibbo.Api.Administration;

namespace Pibbo.Api.Privacy;

/// <summary>
/// The public service is read-only: anything but GET and HEAD is answered 405 before it
/// reaches an endpoint, so nothing a child did can be sent here. OPTIONS passes, for a CORS
/// preflight. Only the administration endpoints, behind a staff token, accept writes.
/// </summary>
public sealed class ReadOnlyMiddleware(RequestDelegate next, IProblemDetailsService problems)
{
    public const string Allowed = "GET, HEAD";

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method)
            || AdministrationServices.IsAdministration(context.Request.Path))
        {
            await next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
        context.Response.Headers.Allow = Allowed;
        await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status405MethodNotAllowed,
                Title = "The content service is read-only.",
            },
        });
    }
}
