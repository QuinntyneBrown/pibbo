using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Pibbo.Application.Assets;

namespace Pibbo.Api.Observability;

/// <summary>
/// A request that fails its validator is answered with problem details naming each field and
/// why: 413 for a file too large, 415 for a kind of file not accepted, otherwise 400. It is the caller's mistake, so it is not logged as a fault, and the answer never
/// repeats what was sent.
/// </summary>
public sealed class ValidationExceptionHandler(IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not ValidationException invalid)
        {
            return false;
        }

        var errors = invalid.Errors
            .GroupBy(failure => failure.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(failure => failure.ErrorMessage).ToArray());

        var codes = invalid.Errors.Select(failure => failure.ErrorCode).ToHashSet();
        var (status, title) = codes.Contains(UploadErrorCodes.TooLarge)
            ? (StatusCodes.Status413PayloadTooLarge, "The file is too large.")
            : codes.Contains(UploadErrorCodes.Unsupported)
                ? (StatusCodes.Status415UnsupportedMediaType, "That kind of file is not accepted.")
                : (StatusCodes.Status400BadRequest, "The request is not valid.");

        context.Response.StatusCode = status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ValidationProblemDetails(errors) { Status = status, Title = title },
        });
    }
}
