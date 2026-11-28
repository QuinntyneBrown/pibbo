using System.Diagnostics;

namespace Pibbo.Api.Observability;

public static class TraceIds
{
    /// <summary>The id that ties a response to its log entries. It is made here, never taken from the caller.</summary>
    public static string Of(HttpContext context) =>
        Activity.Current?.TraceId.ToHexString() ?? context.TraceIdentifier;
}
