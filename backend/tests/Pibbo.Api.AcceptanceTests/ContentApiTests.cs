// Traces to: L2-027
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Pibbo.Api.AcceptanceTests.Support;
using Pibbo.Application.Content;
using Pibbo.Infrastructure.Content;

namespace Pibbo.Api.AcceptanceTests;

public sealed class ContentApiTests : IDisposable
{
    private readonly PibboApiFactory _factory = new();

    public void Dispose() => _factory.Dispose();

    // #1 Given a valid activity id, when GET /api/v1/activities/{id} is called,
    //    then 200 is returned with JSON matching the published OpenAPI schema.
    [Fact]
    [Trait("Category", "Critical")]
    public async Task Given_a_valid_activity_id_When_it_is_asked_for_Then_200_matches_the_published_schema()
    {
        var client = _factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/v1/activities/count-the-toys");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var activity = await ReadJsonAsync(response);
        Assert.Equal("count-the-toys", activity.GetProperty("id").GetString());
        Assert.Equal("count", activity.GetProperty("group").GetString());
        Assert.Equal("Count the toys", activity.GetProperty("name").GetString());
        Assert.Equal("1 2 3", activity.GetProperty("glyph").GetString());
        Assert.Equal("/recordings/home/count-the-toys.wav", activity.GetProperty("recording").GetString());
        Assert.Equal("/pictures/words/cat.svg", activity.GetProperty("pictures")[0].GetString());

        var openApi = await ReadJsonAsync(await client.GetAsync("/openapi/v1.json"));
        var schema = SchemaOf(openApi, "/api/v1/activities/{id}", "200", "application/json");
        AssertMatchesSchema(schema, activity);
    }

    [Fact]
    public async Task Given_a_valid_lesson_id_When_it_is_asked_for_Then_200_matches_the_published_schema()
    {
        var client = _factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/v1/lessons/first-sounds");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var lesson = await ReadJsonAsync(response);
        Assert.Equal("first-sounds", lesson.GetProperty("id").GetString());
        Assert.Equal("count-the-toys", lesson.GetProperty("activities")[0].GetString());

        var openApi = await ReadJsonAsync(await client.GetAsync("/openapi/v1.json"));
        AssertMatchesSchema(SchemaOf(openApi, "/api/v1/lessons/{id}", "200", "application/json"), lesson);
    }

