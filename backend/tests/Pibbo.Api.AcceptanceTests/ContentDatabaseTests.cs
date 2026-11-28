// Traces to: L2-027, L2-038
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Pibbo.Api.AcceptanceTests.Support;
using Pibbo.Infrastructure.Persistence;

namespace Pibbo.Api.AcceptanceTests;

/// <summary>The same service over a real SQLite database, built by the migrations.</summary>
public sealed class ContentDatabaseTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"pibbo-content-{Guid.NewGuid():N}");
    private readonly PibboApiFactory _factory;

    public ContentDatabaseTests()
    {
        CopyDirectory(PibboApiFactory.FixtureContentRoot, _root);
        _factory = new PibboApiFactory().WithSqlite().WithSetting("Content:Root", _root);
    }

    public void Dispose()
    {
        _factory.Dispose();
        Directory.Delete(_root, recursive: true);
    }

    [Fact]
    public async Task Given_a_new_database_When_the_service_starts_Then_the_migrations_build_it_and_the_content_is_served()
    {
        var client = _factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
        var manifest = await ReadJsonAsync(await client.GetAsync("/api/v1/content/manifest"));
        Assert.Equal("test-1", manifest.GetProperty("contentVersion").GetString());
        var activity = await ReadJsonAsync(await client.GetAsync("/api/v1/activities/count-the-toys"));
        Assert.Equal("/pictures/words/cat.svg", activity.GetProperty("pictures")[0].GetString());
        var lesson = await ReadJsonAsync(await client.GetAsync("/api/v1/lessons/first-sounds"));
        Assert.Equal("count-the-toys", lesson.GetProperty("activities")[0].GetString());

        using var scope = _factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ContentDbContext>();
        Assert.Empty(await database.Database.GetPendingMigrationsAsync());
        Assert.Equal(1, await database.Versions.CountAsync());
    }

    // Content is versioned: a reviewed change is a new version with a new ETag.
    [Fact]
    public async Task Given_a_new_reviewed_version_When_it_replaces_the_file_Then_it_is_served_with_a_new_ETag()
    {
        var client = _factory.CreateHttpsClient();
        var first = await client.GetAsync("/api/v1/content/manifest");

        ReplaceInContentFile("\"test-1\"", "\"test-2\"", "Count the toys", "Count the ducks");
        var second = await client.GetAsync("/api/v1/content/manifest");

        Assert.Equal("test-2", (await ReadJsonAsync(second)).GetProperty("contentVersion").GetString());
        Assert.NotEqual(first.Headers.ETag, second.Headers.ETag);
        var activity = await ReadJsonAsync(await client.GetAsync("/api/v1/activities/count-the-toys"));
        Assert.Equal("Count the ducks", activity.GetProperty("name").GetString());

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/manifest");
        request.Headers.IfNoneMatch.Add(first.Headers.ETag!);
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(request)).StatusCode);
    }

    // A version that does not pass the check is never served: the last good one stays.
    [Fact]
    public async Task Given_a_version_that_does_not_pass_the_check_When_it_replaces_the_file_Then_the_last_good_version_stays_served()
    {
        var client = _factory.CreateHttpsClient();
        var first = await client.GetAsync("/api/v1/content/manifest");

        ReplaceInContentFile("\"test-1\"", "\"test-2\"", "\"count-the-toys\"", "\"Count The Toys\"");
        var second = await client.GetAsync("/api/v1/content/manifest");

        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal("test-1", (await ReadJsonAsync(second)).GetProperty("contentVersion").GetString());
        Assert.Equal(first.Headers.ETag, second.Headers.ETag);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
        Assert.Contains(_factory.Logs.Entries, entry => entry.Message.Contains("was not published"));
    }

    // A published version is never rewritten: changed content needs a new version.
    [Fact]
    public async Task Given_changed_content_under_a_published_version_When_it_replaces_the_file_Then_the_published_version_is_unchanged()
    {
        var client = _factory.CreateHttpsClient();
        await client.GetAsync("/api/v1/content/manifest");

        ReplaceInContentFile("Count the toys", "Count the ducks");
        var activity = await ReadJsonAsync(await client.GetAsync("/api/v1/activities/count-the-toys"));

        Assert.Equal("Count the toys", activity.GetProperty("name").GetString());
        Assert.Contains(_factory.Logs.Entries, entry => entry.Message.Contains("already published"));
    }

    [Fact]
    public async Task Given_published_content_When_the_service_restarts_on_the_same_database_Then_it_is_not_published_twice()
    {
        await _factory.CreateHttpsClient().GetAsync("/api/v1/content/manifest");

        using var restarted = _factory.WithWebHostBuilder(_ => { });
        var manifest = await restarted.CreateClient(new() { BaseAddress = new Uri("https://localhost") })
            .GetAsync("/api/v1/content/manifest");

        Assert.Equal(HttpStatusCode.OK, manifest.StatusCode);
        using var scope = restarted.Services.CreateScope();
        Assert.Equal(1, await scope.ServiceProvider.GetRequiredService<ContentDbContext>().Versions.CountAsync());
    }

    private void ReplaceInContentFile(params string[] pairs)
    {
        var file = Path.Combine(_root, "content.json");
        var text = File.ReadAllText(file);
        for (var pair = 0; pair < pairs.Length; pair += 2)
        {
            text = text.Replace(pairs[pair], pairs[pair + 1]);
        }

        File.WriteAllText(file, text);
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

    private static void CopyDirectory(string from, string to)
    {
        foreach (var file in Directory.EnumerateFiles(from, "*", SearchOption.AllDirectories))
        {
            var target = Path.Combine(to, Path.GetRelativePath(from, file));
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, overwrite: true);
        }
    }
}
