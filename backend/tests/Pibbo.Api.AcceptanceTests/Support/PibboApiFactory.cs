using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Pibbo.Api.AcceptanceTests.Support;

/// <summary>
/// Hosts the API in memory over the fixture content. Each test class owns one, so no state
/// (the rate limit, captured logs) crosses between classes.
/// </summary>
public class PibboApiFactory : WebApplicationFactory<Program>
{
    public static readonly string FixtureContentRoot =
        Path.Combine(AppContext.BaseDirectory, "Fixtures", "content");

    private readonly Dictionary<string, string?> _settings = new()
    {
        ["Content:Root"] = FixtureContentRoot,
    };

    private Action<IServiceCollection>? _services;

    public CapturedLogs Logs { get; } = new();

    public PibboApiFactory WithSetting(string key, string? value)
    {
        _settings[key] = value;
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
            services.AddSingleton<ILoggerProvider>(Logs);
            _services?.Invoke(services);
        });
    }
}
