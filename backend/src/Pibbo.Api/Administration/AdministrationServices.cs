using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Pibbo.Api.Administration;

public static class AdministrationServices
{
    public const string ContentEditorPolicy = "ContentEditor";
    public const string ContentEditorRole = "content-editor";
    public const string PathPrefix = "/api/v1/admin";

    /// <summary>
    /// Bearer tokens for staff, configured under <c>Authentication:Schemes:Bearer</c>: locally
    /// signed keys (<c>dotnet user-jwts</c>) for the MVP, or an <c>Authority</c> to trust an OIDC
    /// provider instead. With nothing configured no token is trusted, so every admin call is 401.
    /// Nothing a child uses ever carries a token.
    /// </summary>
    public static IServiceCollection AddContentAdministration(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddAuthorizationBuilder().AddPolicy(ContentEditorPolicy, policy => policy
            .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
            .RequireAuthenticatedUser()
            .RequireRole(ContentEditorRole));
        return services;
    }

    public static bool IsAdministration(PathString path) => path.StartsWithSegments(PathPrefix);
}
