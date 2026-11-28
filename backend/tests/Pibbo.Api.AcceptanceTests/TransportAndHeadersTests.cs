// Traces to: L2-030
using System.Net;
using Pibbo.Api.AcceptanceTests.Support;

namespace Pibbo.Api.AcceptanceTests;

public sealed class TransportAndHeadersTests : IDisposable
{
    private const string FrontendOrigin = "https://pibbo.example";

    private readonly PibboApiFactory _factory = new PibboApiFactory().WithSetting("Cors:FrontendOrigin", FrontendOrigin);

    public void Dispose() => _factory.Dispose();

    // #1 Given an HTTP request, when received, then it is redirected to HTTPS, and responses
    //    carry HSTS with max-age of at least 31536000.
    [Fact]
    public async Task Given_an_HTTP_request_When_received_Then_it_is_redirected_to_HTTPS()
    {
        var response = await _factory.CreateHttpClient().GetAsync("/api/v1/content/manifest");

        Assert.Equal(HttpStatusCode.PermanentRedirect, response.StatusCode);
        Assert.Equal(new Uri("https://localhost/api/v1/content/manifest"), response.Headers.Location);
    }

    [Fact]
    public async Task Given_a_response_When_inspected_Then_it_carries_HSTS_of_at_least_a_year()
    {
        var response = await _factory.CreateHttpsClient().GetAsync("/api/v1/content/manifest");

        var hsts = Assert.Single(response.Headers.GetValues("Strict-Transport-Security"));
        var maxAge = hsts.Split(';').Select(part => part.Trim()).Single(part => part.StartsWith("max-age="));
        Assert.True(long.Parse(maxAge["max-age=".Length..]) >= 31536000);
    }

    // #2 Given any response, when inspected, then it carries a Content-Security-Policy with
    //    default-src 'self', no unsafe-inline script, frame-ancestors 'none', plus
    //    X-Content-Type-Options: nosniff and Referrer-Policy: no-referrer.
    [Theory]
    [InlineData("GET", "/api/v1/content/manifest")]
    [InlineData("GET", "/api/v1/activities/count-the-toys")]
    [InlineData("GET", "/api/v1/activities/no-such-activity")]
    [InlineData("GET", "/api/v1/activities/Not_An_Id")]
    [InlineData("GET", "/recordings/home/count-the-toys.wav")]
    [InlineData("GET", "/pictures/words/cat.svg")]
    [InlineData("GET", "/health/live")]
    [InlineData("GET", "/metrics")]
    [InlineData("GET", "/openapi/v1.json")]
    [InlineData("GET", "/nowhere")]
    [InlineData("POST", "/api/v1/content/manifest")]
    [Trait("Category", "Critical")]
    public async Task Given_any_response_When_inspected_Then_it_carries_the_hardening_headers(string method, string path)
    {
        var response = await _factory.CreateHttpsClient().SendAsync(new HttpRequestMessage(new HttpMethod(method), path));

        var policy = Assert.Single(response.Headers.GetValues("Content-Security-Policy"));
        var directives = policy.Split(';').Select(directive => directive.Trim()).ToArray();
        Assert.Contains("default-src 'self'", directives);
        Assert.Contains("frame-ancestors 'none'", directives);
        Assert.DoesNotContain("unsafe-inline", policy);
        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("no-referrer", Assert.Single(response.Headers.GetValues("Referrer-Policy")));
    }

    // #3 Given a cross-origin request, when made, then CORS allows only the configured frontend origin.
    [Fact]
    public async Task Given_a_request_from_the_frontend_origin_When_made_Then_CORS_allows_it()
    {
        var response = await SendFromAsync(_factory, FrontendOrigin);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(FrontendOrigin, Assert.Single(response.Headers.GetValues("Access-Control-Allow-Origin")));
        Assert.False(response.Headers.Contains("Access-Control-Allow-Credentials"));
    }

    [Theory]
    [InlineData("https://elsewhere.example")]
    [InlineData("http://pibbo.example")]
    [InlineData("https://pibbo.example.elsewhere.example")]
    public async Task Given_a_request_from_another_origin_When_made_Then_CORS_does_not_allow_it(string origin)
    {
        var response = await SendFromAsync(_factory, origin);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Given_no_frontend_origin_is_configured_When_a_cross_origin_request_is_made_Then_CORS_allows_none()
    {
        using var factory = new PibboApiFactory();

        var response = await SendFromAsync(factory, FrontendOrigin);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Given_a_preflight_for_a_write_from_the_frontend_origin_When_made_Then_the_write_is_not_allowed()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/content/manifest");
        request.Headers.Add("Origin", FrontendOrigin);
        request.Headers.Add("Access-Control-Request-Method", "POST");

        var response = await _factory.CreateHttpsClient().SendAsync(request);

        var allowed = response.Headers.TryGetValues("Access-Control-Allow-Methods", out var methods)
            ? string.Join(',', methods)
            : string.Empty;
        Assert.DoesNotContain("POST", allowed);
    }

    // #4 Given more than 300 requests in one minute from one client, when the limit is passed,
    //    then 429 with Retry-After is returned.
    [Fact]
    public async Task Given_300_requests_in_a_minute_from_one_client_When_one_more_is_made_Then_429_with_Retry_After()
    {
        var client = _factory.CreateHttpsClient();
        for (var request = 1; request <= 300; request++)
        {
            var allowed = await client.GetAsync("/api/v1/activities/count-the-toys");
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        var response = await client.GetAsync("/api/v1/activities/count-the-toys");

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.TooManyRequests);
        var retryAfter = response.Headers.RetryAfter?.Delta;
        Assert.NotNull(retryAfter);
        Assert.InRange(retryAfter.Value, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(60));

        // A probe is never refused: a busy minute must not take the service out of rotation.
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
    }

    private static Task<HttpResponseMessage> SendFromAsync(PibboApiFactory factory, string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/manifest");
        request.Headers.Add("Origin", origin);
        return factory.CreateHttpsClient().SendAsync(request);
    }
}
