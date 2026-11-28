// Traces to: L2-028
using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Pibbo.Api.AcceptanceTests.Support;

namespace Pibbo.Api.AcceptanceTests;

public sealed class HoldsNothingAboutAChildTests : IDisposable
{
    private readonly PibboApiFactory _factory = new();

    public void Dispose() => _factory.Dispose();

    public static TheoryData<string, string> WritesToPublicEndpoints()
    {
        var data = new TheoryData<string, string>();
        string[] paths =
        [
            "/api/v1/content/manifest",
            "/api/v1/activities/count-the-toys",
            "/api/v1/lessons/first-sounds",
            "/api/v1/progress",
            "/recordings/home/count-the-toys.wav",
            "/pictures/words/cat.svg",
            "/health/live",
            "/health/ready",
            "/openapi/v1.json",
            "/",
        ];
        foreach (var path in paths)
        {
            foreach (var method in new[] { "POST", "PUT", "PATCH", "DELETE" })
            {
                data.Add(method, path);
            }
        }

        return data;
    }

    // #1 Given every public endpoint, when called with POST, PUT, PATCH or DELETE, then 405.
    [Theory]
    [MemberData(nameof(WritesToPublicEndpoints))]
    public async Task Given_a_public_endpoint_When_it_is_written_to_Then_405(string method, string path)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), path)
        {
            Content = new StringContent("""{"child":"mia","answer":3}""", System.Text.Encoding.UTF8, "application/json"),
        };

        var response = await _factory.CreateHttpsClient().SendAsync(request);

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.MethodNotAllowed);
        Assert.Equal(["GET", "HEAD"], response.Content.Headers.Allow.Order());
    }

    // #2 Given any request, when logged, then the client IP is omitted or truncated, and no
    //    query string, cookie or device identifier is stored.
    [Theory]
    [InlineData("/api/v1/activities/count-the-toys")]
    [InlineData("/api/v1/content/manifest")]
    [InlineData("/recordings/home/count-the-toys.wav")]
    [InlineData("/api/v1/activities/Not_An_Id")]
    [InlineData("/somewhere/mia-aged-four")]
    public async Task Given_a_request_that_carries_who_asked_When_it_is_logged_Then_none_of_it_is_stored(string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"{path}?child=mia-rose&device=tablet-7f3a");
        request.Headers.Add("Cookie", "session=cookie-5e55");
        request.Headers.Add("X-Forwarded-For", "203.0.113.77");
        request.Headers.Add("User-Agent", "PibboTablet/1 serial-99ab");
        request.Headers.Add("X-Device-Id", "device-c0ffee");
        request.Headers.Add("traceparent", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");

        await _factory.CreateHttpsClient().SendAsync(request);

        var logged = Assert.Single(_factory.Logs.Requests);
        string[] secrets =
        [
            "mia-rose", "tablet-7f3a", "cookie-5e55", "203.0.113.77", "serial-99ab", "device-c0ffee",
            "mia-aged-four", "Not_An_Id", "4bf92f3577b34da6a3ce929d0e0e4736", "127.0.0.1", "::1",
        ];
        Assert.All(_factory.Logs.Entries, entry =>
            Assert.All(secrets, secret => Assert.DoesNotContain(secret, entry.Everything)));
        Assert.Equal(LogLevel.Information, logged.Level);
        Assert.All(_factory.Logs.Entries, entry =>
        {
            Assert.DoesNotContain("RequestPath", entry.State.Keys);
            Assert.DoesNotContain("RequestId", entry.State.Keys);
            Assert.DoesNotContain("ConnectionId", entry.State.Keys);
        });
    }

    // #3 Given any public response, when inspected, then it has no Set-Cookie header.
    [Theory]
    [InlineData("/api/v1/content/manifest")]
    [InlineData("/api/v1/activities/count-the-toys")]
    [InlineData("/api/v1/activities/no-such-activity")]
    [InlineData("/api/v1/lessons/first-sounds")]
    [InlineData("/recordings/home/count-the-toys.wav")]
    [InlineData("/health/live")]
    [InlineData("/openapi/v1.json")]
    [InlineData("/test/sets-a-cookie")]
    public async Task Given_a_public_response_When_inspected_Then_it_sets_no_cookie(string path)
    {
        // An endpoint that tries to set a cookie stands for any later mistake.
        _factory.WithServices(services => services.AddSingleton<Microsoft.AspNetCore.Hosting.IStartupFilter, CookieSettingEndpoint>());

        var response = await _factory.CreateHttpsClient().GetAsync(path);

        Assert.False(response.Headers.Contains("Set-Cookie"));
    }

    private sealed class CookieSettingEndpoint : Microsoft.AspNetCore.Hosting.IStartupFilter
    {
        public Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> Configure(
            Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> next) => app =>
        {
            next(app);
            app.Run(async context =>
            {
                context.Response.Cookies.Append("child", "mia");
                await context.Response.WriteAsync("ok");
            });
        };
    }
}
