using Microsoft.OpenApi;

namespace Pibbo.Api;

public static class OpenApiServices
{
    public const string Document = "v1";

    /// <summary>
    /// The published contract, at <c>/openapi/v1.json</c> and committed as <c>openapi/v1.json</c>.
    /// It names no server, so the same document is true wherever the API runs.
    /// </summary>
    public static IServiceCollection AddPibboOpenApi(this IServiceCollection services) =>
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
}
