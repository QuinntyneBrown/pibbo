using Serilog.Core;
using Serilog.Events;

namespace Pibbo.Api.Privacy;

/// <summary>
/// Takes off every log event what ASP.NET Core's request scope puts on it: the request path
/// (whatever a caller typed) and the request and connection ids. The request log names the
/// route template instead.
/// </summary>
public sealed class NoRequestScopeEnricher : ILogEventEnricher
{
    private static readonly string[] Removed = ["RequestPath", "RequestId", "ConnectionId", "Scope"];

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        foreach (var name in Removed)
        {
            logEvent.RemovePropertyIfPresent(name);
        }
    }
}
