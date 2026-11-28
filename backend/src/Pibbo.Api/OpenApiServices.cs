using Microsoft.OpenApi;
using Pibbo.Api.Administration;

namespace Pibbo.Api;

public static class OpenApiServices
{
    public const string Document = "v1";

    /// <summary>
    /// The published contract, at <c>/openapi/v1.json</c> and committed as <c>openapi/v1.json</c>.
    /// It names no server, so the same document is true wherever the API runs.
    /// </summary>
    public static IServiceCollection AddPibboOpenApi(this IServiceCollection services)
    {
        services.AddOpenApi(Document, openApi => openApi.AddDocumentTransformer((document, _, _) =>
        {
            document.Info = new OpenApiInfo
            {
                Title = "Pibbo content API",
                Version = Document,
                Description =
                    "Read-only, versioned content for Pibbo: activities, lessons and the manifest of "
                    + "pictures and recordings. It accepts GET and HEAD only, sets no cookie and holds "
                    + "nothing about a child. Errors are RFC 9457 problem details.",
            };
            document.Servers = [];
            return Task.CompletedTask;
        }));

        // Staff tooling has its own contract, at /openapi/admin.json; the public one, which the
        // frontend's client is generated from, never names an admin endpoint.
        services.AddOpenApi(AdministrationEndpoints.Document, openApi =>
        {
            openApi.ShouldInclude = description => description.GroupName == AdministrationEndpoints.Document;
            openApi.AddDocumentTransformer((document, _, _) =>
            {
                document.Info = new OpenApiInfo
                {
                    Title = "Pibbo content administration API",
                    Version = Document,
                    Description =
                        "For staff only, with a bearer token carrying the content-editor role. Uploads pictures and "
                        + "recordings and publishes reviewed content versions. Errors are RFC 9457 problem details.",
                };
                document.Servers = [];
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
                {
                    [BearerScheme] = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        Description = "A token with the content-editor role.",
                    },
                };
                document.Security =
                [
                    new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference(BearerScheme, document)] = [] },
                ];
                return Task.CompletedTask;
            });
        });

        return services;
    }

    private const string BearerScheme = "Bearer";
}
