namespace Pibbo.Api.Health;

/// <summary>
/// <c>dotnet Pibbo.Api.dll probe</c>: asks the running service on this machine whether it is
/// ready, and exits 0 if it is, 1 if not. The container health check, since the image has no
/// shell or curl.
/// </summary>
public static class ReadinessProbe
{
    public const string Command = "probe";

    public static async Task<int> RunAsync()
    {
        var port = (Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS") ?? "8080").Split(';', ',')[0].Trim();
        using var client = new HttpClient
        {
            BaseAddress = new Uri($"http://127.0.0.1:{port}"),
            Timeout = TimeSpan.FromSeconds(3),
        };
        return await CheckAsync(client);
    }

    public static async Task<int> CheckAsync(HttpClient client)
    {
        try
        {
            using var response = await client.GetAsync("/health/ready");
            return response.IsSuccessStatusCode ? 0 : 1;
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            return 1;
        }
    }
}
