using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Pibbo.Api.AcceptanceTests.Support;

/// <summary>Signs tokens the way a sign-in for staff would, with a key only the tests know.</summary>
public static class AdminTokens
{
    public const string Issuer = "pibbo-tests";
    public const string Audience = "pibbo-content";
    public const string EditorRole = "content-editor";

    public static readonly byte[] SigningKey = Encoding.UTF8.GetBytes("pibbo-tests-signing-key-of-at-least-32-bytes!");

    /// <summary>The settings that make the API trust <see cref="SigningKey"/>.</summary>
    public static IEnumerable<KeyValuePair<string, string>> Settings() =>
    [
        new("Authentication:Schemes:Bearer:ValidIssuer", Issuer),
        new("Authentication:Schemes:Bearer:ValidAudiences:0", Audience),
        new("Authentication:Schemes:Bearer:SigningKeys:0:Issuer", Issuer),
        new("Authentication:Schemes:Bearer:SigningKeys:0:Value", Convert.ToBase64String(SigningKey)),
    ];

    public static string Editor() => Create(roles: [EditorRole]);

    public static string Create(
        string[]? roles = null,
        string issuer = Issuer,
        string audience = Audience,
        byte[]? key = null,
        DateTime? expires = null)
    {
        var claims = new List<Claim> { new("sub", "editor-1") };
        claims.AddRange((roles ?? []).Select(role => new Claim("role", role)));
        var notBefore = (expires ?? DateTime.UtcNow.AddHours(1)).AddHours(-2);
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = issuer,
            Audience = audience,
            Subject = new ClaimsIdentity(claims),
            NotBefore = notBefore,
            IssuedAt = notBefore,
            Expires = expires ?? DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key ?? SigningKey),
                SecurityAlgorithms.HmacSha256),
        });
    }
}
