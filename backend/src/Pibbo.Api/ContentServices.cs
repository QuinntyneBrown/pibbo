using Microsoft.Extensions.FileProviders;
using Pibbo.Api.Observability;
using Pibbo.Application;
using Pibbo.Infrastructure;
using Pibbo.Infrastructure.Content;

namespace Pibbo.Api;

public static class ContentServices
{
    public const string ConnectionStringName = "Content";

    public static IServiceCollection AddContent(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var options = configuration.GetSection(ContentStoreOptions.Section).Get<ContentStoreOptions>()
            ?? new ContentStoreOptions();

        // A relative path is relative to the application, not to wherever it was started from.
        options.Root = Path.GetFullPath(options.Root, environment.ContentRootPath);
        options.AssetsRoot = Path.GetFullPath(
            options.AssetsRoot ?? Path.Combine(options.Root, "assets"),
            environment.ContentRootPath);

        services.AddApplication();
        services.AddInfrastructure(options, ConnectionString(configuration, environment));
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

    /// <summary>The configured connection string, or a SQLite file in the application's data folder.</summary>
    private static string ConnectionString(IConfiguration configuration, IHostEnvironment environment)
    {
        if (configuration.GetConnectionString(ConnectionStringName) is { Length: > 0 } configured)
        {
            return configured;
        }

        var folder = Path.Combine(environment.ContentRootPath, "data");
        Directory.CreateDirectory(folder);
        return $"Data Source={Path.Combine(folder, "pibbo-content.db")}";
    }
}
