using System.Diagnostics;
using Pibbo.Api;
using Pibbo.Api.Endpoints;
using Pibbo.Api.Health;
using Pibbo.Api.Observability;
using Pibbo.Api.Privacy;
using Pibbo.Api.Security;

// A caller's trace id is never adopted: it would be an identifier written to the log.
DistributedContextPropagator.Current = new NoInboundTraceContext();

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(kestrel => kestrel.AddServerHeader = false);

builder.Services.AddPibboLogging(builder.Configuration);
builder.Services.AddProblemDetails(problems => problems.CustomizeProblemDetails = problem =>
    problem.ProblemDetails.Extensions["traceId"] = TraceIds.Of(problem.HttpContext));
builder.Services.AddExceptionHandler<ValidationExceptionHandler>();
builder.Services.AddExceptionHandler<UnhandledExceptionHandler>();
builder.Services.AddPibboOpenApi();
builder.Services.AddContent(builder.Configuration, builder.Environment);
builder.Services.AddHardening(builder.Configuration);
builder.Services.AddHealth();

var app = builder.Build();

// Outermost first: every response, whatever answers it, is logged without who asked, carries
// the hardening headers and sets no cookie.
app.UseMiddleware<RequestLogMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<NoCookieMiddleware>();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpsOnly();
app.UseRateLimiter();
app.UseMiddleware<ReadOnlyMiddleware>();
app.UseCors();
app.UseContentAssets();

app.MapHealth();
app.MapOpenApi();
app.MapContentEndpoints();

app.Run();

/// <summary>The entry point, named so the acceptance tests can host the API in memory.</summary>
public partial class Program;
