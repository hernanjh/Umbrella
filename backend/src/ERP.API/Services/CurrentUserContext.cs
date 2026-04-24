using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ERP.Application.Interfaces;

namespace ERP.API.Services;

public class CurrentUserContext : ICurrentUserContext
{
    public int UserId { get; }
    public string Email { get; }
    public bool IsAuthenticated { get; }
    public bool IsAdministrator { get; }
    public bool IsSeller { get; }
    public int? ZoneId { get; }
    public IReadOnlyCollection<string> Roles { get; }
    public IReadOnlyCollection<string> Permissions { get; }

    public CurrentUserContext(IHttpContextAccessor accessor)
    {
        var principal = accessor.HttpContext?.User;
        IsAuthenticated = principal?.Identity?.IsAuthenticated ?? false;

        if (!IsAuthenticated)
        {
            UserId = 0;
            Email = "";
            Roles = Array.Empty<string>();
            Permissions = Array.Empty<string>();
            return;
        }

        UserId = int.TryParse(principal!.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;
        Email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value
            ?? principal.FindFirst(ClaimTypes.Email)?.Value ?? "";
        Roles = principal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray();
        Permissions = principal.FindAll("perm").Select(c => c.Value).ToArray();
        IsAdministrator = Roles.Contains("Administrador");
        IsSeller = principal.FindFirst("isSeller")?.Value == "1";
        ZoneId = int.TryParse(principal.FindFirst("zoneId")?.Value, out var z) ? z : null;
    }

    public bool HasPermission(string module, string level)
    {
        if (IsAdministrator) return true;
        return Permissions.Contains($"{module}:{level}")
            || Permissions.Contains($"*:{level}");
    }

    public bool IsZoneScoped => IsSeller && !IsAdministrator && ZoneId.HasValue;
}
