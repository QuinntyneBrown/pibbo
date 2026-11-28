// Traces to: L2-027
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Nodes;
using Pibbo.Api.AcceptanceTests.Support;

namespace Pibbo.Api.AcceptanceTests;

public sealed class PublishedContractTests : IDisposable
{
    private readonly PibboApiFactory _factory = new();

    public void Dispose() => _factory.Dispose();

    // #5 (the backend's half) Given the OpenAPI document, when the build runs, then it fails if
    //    the API has drifted from the published document a client is generated from.
    //    To publish a deliberate change: PIBBO_UPDATE_OPENAPI=1 dotnet test
    [Fact]
    public async Task Given_the_published_OpenAPI_document_When_the_API_is_built_Then_it_has_not_drifted()
    {
        var served = JsonNode.Parse(await _factory.CreateHttpsClient().GetStringAsync("/openapi/v1.json"))!
            .ToJsonString(new JsonSerializerOptions { WriteIndented = true }) + "\n";
        var published = PublishedDocumentPath();

        if (Environment.GetEnvironmentVariable("PIBBO_UPDATE_OPENAPI") == "1")
        {
            await File.WriteAllTextAsync(published, served);
        }

        Assert.True(File.Exists(published), $"The published document is missing: {published}");
        Assert.Equal((await File.ReadAllTextAsync(published)).ReplaceLineEndings("\n"), served.ReplaceLineEndings("\n"));
    }

    [Fact]
    public async Task Given_the_published_OpenAPI_document_When_read_Then_it_offers_only_reads_and_names_each_operation()
    {
        var document = JsonDocument.Parse(await _factory.CreateHttpsClient().GetStringAsync("/openapi/v1.json")).RootElement;

        var operations = document.GetProperty("paths").EnumerateObject()
            .SelectMany(path => path.Value.EnumerateObject().Select(operation => (Method: operation.Name, Operation: operation.Value)))
            .ToArray();

        Assert.Equal(3, operations.Length);
        Assert.All(operations, operation => Assert.Equal("get", operation.Method));
        Assert.Equal(
            new[] { "getActivity", "getLesson", "getManifest" },
            operations.Select(operation => operation.Operation.GetProperty("operationId").GetString()!).Order());
    }

    private static string PublishedDocumentPath([CallerFilePath] string here = "") =>
        Path.GetFullPath(Path.Combine(Path.GetDirectoryName(here)!, "..", "..", "openapi", "v1.json"));
}
