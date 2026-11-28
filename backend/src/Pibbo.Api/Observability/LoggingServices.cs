using Pibbo.Api.Privacy;
using Serilog;
using Serilog.Formatting;
using Serilog.Formatting.Compact;

namespace Pibbo.Api.Observability;

public static class LoggingServices
{
    /// <summary>
    /// Serilog, writing one line of JSON per event to the console: timestamp, level, message,
    /// trace id and the event's own values. Levels come from the <c>Serilog</c> section.
    /// What ASP.NET Core's request scope adds (the path, the request id) is taken off again:
    /// a path is whatever a caller typed.
    /// </summary>
    public static IServiceCollection AddPibboLogging(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ITextFormatter>(new RenderedCompactJsonFormatter());
        services.AddSerilog(
            (provider, logger) => logger
                .ReadFrom.Configuration(configuration)
                .ReadFrom.Services(provider)
                .Enrich.With<NoRequestScopeEnricher>()
                .WriteTo.Console(provider.GetRequiredService<ITextFormatter>()),
            preserveStaticLogger: true);
        return services;
    }
}
