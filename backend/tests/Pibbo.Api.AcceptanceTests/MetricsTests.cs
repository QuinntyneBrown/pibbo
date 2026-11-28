// Traces to: L2-038
using System.Net;
using Pibbo.Api.AcceptanceTests.Support;

namespace Pibbo.Api.AcceptanceTests;

/// <summary>
/// Metrics are process-wide, so these run alone: no other test's host is answering requests
/// while the counts are read.
/// </summary>
[CollectionDefinition(nameof(MetricsTests), DisableParallelization = true)]
public sealed class MetricsCollection;

[Collection(nameof(MetricsTests))]
public sealed class MetricsTests : IDisposable
{
    private readonly PibboApiFactory _factory = new();

    public void Dispose() => _factory.Dispose();

    // #3 Given the backend running, when scraped, then OpenTelemetry metrics show request
    //    rate, error rate and latency per route.
    [Fact]
    [Trait("Category", "Critical")]
    public async Task Given_the_backend_running_When_scraped_Then_requests_errors_and_latency_are_shown_per_route()
    {
        var client = _factory.CreateHttpsClient();
        await client.GetAsync("/api/v1/activities/count-the-toys");
        await client.GetAsync("/api/v1/activities/count-the-toys");
        await client.GetAsync("/api/v1/activities/no-such-activity");
        await client.GetAsync("/api/v1/content/manifest");

        var response = await client.GetAsync("/metrics");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/plain", response.Content.Headers.ContentType?.MediaType);
        var lines = (await response.Content.ReadAsStringAsync()).Split('\n');

        // Rate: a request count by route and status. Errors: the same count for 4xx and 5xx.
        Assert.Contains(lines, line => IsSeries(line, "http_server_request_duration_seconds_count", "/api/v1/activities/{id}", "200"));
        Assert.Contains(lines, line => IsSeries(line, "http_server_request_duration_seconds_count", "/api/v1/activities/{id}", "404"));
        Assert.Contains(lines, line => IsSeries(line, "http_server_request_duration_seconds_count", "/api/v1/content/manifest", "200"));

        // Latency: a histogram by route.
        Assert.Contains(lines, line => IsSeries(line, "http_server_request_duration_seconds_bucket", "/api/v1/activities/{id}", "200"));
        Assert.Contains(lines, line => IsSeries(line, "http_server_request_duration_seconds_sum", "/api/v1/activities/{id}", "200"));
    }

    [Fact]
    public async Task Given_requests_that_carry_who_asked_When_scraped_Then_the_metrics_hold_none_of_it()
    {
        var client = _factory.CreateHttpsClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/activities/count-the-toys?child=mia-rose");
        request.Headers.Add("X-Forwarded-For", "203.0.113.77");
        request.Headers.Add("User-Agent", "PibboTablet/1 serial-99ab");
        await client.SendAsync(request);
        await client.GetAsync("/somewhere/mia-aged-four");

        var metrics = await client.GetStringAsync("/metrics");

        foreach (var secret in new[] { "mia-rose", "203.0.113.77", "serial-99ab", "mia-aged-four", "127.0.0.1" })
        {
            Assert.DoesNotContain(secret, metrics);
        }
    }

    [Fact]
    public async Task Given_a_scraper_on_plain_HTTP_When_it_scrapes_Then_it_is_answered_and_not_redirected()
    {
        var response = await _factory.CreateHttpClient().GetAsync("/metrics");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private static bool IsSeries(string line, string name, string route, string status) =>
        line.StartsWith(name + "{", StringComparison.Ordinal)
        && line.Contains($"http_route=\"{route}\"", StringComparison.Ordinal)
        && line.Contains($"http_response_status_code=\"{status}\"", StringComparison.Ordinal);
}
