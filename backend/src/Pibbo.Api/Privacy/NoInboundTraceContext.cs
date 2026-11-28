using System.Diagnostics;

namespace Pibbo.Api.Privacy;

/// <summary>
/// Ignores a caller's <c>traceparent</c> and <c>baggage</c>: a trace id chosen by the caller
/// would be an identifier of a device written to the log. Every request starts its own trace.
/// </summary>
public sealed class NoInboundTraceContext : DistributedContextPropagator
{
    private readonly DistributedContextPropagator _outbound = CreateDefaultPropagator();

    public override IReadOnlyCollection<string> Fields => _outbound.Fields;

    public override void Inject(Activity? activity, object? carrier, PropagatorSetterCallback? setter) =>
        _outbound.Inject(activity, carrier, setter);

    public override void ExtractTraceIdAndState(
        object? carrier,
        PropagatorGetterCallback? getter,
        out string? traceId,
        out string? traceState)
    {
        traceId = null;
        traceState = null;
    }

    public override IEnumerable<KeyValuePair<string, string?>>? ExtractBaggage(
        object? carrier,
        PropagatorGetterCallback? getter) => null;
}
