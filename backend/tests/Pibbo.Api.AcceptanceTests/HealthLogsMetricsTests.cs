// Traces to: L2-038
using System.Collections.Concurrent;
using System.Diagnostics.Metrics;
using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;
using Microsoft.Extensions.Options;
using Pibbo.Api.AcceptanceTests.Support;
using Pibbo.Application.Content;
using Pibbo.Domain.Content;

namespace Pibbo.Api.AcceptanceTests;

public sealed class HealthLogsMetricsTests : IDisposable
{
    private readonly PibboApiFactory _factory = new();
    private readonly string _emptyRoot = Path.Combine(Path.GetTempPath(), $"pibbo-content-{Guid.NewGuid():N}");

    public void Dispose()
    {
        _factory.Dispose();
        if (Directory.Exists(_emptyRoot))
        {
            Directory.Delete(_emptyRoot, recursive: true);
        }
    }

    // #1 Given the backend, when /health/live and /health/ready are called, then live returns
    //    200 while the process runs and ready returns 503 until the content store is reachable.
    [Fact]
    public async Task Given_the_content_store_is_reachable_When_health_is_asked_Then_live_and_ready_are_200()
    {
        var client = _factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
    }

    [Fact]
    public async Task Given_the_content_store_is_not_reachable_When_health_is_asked_Then_live_is_200_and_ready_is_503_until_it_is()
    {
        Directory.CreateDirectory(_emptyRoot);
        _factory.WithSetting("Content:Root", _emptyRoot);
        var client = _factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/ready")).StatusCode);
        await ProblemAssert.IsProblemAsync(
            await client.GetAsync("/api/v1/content/manifest"),
            HttpStatusCode.ServiceUnavailable);

        CopyDirectory(PibboApiFactory.FixtureContentRoot, _emptyRoot);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/content/manifest")).StatusCode);
    }

    [Fact]
    public async Task Given_content_that_does_not_pass_the_check_When_ready_is_asked_Then_503_and_it_is_not_served()
    {
        CopyDirectory(PibboApiFactory.FixtureContentRoot, _emptyRoot);
        File.Delete(Path.Combine(_emptyRoot, "assets", "recordings", "home", "first-sounds.wav"));
        _factory.WithSetting("Content:Root", _emptyRoot);
        var client = _factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/ready")).StatusCode);
        Assert.Equal(
            HttpStatusCode.ServiceUnavailable,
            (await client.GetAsync("/api/v1/lessons/first-sounds")).StatusCode);
    }

    // #2 Given any request, when logged, then the entry is structured JSON with timestamp,
    //    route template, status, duration and trace id.
    [Fact]
    public async Task Given_a_request_When_logged_Then_the_entry_has_route_template_status_duration_and_trace_id()
    {
        await _factory.CreateHttpsClient().GetAsync("/api/v1/activities/count-the-toys");

        var entry = Assert.Single(_factory.Logs.Requests);
        Assert.Equal("GET", entry.State["Method"]);
        Assert.Equal("/api/v1/activities/{id}", entry.State["Route"]);
        Assert.Equal(200, entry.State["Status"]);
        Assert.True(Convert.ToDouble(entry.State["DurationMs"]) >= 0);
        Assert.Matches("^[0-9a-f]{32}$", Assert.IsType<string>(entry.State["TraceId"]));
    }

    [Theory]
    [InlineData("/recordings/home/count-the-toys.wav", "/recordings/{asset}", 200)]
    [InlineData("/somewhere/else", "(no route)", 404)]
    [InlineData("/health/ready", "/health/ready", 200)]
    public async Task Given_a_request_outside_the_API_When_logged_Then_the_route_is_a_template_never_the_path(
        string path,
        string route,
        int status)
    {
        await _factory.CreateHttpsClient().GetAsync(path);

        var entry = Assert.Single(_factory.Logs.Requests);
        Assert.Equal(route, entry.State["Route"]);
        Assert.Equal(status, entry.State["Status"]);
    }

