using Pibbo.Api;
using Pibbo.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi("v1");
builder.Services.AddContent(builder.Configuration);

var app = builder.Build();

app.UseStatusCodePages();
app.UseContentAssets();

app.MapOpenApi();
app.MapContentEndpoints();

app.Run();

/// <summary>The entry point, named so the acceptance tests can host the API in memory.</summary>
public partial class Program;
