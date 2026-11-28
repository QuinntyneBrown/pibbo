using System.Net;
using System.Text.Json;

namespace Pibbo.Api.AcceptanceTests.Support;

public static class ProblemAssert
{
    /// <summary>Asserts an RFC 9457 problem-details body and returns it.</summary>
    public static async Task<JsonElement> IsProblemAsync(HttpResponseMessage response, HttpStatusCode status)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal((int)status, problem.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("title").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("type").GetString()));
        return problem;
    }
}