    // #2 Given an unknown id, when called, then 404 with an RFC 9457 problem-details body.
    [Theory]
    [InlineData("/api/v1/activities/no-such-activity")]
    [InlineData("/api/v1/lessons/no-such-lesson")]
    public async Task Given_an_unknown_id_When_it_is_asked_for_Then_404_problem_details(string path)
    {
        var response = await _factory.CreateHttpsClient().GetAsync(path);

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.NotFound);
    }

    // #3 Given an id not matching ^[a-z0-9-]{1,64}$, when called, then 400 problem details
    //    and no lookup is made.
    [Theory]
    [InlineData("Count-The-Toys")]
    [InlineData("count_the_toys")]
    [InlineData("count.the.toys")]
    [InlineData("count%20toys")]
    [InlineData("a-very-long-id-a-very-long-id-a-very-long-id-a-very-long-id-a-very-65")]
    public async Task Given_an_id_that_is_not_well_formed_When_it_is_asked_for_Then_400_and_no_lookup(string id)
    {
        var counter = new CountingContentStore.Counter();
        _factory.WithServices(services => services.AddScoped<IContentStore>(provider =>
            new CountingContentStore(provider.GetRequiredService<EfContentStore>(), counter)));
        var client = _factory.CreateHttpsClient();

        var activity = await client.GetAsync($"/api/v1/activities/{id}");
        var lesson = await client.GetAsync($"/api/v1/lessons/{id}");

        await ProblemAssert.IsProblemAsync(activity, HttpStatusCode.BadRequest);
        await ProblemAssert.IsProblemAsync(lesson, HttpStatusCode.BadRequest);
        var problem = await ProblemAssert.IsProblemAsync(lesson, HttpStatusCode.BadRequest);
        Assert.Contains("^[a-z0-9-]{1,64}$", problem.GetProperty("errors").GetProperty("id")[0].GetString());
        Assert.DoesNotContain(Uri.UnescapeDataString(id), problem.GetRawText());
        Assert.Equal(0, counter.Lookups);

        // The counter does count: a well-formed id is looked up.
        await client.GetAsync("/api/v1/activities/count-the-toys");
        Assert.True(counter.Lookups > 0);
    }

    // #4 Given the manifest, when returned, then it carries a content version and an ETag;
    //    a request with a matching If-None-Match gets 304.
    [Fact]
    public async Task Given_the_manifest_When_returned_Then_it_carries_a_content_version_and_an_ETag()
    {
        var response = await _factory.CreateHttpsClient().GetAsync("/api/v1/content/manifest");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Headers.ETag);
        Assert.False(response.Headers.ETag!.IsWeak);
        var manifest = await ReadJsonAsync(response);
        Assert.Equal("test-1", manifest.GetProperty("contentVersion").GetString());
        Assert.Equal("count-the-toys", manifest.GetProperty("activities")[0].GetProperty("id").GetString());
        Assert.Equal("first-sounds", manifest.GetProperty("lessons")[0].GetProperty("id").GetString());
        var assets = manifest.GetProperty("assets").EnumerateArray().Select(asset => asset.GetString()!).ToArray();
        Assert.Equal(
            new[] { "/pictures/words/cat.svg", "/recordings/home/count-the-toys.wav", "/recordings/home/first-sounds.wav" },
            assets);
    }

    [Fact]
    public async Task Given_a_matching_If_None_Match_When_the_manifest_is_asked_for_Then_304_with_no_body()
    {
        var client = _factory.CreateHttpsClient();
        var first = await client.GetAsync("/api/v1/content/manifest");

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/manifest");
        request.Headers.IfNoneMatch.Add(first.Headers.ETag!);
        var second = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotModified, second.StatusCode);
        Assert.Equal(first.Headers.ETag, second.Headers.ETag);
        Assert.Empty(await second.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task Given_another_ETag_When_the_manifest_is_asked_for_Then_200_with_the_manifest()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/content/manifest");
        request.Headers.IfNoneMatch.Add(new EntityTagHeaderValue("\"some-older-content\""));

        var response = await _factory.CreateHttpsClient().SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // "plus static recordings and pictures"
    [Theory]
    [InlineData("/recordings/home/count-the-toys.wav", "audio/wav")]
    [InlineData("/pictures/words/cat.svg", "image/svg+xml")]
    public async Task Given_a_recording_or_picture_in_the_manifest_When_fetched_Then_it_is_served(
        string path,
        string contentType)
    {
        var response = await _factory.CreateHttpsClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(contentType, response.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("/content.json")]
    [InlineData("/recordings/home/missing.wav")]
    [InlineData("/recordings/../content.json")]
    public async Task Given_a_path_that_is_not_a_recording_or_picture_When_fetched_Then_404(string path)
    {
        var response = await _factory.CreateHttpsClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

    private static JsonElement SchemaOf(JsonElement openApi, string path, string status, string mediaType)
    {
        var schema = openApi.GetProperty("paths").GetProperty(path).GetProperty("get")
            .GetProperty("responses").GetProperty(status)
            .GetProperty("content").GetProperty(mediaType).GetProperty("schema");
        return Resolve(openApi, schema);
    }

    private static JsonElement Resolve(JsonElement openApi, JsonElement schema)
    {
        if (!schema.TryGetProperty("$ref", out var reference))
        {
            return schema;
        }

        var resolved = openApi;
        foreach (var part in reference.GetString()!.TrimStart('#', '/').Split('/'))
        {
            resolved = resolved.GetProperty(part);
        }

        return resolved;
    }

    /// <summary>The body has every required property, and no property the schema does not name.</summary>
    private static void AssertMatchesSchema(JsonElement schema, JsonElement body)
    {
        var named = schema.GetProperty("properties").EnumerateObject().Select(property => property.Name).ToHashSet();
        var required = schema.GetProperty("required").EnumerateArray().Select(name => name.GetString()!).ToArray();
        var present = body.EnumerateObject().Select(property => property.Name).ToArray();

        Assert.NotEmpty(required);
        Assert.All(required, name => Assert.Contains(name, present));
        Assert.All(present, name => Assert.Contains(name, named));
    }
}