    [Fact]
    public void Given_the_backend_When_it_writes_its_log_Then_each_entry_is_JSON_with_a_UTC_timestamp()
    {
        var console = _factory.Services.GetRequiredService<IOptions<ConsoleLoggerOptions>>().Value;
        var json = _factory.Services.GetRequiredService<IOptions<JsonConsoleFormatterOptions>>().Value;

        Assert.Equal(ConsoleFormatterNames.Json, console.FormatterName);
        Assert.False(string.IsNullOrEmpty(json.TimestampFormat));
        Assert.True(json.UseUtcTimestamp);
    }

    // #3 Given the backend running, when scraped, then OpenTelemetry metrics show request
    //    rate, error rate and latency per route.
    [Fact]
    public async Task Given_requests_When_metrics_are_read_Then_each_has_a_duration_by_route_and_status()
    {
        var measured = new ConcurrentBag<(string? Route, int? Status, double Seconds)>();
        using var listener = new MeterListener();
        listener.InstrumentPublished = (instrument, meters) =>
        {
            if (instrument.Meter.Name == "Microsoft.AspNetCore.Hosting" && instrument.Name == "http.server.request.duration")
            {
                meters.EnableMeasurementEvents(instrument);
            }
        };
        listener.SetMeasurementEventCallback<double>((_, seconds, tags, _) =>
        {
            string? route = null;
            int? status = null;
            foreach (var tag in tags)
            {
                if (tag.Key == "http.route")
                {
                    route = tag.Value as string;
                }
                else if (tag.Key == "http.response.status_code")
                {
                    status = tag.Value as int?;
                }
            }

            measured.Add((route, status, seconds));
        });
        listener.Start();
        var client = _factory.CreateHttpsClient();

        await client.GetAsync("/api/v1/activities/count-the-toys");
        await client.GetAsync("/api/v1/activities/no-such-activity");

        Assert.Contains(measured, m => m is { Route: "/api/v1/activities/{id}", Status: 200, Seconds: >= 0 });
        Assert.Contains(measured, m => m is { Route: "/api/v1/activities/{id}", Status: 404 });
    }

    // #4 Given an unhandled exception, when it occurs, then the response is 500 problem details
    //    with no stack trace, and the exception is logged with its trace id.
    [Fact]
    public async Task Given_an_unhandled_exception_When_it_occurs_Then_500_problem_details_without_a_stack_trace()
    {
        _factory.WithServices(services => services.AddSingleton<IContentStore, BrokenContentStore>());

        var response = await _factory.CreateHttpsClient().GetAsync("/api/v1/activities/count-the-toys");

        var problem = await ProblemAssert.IsProblemAsync(response, HttpStatusCode.InternalServerError);
        var body = problem.GetRawText();
        Assert.DoesNotContain("the shelf fell over", body);
        Assert.DoesNotContain(nameof(BrokenContentStore), body);
        Assert.DoesNotContain("   at ", body);
        var traceId = problem.GetProperty("traceId").GetString();
        Assert.Matches("^[0-9a-f]{32}$", traceId);

        var logged = Assert.Single(_factory.Logs.Entries, entry => entry.Exception is not null);
        Assert.Equal(LogLevel.Error, logged.Level);
        Assert.IsType<InvalidOperationException>(logged.Exception);
        Assert.Equal(traceId, logged.State["TraceId"]);
        Assert.Equal(500, Assert.Single(_factory.Logs.Requests).State["Status"]);
    }

    private static void CopyDirectory(string from, string to)
    {
        foreach (var file in Directory.EnumerateFiles(from, "*", SearchOption.AllDirectories))
        {
            var target = Path.Combine(to, Path.GetRelativePath(from, file));
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, overwrite: true);
        }
    }

    private sealed class BrokenContentStore : IContentStore
    {
        public string? Problem => null;

        public ContentSnapshot? Read() => throw new InvalidOperationException("the shelf fell over");
    }
}
