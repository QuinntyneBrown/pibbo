// Traces to: L2-031
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Pibbo.Api.AcceptanceTests.Support;

namespace Pibbo.Api.AcceptanceTests;

public sealed class ContentAdministrationTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"pibbo-content-{Guid.NewGuid():N}");
    private readonly PibboApiFactory _factory;

    public ContentAdministrationTests()
    {
        foreach (var file in Directory.EnumerateFiles(PibboApiFactory.FixtureContentRoot, "*", SearchOption.AllDirectories))
        {
            var target = Path.Combine(_root, Path.GetRelativePath(PibboApiFactory.FixtureContentRoot, file));
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target);
        }

        _factory = new PibboApiFactory().WithSetting("Content:Root", _root);
    }

    public void Dispose()
    {
        _factory.Dispose();
        Directory.Delete(_root, recursive: true);
    }

    public static TheoryData<string, string> AdminEndpoints() => new()
    {
        { "PUT", "/api/v1/admin/assets/recordings/words/cat.mp3" },
        { "POST", "/api/v1/admin/content/versions" },
    };

    // #1 Given no token, when an admin endpoint is called, then 401 is returned.
    [Theory]
    [MemberData(nameof(AdminEndpoints))]
    public async Task Given_no_token_When_an_admin_endpoint_is_called_Then_401(string method, string path)
    {
        var response = await SendAsync(_factory.CreateAdminClient(null), method, path);

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.Unauthorized);
        Assert.Contains(response.Headers.WwwAuthenticate, challenge => challenge.Scheme == "Bearer");
        Assert.False(File.Exists(Path.Combine(_root, "assets", "recordings", "words", "cat.mp3")));
    }

    public static TheoryData<string> TokensThatAreNotTrusted() => new()
    {
        "not-a-token",
        AdminTokens.Create(roles: [AdminTokens.EditorRole], key: Encoding.UTF8.GetBytes("another-key-that-is-at-least-32-bytes-long!")),
        AdminTokens.Create(roles: [AdminTokens.EditorRole], issuer: "someone-else"),
        AdminTokens.Create(roles: [AdminTokens.EditorRole], audience: "another-service"),
        AdminTokens.Create(roles: [AdminTokens.EditorRole], expires: DateTime.UtcNow.AddMinutes(-10)),
    };

    [Theory]
    [MemberData(nameof(TokensThatAreNotTrusted))]
    public async Task Given_a_token_that_is_not_trusted_When_an_admin_endpoint_is_called_Then_401(string token)
    {
        var response = await SendAsync(_factory.CreateAdminClient(token), "PUT", "/api/v1/admin/assets/recordings/words/cat.mp3");

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Given_no_signing_key_is_configured_When_an_editor_token_is_sent_Then_401()
    {
        using var factory = new PibboApiFactory()
            .WithSetting("Content:Root", _root)
            .WithSetting("Authentication:Schemes:Bearer:SigningKeys:0:Value", null)
            .WithSetting("Authentication:Schemes:Bearer:SigningKeys:0:Issuer", null);

        var response = await SendAsync(factory.CreateAdminClient(AdminTokens.Editor()), "PUT", "/api/v1/admin/assets/recordings/words/cat.mp3");

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.Unauthorized);
    }

    // #2 Given a valid token without the content-editor role, when called, then 403 is returned.
    [Theory]
    [MemberData(nameof(AdminEndpoints))]
    public async Task Given_a_valid_token_without_the_content_editor_role_When_called_Then_403(string method, string path)
    {
        var token = AdminTokens.Create(roles: ["content-reader"]);

        var response = await SendAsync(_factory.CreateAdminClient(token), method, path);

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.Forbidden);
    }

    // #3 Given an uploaded file, when received, then its type is checked by content sniffing
    //    (audio/mpeg, audio/ogg, image/webp, sanitised image/svg+xml), its size is capped
    //    (audio 1 MB, image 2 MB), and anything else is rejected with 415 or 413.
    public static TheoryData<string, byte[], string> AcceptedUploads() => new()
    {
        { "/recordings/words/cat.mp3", SampleFiles.Mp3(), "audio/mpeg" },
        { "/recordings/words/cat-frame.mp3", SampleFiles.Mp3WithoutTag(), "audio/mpeg" },
        { "/recordings/words/cat.ogg", SampleFiles.Ogg(), "audio/ogg" },
        { "/pictures/words/cat.webp", SampleFiles.Webp(), "image/webp" },
        { "/pictures/words/upload.svg", SampleFiles.Svg(), "image/svg+xml" },
        { "/recordings/words/largest.mp3", SampleFiles.Mp3(SampleFiles.OneMegabyte), "audio/mpeg" },
        { "/pictures/words/largest.webp", SampleFiles.Webp(2 * SampleFiles.OneMegabyte), "image/webp" },
    };

    [Theory]
    [MemberData(nameof(AcceptedUploads))]
    public async Task Given_an_allowed_file_within_its_size_When_uploaded_Then_it_is_stored_and_served(
        string path,
        byte[] file,
        string contentType)
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());

        var response = await admin.PutAsync($"/api/v1/admin/assets{path}", Bytes(file, "application/octet-stream"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(new Uri(path, UriKind.Relative), response.Headers.Location);
        var served = await _factory.CreateHttpsClient().GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);
        Assert.Equal(contentType, served.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Given_a_file_already_stored_When_uploaded_again_Then_it_is_replaced_with_200()
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        await admin.PutAsync("/api/v1/admin/assets/recordings/words/cat.ogg", Bytes(SampleFiles.Ogg(64), "audio/ogg"));

        var response = await admin.PutAsync("/api/v1/admin/assets/recordings/words/cat.ogg", Bytes(SampleFiles.Ogg(128), "audio/ogg"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(128, (await _factory.CreateHttpsClient().GetByteArrayAsync("/recordings/words/cat.ogg")).Length);
    }

    public static TheoryData<string, byte[], string> UnsupportedUploads() => new()
    {
        // The declared type is never trusted: each of these says it is something it is not.
        { "/recordings/words/cat.mp3", SampleFiles.Wav(), "audio/mpeg" },
        { "/recordings/words/cat.wav", SampleFiles.Wav(), "audio/wav" },
        { "/pictures/words/cat.jpg", SampleFiles.Jpeg(), "image/jpeg" },
        { "/pictures/words/cat.webp", SampleFiles.Png(), "image/webp" },
        { "/recordings/words/cat.mp3", Encoding.UTF8.GetBytes("just some text"), "audio/mpeg" },
        { "/pictures/words/upload.svg", Encoding.UTF8.GetBytes("<html><body>not a picture</body></html>"), "image/svg+xml" },
        { "/pictures/words/upload.svg", Encoding.UTF8.GetBytes("<svg xmlns=\"http://www.w3.org/2000/svg\"><unclosed></svg>"), "image/svg+xml" },
        { "/pictures/words/upload.svg", Encoding.UTF8.GetBytes("<!DOCTYPE svg [<!ENTITY a \"aaaa\">]><svg xmlns=\"http://www.w3.org/2000/svg\">&a;</svg>"), "image/svg+xml" },

        // The file is allowed, but not under that name or in that folder.
        { "/pictures/words/cat.webp", SampleFiles.Ogg(), "image/webp" },
        { "/recordings/words/cat.ogg", SampleFiles.Webp(), "audio/ogg" },
        { "/pictures/words/cat.mp3", SampleFiles.Mp3(), "audio/mpeg" },
        { "/recordings/words/cat.svg", SampleFiles.Svg(), "image/svg+xml" },
        { "/recordings/words/cat", SampleFiles.Mp3(), "audio/mpeg" },
    };

    [Theory]
    [MemberData(nameof(UnsupportedUploads))]
    public async Task Given_a_file_that_is_not_an_allowed_type_When_uploaded_Then_415_and_nothing_is_stored(
        string path,
        byte[] file,
        string declared)
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());

        var response = await admin.PutAsync($"/api/v1/admin/assets{path}", Bytes(file, declared));

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.UnsupportedMediaType);
        Assert.False(File.Exists(Path.Combine(_root, "assets", path.TrimStart('/'))));
    }

    public static TheoryData<string, byte[]> UploadsTooLarge() => new()
    {
        { "/recordings/words/big.mp3", SampleFiles.Mp3(SampleFiles.OneMegabyte + 1) },
        { "/recordings/words/big.ogg", SampleFiles.Ogg(SampleFiles.OneMegabyte + 1) },
        { "/pictures/words/big.webp", SampleFiles.Webp((2 * SampleFiles.OneMegabyte) + 1) },
        { "/pictures/words/big.svg", SampleFiles.SvgOfSize((2 * SampleFiles.OneMegabyte) + 1) },
        { "/pictures/words/huge.webp", SampleFiles.Webp(5 * SampleFiles.OneMegabyte) },
    };

    [Theory]
    [MemberData(nameof(UploadsTooLarge))]
    public async Task Given_a_file_over_its_size_cap_When_uploaded_Then_413_and_nothing_is_stored(string path, byte[] file)
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());

        var response = await admin.PutAsync($"/api/v1/admin/assets{path}", Bytes(file, "application/octet-stream"));

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.RequestEntityTooLarge);
        Assert.False(File.Exists(Path.Combine(_root, "assets", path.TrimStart('/'))));
    }

    [Theory]
    [InlineData("/api/v1/admin/assets/recordings/../content.json")]
    [InlineData("/api/v1/admin/assets/recordings/words/%2e%2e/%2e%2e/escape.mp3")]
    [InlineData("/api/v1/admin/assets/recordings/Words/Cat%20Sound.mp3")]
    [InlineData("/api/v1/admin/assets/sounds/cat.mp3")]
    [InlineData("/api/v1/admin/assets/recordings/.hidden.mp3")]
    public async Task Given_a_path_outside_pictures_and_recordings_When_uploaded_to_Then_it_is_refused_and_nothing_is_stored(string path)
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());

        var response = await admin.PutAsync(path, Bytes(SampleFiles.Mp3(), "audio/mpeg"));

        Assert.True(
            response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.NotFound,
            $"Expected 400 or 404, got {(int)response.StatusCode}.");
        Assert.Empty(Directory.EnumerateFiles(_root, "*.mp3", SearchOption.AllDirectories));
        Assert.False(File.Exists(Path.Combine(Path.GetDirectoryName(_root)!, "escape.mp3")));
    }

    [Fact]
    public async Task Given_an_SVG_with_script_handlers_and_outside_references_When_uploaded_Then_what_is_served_has_none_of_them()
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        var unsafeSvg = SampleFiles.Svg("""
            <script>alert(1)</script>
            <circle cx="5" cy="5" r="4" onclick="alert(2)" onload="alert(3)" fill="red" />
            <a href="https://elsewhere.example/"><rect width="2" height="2" /></a>
            <image href="https://elsewhere.example/track.png" />
            <use xlink:href="http://elsewhere.example/sprite.svg#x" xmlns:xlink="http://www.w3.org/1999/xlink" />
            <use href="#local-shape" />
            <rect style="fill:url(https://elsewhere.example/x)" width="1" height="1" />
            <foreignObject><div xmlns="http://www.w3.org/1999/xhtml">hi</div></foreignObject>
            <style>@import url(https://elsewhere.example/x.css);</style>
            <set attributeName="href" to="javascript:alert(4)" />
            <path d="M0 0 L1 1" />
            """);

        var response = await admin.PutAsync("/api/v1/admin/assets/pictures/words/unsafe.svg", Bytes(unsafeSvg, "image/svg+xml"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var served = await _factory.CreateHttpsClient().GetStringAsync("/pictures/words/unsafe.svg");
        foreach (var gone in new[] { "<script", "alert", "onclick", "onload", "elsewhere.example", "foreignObject", "<style", "javascript:", "<set" })
        {
            Assert.DoesNotContain(gone, served, StringComparison.OrdinalIgnoreCase);
        }

        Assert.Contains("<circle", served);
        Assert.Contains("fill=\"red\"", served);
        Assert.Contains("#local-shape", served);
        Assert.Contains("<path", served);
    }

    // #4 Given text content (words, sentences), when saved, then it is validated against a
    //    character allow-list and a maximum of 80 characters.
    [Fact]
    public async Task Given_reviewed_content_When_an_editor_publishes_it_Then_it_is_served_as_the_new_version()
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        var content = FixtureContent("test-2");
        content["activities"]![0]!["name"] = "Count the ducks!";

        var response = await admin.PostAsJsonAsync("/api/v1/admin/content/versions", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(new Uri("/api/v1/content/manifest", UriKind.Relative), response.Headers.Location);
        var published = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("test-2", published.GetProperty("contentVersion").GetString());

        var manifest = await _factory.CreateHttpsClient().GetAsync("/api/v1/content/manifest");
        Assert.Equal(published.GetProperty("eTag").GetString(), manifest.Headers.ETag!.Tag);
        var activity = await _factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/v1/activities/count-the-toys");
        Assert.Equal("Count the ducks!", activity.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Given_an_uploaded_recording_When_content_naming_it_is_published_Then_it_is_served()
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        await admin.PutAsync("/api/v1/admin/assets/recordings/home/count-the-ducks.ogg", Bytes(SampleFiles.Ogg(), "audio/ogg"));
        var content = FixtureContent("test-2");
        content["activities"]![0]!["recording"] = "/recordings/home/count-the-ducks.ogg";

        var response = await admin.PostAsJsonAsync("/api/v1/admin/content/versions", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var manifest = await _factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/v1/content/manifest");
        Assert.Contains(
            "/recordings/home/count-the-ducks.ogg",
            manifest.GetProperty("assets").EnumerateArray().Select(asset => asset.GetString()));
    }

    public static TheoryData<string, string, string> TextThatIsNotAllowed() => new()
    {
        { "name", new string('a', 81), "80" },
        { "name", "<b>Count</b>", "allowed" },
        { "name", "Count the toys 😀", "allowed" },
        { "name", "Count\nthe toys", "allowed" },
        { "name", "{{constructor.constructor('alert(1)')()}}", "allowed" },
        { "name", "   ", "1 to 80" },
        { "glyph", "<img src=x onerror=alert(1)>", "allowed" },
        { "glyph", "javascript:alert(1)", "allowed" },
    };

    [Theory]
    [MemberData(nameof(TextThatIsNotAllowed))]
    public async Task Given_text_outside_the_allow_list_or_over_80_characters_When_published_Then_400_naming_the_field(
        string field,
        string text,
        string said)
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        var content = FixtureContent("test-2");
        content["activities"]![0]![field] = text;

        var response = await admin.PostAsJsonAsync("/api/v1/admin/content/versions", content);

        var problem = await ProblemAssert.IsProblemAsync(response, HttpStatusCode.BadRequest);
        var errors = problem.GetProperty("errors");
        var messages = errors.GetProperty($"activities[0].{field}").EnumerateArray().Select(message => message.GetString()!);
        Assert.Contains(messages, message => message.Contains(said));
        await AssertStillServedAsync("test-1");
    }

    [Theory]
    [InlineData("Which is bigger?")]
    [InlineData("Skip-count")]
    [InlineData("3+4")]
    [InlineData("♪ 1 2")]
    [InlineData("s u _")]
    [InlineData("Let’s count, then clap!")]
    [InlineData("Élan's café")]
    public async Task Given_text_inside_the_allow_list_When_published_Then_it_is_saved_as_written(string text)
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        var content = FixtureContent("test-2");
        content["activities"]![0]!["glyph"] = text;

        var response = await admin.PostAsJsonAsync("/api/v1/admin/content/versions", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var activity = await _factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/v1/activities/count-the-toys");
        Assert.Equal(text, activity.GetProperty("glyph").GetString());
    }

    [Fact]
    public async Task Given_content_that_names_a_missing_file_or_activity_When_published_Then_400_and_the_last_version_stays_served()
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        var content = FixtureContent("test-2");
        content["activities"]![0]!["recording"] = "/recordings/home/missing.ogg";
        content["lessons"]![0]!["activities"] = new JsonArray("no-such-activity");

        var response = await admin.PostAsJsonAsync("/api/v1/admin/content/versions", content);

        var problem = await ProblemAssert.IsProblemAsync(response, HttpStatusCode.BadRequest);
        var errors = problem.GetProperty("errors");
        Assert.True(errors.TryGetProperty("activities[0].recording", out _), errors.GetRawText());
        Assert.True(errors.TryGetProperty("lessons[0].activities[0]", out _), errors.GetRawText());
        await AssertStillServedAsync("test-1");
    }

    [Fact]
    public async Task Given_a_version_already_published_When_it_is_published_again_Then_409()
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());
        await _factory.CreateHttpsClient().GetAsync("/api/v1/content/manifest");

        var response = await admin.PostAsJsonAsync("/api/v1/admin/content/versions", FixtureContent("test-1"));

        await ProblemAssert.IsProblemAsync(response, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Given_a_body_that_is_not_JSON_When_published_Then_400()
    {
        var admin = _factory.CreateAdminClient(AdminTokens.Editor());

        var response = await admin.PostAsync(
            "/api/v1/admin/content/versions",
            new StringContent("{ not json", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await AssertStillServedAsync("test-1");
    }

    [Fact]
    public async Task Given_an_admin_request_When_logged_Then_the_token_and_the_path_are_not_stored()
    {
        var token = AdminTokens.Editor();
        var admin = _factory.CreateAdminClient(token);

        await admin.PutAsync("/api/v1/admin/assets/recordings/words/secret-name.ogg", Bytes(SampleFiles.Ogg(), "audio/ogg"));

        var entry = Assert.Single(_factory.Logs.Requests);
        Assert.Equal("/api/v1/admin/assets/{folder}/{**path}", entry.State["Route"]);
        Assert.All(_factory.Logs.Entries, logged =>
        {
            Assert.DoesNotContain(token, logged.Everything);
            Assert.DoesNotContain("secret-name", logged.Everything);
        });
    }

    private JsonObject FixtureContent(string version)
    {
        var content = JsonNode.Parse(File.ReadAllText(Path.Combine(PibboApiFactory.FixtureContentRoot, "content.json")))!.AsObject();
        content["version"] = version;
        return content;
    }

    private async Task AssertStillServedAsync(string version)
    {
        var manifest = await _factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/v1/content/manifest");
        Assert.Equal(version, manifest.GetProperty("contentVersion").GetString());
    }

    private static ByteArrayContent Bytes(byte[] file, string declared)
    {
        var content = new ByteArrayContent(file);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(declared);
        return content;
    }

    private static Task<HttpResponseMessage> SendAsync(HttpClient client, string method, string path) =>
        client.SendAsync(new HttpRequestMessage(new HttpMethod(method), path)
        {
            Content = method == "PUT"
                ? Bytes(SampleFiles.Mp3(), "audio/mpeg")
                : new StringContent("{}", Encoding.UTF8, "application/json"),
        });
}
