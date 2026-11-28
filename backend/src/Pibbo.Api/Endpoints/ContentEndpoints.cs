using MediatR;
using Microsoft.Net.Http.Headers;
using Pibbo.Api.Contracts;
using Pibbo.Application.Content;
using Pibbo.Application.Content.Queries;

namespace Pibbo.Api.Endpoints;

/// <summary>The read-only content API, version 1.</summary>
public static class ContentEndpoints
{
    public static IEndpointRouteBuilder MapContentEndpoints(this IEndpointRouteBuilder routes)
    {
        var v1 = routes.MapGroup("/api/v1").WithTags("Content");

        v1.MapGet("/content/manifest", async (HttpContext http, ISender sender, CancellationToken cancellation) =>
                Respond(http, await sender.Send(new GetManifestQuery(), cancellation), ManifestResponse.From, "The manifest"))
            .WithName("getManifest")
            .WithSummary("The index of the content version now served.")
            .WithDescription("Carries an ETag. Send it back as If-None-Match to get 304 while nothing has changed.")
            .Produces<ManifestResponse>()
            .Produces(StatusCodes.Status304NotModified)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable);

        v1.MapGet("/activities/{id}", async (string id, HttpContext http, ISender sender, CancellationToken cancellation) =>
                Respond(http, await sender.Send(new GetActivityQuery(id), cancellation), ActivityResponse.From, "The activity"))
            .WithName("getActivity")
            .WithSummary("One activity.")
            .Produces<ActivityResponse>()
            .Produces(StatusCodes.Status304NotModified)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable);

        v1.MapGet("/lessons/{id}", async (string id, HttpContext http, ISender sender, CancellationToken cancellation) =>
                Respond(http, await sender.Send(new GetLessonQuery(id), cancellation), LessonResponse.From, "The lesson"))
            .WithName("getLesson")
            .WithSummary("One lesson.")
            .Produces<LessonResponse>()
            .Produces(StatusCodes.Status304NotModified)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable);

        return routes;
    }

    private static IResult Respond<TValue, TResponse>(
        HttpContext http,
        ContentResult<TValue> result,
        Func<TValue, TResponse> toResponse,
        string what)
        where TValue : class
    {
        switch (result.Outcome)
        {
            case ContentOutcome.NotFound:
                return TypedResults.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: $"{what} was not found.");
            case ContentOutcome.Unavailable:
                return TypedResults.Problem(
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    title: "The content cannot be read just now.");
        }

        // Content changes only when a version is published, so the browser may keep what it has
        // and ask whether it is still current.
        var eTag = new EntityTagHeaderValue(result.ETag!);
        var headers = http.Response.GetTypedHeaders();
        headers.ETag = eTag;
        headers.CacheControl = new CacheControlHeaderValue { NoCache = true };

        var matches = http.Request.GetTypedHeaders().IfNoneMatch
            .Any(candidate => candidate.Equals(EntityTagHeaderValue.Any) || candidate.Compare(eTag, useStrongComparison: false));
        return matches
            ? TypedResults.StatusCode(StatusCodes.Status304NotModified)
            : TypedResults.Ok(toResponse(result.Value!));
    }
}
