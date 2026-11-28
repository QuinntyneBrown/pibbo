using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using Serilog.Core;
using Serilog.Events;
using Serilog.Formatting;

namespace Pibbo.Api.AcceptanceTests.Support;

public sealed record CapturedLog(
    string Category,
    LogLevel Level,
    string Message,
    IReadOnlyDictionary<string, object?> State,
    Exception? Exception,
    LogEvent Event)
{
    /// <summary>Everything the entry would write: its message and every value attached to it.</summary>
    public string Everything =>
        string.Join(' ', Event.Properties.Select(pair => $"{pair.Key}={pair.Value}").Prepend(Message));

    /// <summary>The line as the service writes it.</summary>
    public string Written(ITextFormatter formatter)
    {
        using var line = new StringWriter();
        formatter.Format(Event, line);
        return line.ToString();
    }
}

/// <summary>A Serilog sink that keeps every event the API writes, so a test can read what was stored.</summary>
public sealed class CapturedLogs : ILogEventSink
{
    private readonly ConcurrentQueue<CapturedLog> _entries = new();

    public IReadOnlyCollection<CapturedLog> Entries => _entries;

    public IEnumerable<CapturedLog> Requests =>
        _entries.Where(entry => entry.Category == "Pibbo.Api.Requests");

    public void Emit(LogEvent logEvent)
    {
        var category = logEvent.Properties.TryGetValue("SourceContext", out var source) && source is ScalarValue { Value: string name }
            ? name
            : string.Empty;
        var state = logEvent.Properties.ToDictionary(
            pair => pair.Key,
            pair => pair.Value is ScalarValue scalar ? scalar.Value : pair.Value);
        var level = logEvent.Level switch
        {
            LogEventLevel.Verbose => LogLevel.Trace,
            LogEventLevel.Debug => LogLevel.Debug,
            LogEventLevel.Information => LogLevel.Information,
            LogEventLevel.Warning => LogLevel.Warning,
            LogEventLevel.Error => LogLevel.Error,
            _ => LogLevel.Critical,
        };
        _entries.Enqueue(new CapturedLog(category, level, logEvent.RenderMessage(), state, logEvent.Exception, logEvent));
    }
}
