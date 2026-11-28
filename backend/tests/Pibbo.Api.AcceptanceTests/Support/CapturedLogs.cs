using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Pibbo.Api.AcceptanceTests.Support;

public sealed record CapturedLog(
    string Category,
    LogLevel Level,
    string Message,
    IReadOnlyDictionary<string, object?> State,
    Exception? Exception)
{
    /// <summary>Everything the entry would write: its message and every structured value.</summary>
    public string Everything =>
        string.Join(' ', State.Select(pair => $"{pair.Key}={pair.Value}").Prepend(Message));
}

/// <summary>Keeps every log entry the API writes, so a test can read what was stored.</summary>
public sealed class CapturedLogs : ILoggerProvider
{
    private readonly ConcurrentQueue<CapturedLog> _entries = new();

    public IReadOnlyCollection<CapturedLog> Entries => _entries;

    public IEnumerable<CapturedLog> Requests =>
        _entries.Where(entry => entry.Category == "Pibbo.Api.Requests");

    public ILogger CreateLogger(string categoryName) => new Logger(categoryName, _entries);

    public void Dispose()
    {
    }

    private sealed class Logger(string category, ConcurrentQueue<CapturedLog> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            var values = state is IEnumerable<KeyValuePair<string, object?>> pairs
                ? pairs.ToDictionary(pair => pair.Key, pair => pair.Value)
                : [];
            entries.Enqueue(new CapturedLog(category, logLevel, formatter(state, exception), values, exception));
        }
    }
}
