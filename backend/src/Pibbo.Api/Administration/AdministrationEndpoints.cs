using System.Security.Claims;
using MediatR;
using Microsoft.OpenApi;
using Pibbo.Api.Contracts;
using Pibbo.Application.Assets;
using Pibbo.Application.Content.Commands;
using Pibbo.Domain.Assets;

namespace Pibbo.Api.Administration;

/// <summary>The only endpoints that accept writes: for staff with the content-editor role.</summary>
public static class AdministrationEndpoints
{
    public const string Document = "admin";

    public static IEndpointRouteBuilder MapAdministrationEndpoints(this IEndpointRouteBuilder routes)
    {
        var admin = routes.MapGroup(AdministrationServices.PathPrefix)
            .RequireAuthorization(AdministrationServices.ContentEditorPolicy)
            .WithGroupName(Document)
            .WithTags("Administration")
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        admin.MapPut("/assets/{folder}/{**path}", UploadAsync)
            .WithName("uploadAsset")
            .WithSummary("Stores a picture or a recording.")
            .WithDescription(
                "The body is the file. Its type is found from its content, not from Content-Type: MP3 or Ogg "
                + "audio (at most 1 MB) under /recordings, WebP or SVG pictures (at most 2 MB) under /pictures. "
                + "An SVG is stored sanitised.")
            // Described for the contract only: a Content-Type filter on the route would answer
            // before authentication, and the declared type is never trusted anyway.
            .AddOpenApiOperationTransformer((operation, _, _) =>
            {
                operation.RequestBody = new OpenApiRequestBody
                {
                    Required = true,
                    Description = "The file.",
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["application/octet-stream"] = new() { Schema = new OpenApiSchema { Type = JsonSchemaType.String, Format = "binary" } },
                    },
                };
                return Task.CompletedTask;
            })
            .Produces<AssetResponse>(StatusCodes.Status201Created)
            .Produces<AssetResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status413PayloadTooLarge)
            .ProducesProblem(StatusCodes.Status415UnsupportedMediaType);

        admin.MapPost("/content/versions", PublishAsync)
            .WithName("publishContentVersion")
            .WithSummary("Publishes a reviewed content version, served from then on.")
            .WithDescription(
                "Text is 1 to 80 characters of letters, digits, spaces and ' ’ - ? ! . , + _ ♪. Every picture and "
                + "recording named must already be uploaded. A published version is never changed: publish a new one.")
            .Produces<PublishedVersionResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);

        return routes;
    }

    private static async Task<IResult> UploadAsync(
        string folder,
        string path,
        HttpRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        // Nothing past the largest file any kind allows is read.
        var content = await ReadAtMostAsync(request.Body, MediaType.MaxUploadBytes + 1, cancellationToken);
        var asset = $"/{folder}/{path}";
        var result = await sender.Send(new UploadAssetCommand(asset, content), cancellationToken);
        var response = new AssetResponse { Path = result.Path };
        return result.Created
            ? TypedResults.Created(result.Path, response)
            : TypedResults.Ok(response);
    }

    private static async Task<IResult> PublishAsync(
        PublishContentRequest request,
        ClaimsPrincipal user,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var publishedBy = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub") ?? "content-editor";
        var result = await sender.Send(new PublishContentCommand(request.ToContentSet(), publishedBy), cancellationToken);
        if (!result.Published)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "That version is already published.",
                detail: "A published version is never changed. Publish the change as a new version.");
        }

        return TypedResults.Created(
            "/api/v1/content/manifest",
            new PublishedVersionResponse { ContentVersion = result.ContentVersion, ETag = result.ETag });
    }

    private static async Task<byte[]> ReadAtMostAsync(Stream body, int limit, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while (buffer.Length < limit && (read = await body.ReadAsync(chunk.AsMemory(0, (int)Math.Min(chunk.Length, limit - buffer.Length)), cancellationToken)) > 0)
        {
            buffer.Write(chunk, 0, read);
        }

        return buffer.ToArray();
    }
}
