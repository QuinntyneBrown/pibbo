using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Pibbo.Application.Assets;
using Pibbo.Application.Content;
using Pibbo.Infrastructure.Assets;
using Pibbo.Infrastructure.Content;
using Pibbo.Infrastructure.Persistence;

namespace Pibbo.Infrastructure;

public static class InfrastructureServices
{
    /// <summary>The content database (SQLite), the store that reads it and the publisher that fills it.</summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        ContentStoreOptions content,
        string connectionString)
    {
        services.AddSingleton(content);
        services.AddDbContext<ContentDbContext>(database => database.UseSqlite(connectionString));
        services.AddSingleton<ContentPublisher>();
        services.AddScoped<EfContentStore>();
        services.AddScoped<IContentStore>(provider => provider.GetRequiredService<EfContentStore>());
        services.AddScoped<IContentVersions, ContentVersionWriter>();
        services.AddSingleton<IAssetStore, FileAssetStore>();
        return services;
    }
}
