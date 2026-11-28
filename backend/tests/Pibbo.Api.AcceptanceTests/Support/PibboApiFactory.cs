using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Pibbo.Infrastructure.Persistence;
using Serilog.Core;

namespace Pibbo.Api.AcceptanceTests.Support;

/// <summary>
/// Hosts the API in memory over the fixture content, with a database of its own: EF Core
/// InMemory, or a SQLite file when asked. Each test owns one, so no state (the database, the
/// rate limit, captured logs) crosses between tests.
/// </summary>
public class PibboApiFactory : WebApplicationFactory<Program>
{
    public static readonly string FixtureContentRoot =
        Path.Combine(AppContext.BaseDirectory, "Fixtures", "content");

    private readonly Dictionary<string, string?> _settings = new(
        AdminTokens.Settings().Select(setting => new KeyValuePair<string, string?>(setting.Key, setting.Value)))
    {
        ["Content:Root"] = FixtureContentRoot,
    };

    private readonly string _databaseName = $"pibbo-content-{Guid.NewGuid():N}";
    private Action<IServiceCollection>? _services;
    private string? _sqliteFile;

    public CapturedLogs Logs { get; } = new();

    public PibboApiFactory WithSetting(string key, string? value)
    {
        _settings[key] = value;
        return this;
    }

    /// <summary>Use a real SQLite file, created by the migrations, in place of EF Core InMemory.</summary>
    public PibboApiFactory WithSqlite()
    {
        _sqliteFile = Path.Combine(Path.GetTempPath(), $"{_databaseName}.db");
        return this;
    }

    public PibboApiFactory WithServices(Action<IServiceCollection> services)
    {
        _services += services;
        return this;
    }

    /// <summary>A client that speaks HTTPS and follows nothing, as a browser's fetch would be seen.</summary>
    public HttpClient CreateHttpsClient() =>
        CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
            HandleCookies = false,
        });

    /// <summary>An HTTPS client that sends the given bearer token.</summary>
    public HttpClient CreateAdminClient(string? token)
    {
        var client = CreateHttpsClient();
        if (token is not null)
        {
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        return client;
    }

    public HttpClient CreateHttpClient() =>
        CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("http://localhost"),
            AllowAutoRedirect = false,
            HandleCookies = false,
        });

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        foreach (var (key, value) in _settings)
        {
            builder.UseSetting(key, value);
        }

        builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<ILogEventSink>(Logs);
            services.RemoveAll<DbContextOptions<ContentDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ContentDbContext>>();
            services.AddDbContext<ContentDbContext>(database =>
            {
                if (_sqliteFile is null)
                {
                    database.UseInMemoryDatabase(_databaseName);
                }
                else
                {
                    database.UseSqlite($"Data Source={_sqliteFile};Pooling=False");
                }
            });
            _services?.Invoke(services);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && _sqliteFile is not null && File.Exists(_sqliteFile))
        {
            File.Delete(_sqliteFile);
        }
    }
}
