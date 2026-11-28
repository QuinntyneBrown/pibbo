using Microsoft.Extensions.FileProviders;
using Pibbo.Api.Observability;
using Pibbo.Application.Content;
using Pibbo.Infrastructure.Content;

namespace Pibbo.Api;

public static class ContentServices
{
    public static IServiceCollection AddContent(this IServiceCollection services, IConfiguration configuration)
    {
        var options = configuration.GetSection(ContentStoreOptions.Section).Get<ContentStoreOptions>()
            ?? new ContentStoreOptions();
        services.AddSingleton(options);
        services.AddSingleton<JsonFileContentStore>();
        services.AddSingleton<IContentStore>(provider => provider.GetRequiredService<JsonFileContentStore>());
        services.AddSingleton<ContentQueries>();
        return services;
    }

    /// <summary>Serves pictures and recordings, and nothing else, from the assets directory.</summary>
    public static IApplicationBuilder UseContentAssets(this WebApplication app)
    {
        var options = app.Services.GetRequiredService<ContentStoreOptions>();
        foreach (var folder in new[] { "pictures", "recordings" })
        {
            var directory = Path.Combine(options.AssetsDirectory, folder);
            if (Directory.Exists(directory))
            {
                app.UseStaticFiles(new StaticFileOptions
                {
                    RequestPath = $"/{folder}",
                    FileProvider = new PhysicalFileProvider(directory),

                    // The log names the kind of file asked for, never the path.
                    OnPrepareResponse = served =>
                        served.Context.Items[RequestLogMiddleware.RouteItem] = $"/{folder}/{{asset}}",
                });
            }
        }

        return app;
    }
}
