// Traces to: L2-039
using Pibbo.Api.AcceptanceTests.Support;
using Pibbo.Api.Health;

namespace Pibbo.Api.AcceptanceTests;

/// <summary>
/// The container's health check is the app itself (<c>dotnet Pibbo.Api.dll probe</c>): the
/// image has no shell or curl. A deployment moves traffic only to a container whose probe passes.
/// </summary>
public sealed class ReadinessProbeTests : IDisposable
{
    private readonly string _empty = Directory.CreateTempSubdirectory("pibbo-content-").FullName;

    public void Dispose() => Directory.Delete(_empty, recursive: true);

    // #3 Given a deployment, when it completes, then traffic moves only after readiness passes.
    [Fact]
    public async Task Given_a_ready_service_When_probed_Then_the_probe_passes()
    {
        using var factory = new PibboApiFactory();

        var exitCode = await ReadinessProbe.CheckAsync(factory.CreateHttpClient());

        Assert.Equal(0, exitCode);
    }

    [Fact]
    public async Task Given_a_service_with_no_content_When_probed_Then_the_probe_fails()
    {
        using var factory = new PibboApiFactory().WithSetting("Content:Root", _empty);

        var exitCode = await ReadinessProbe.CheckAsync(factory.CreateHttpClient());

        Assert.Equal(1, exitCode);
    }

    [Fact]
    public async Task Given_nothing_listening_When_probed_Then_the_probe_fails_without_throwing()
    {
        using var client = new HttpClient { BaseAddress = new Uri("http://127.0.0.1:9"), Timeout = TimeSpan.FromSeconds(2) };

        var exitCode = await ReadinessProbe.CheckAsync(client);

        Assert.Equal(1, exitCode);
    }
}
