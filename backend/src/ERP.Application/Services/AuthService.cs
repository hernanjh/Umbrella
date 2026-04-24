using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ERP.Application.DTOs.Auth;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ERP.Application.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IUnitOfWork uow, IConfiguration config)
    {
        _db = db;
        _uow = uow;
        _config = config;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower() && !u.IsDeleted)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!user.IsActive) throw new UnauthorizedAccessException("Usuario inactivo.");
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        var profile = await BuildProfileAsync(user);
        var (accessToken, expiresAt) = GenerateAccessToken(user, profile);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();

        return new LoginResponseDto(accessToken, refreshToken, expiresAt, profile);
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken && !u.IsDeleted)
            ?? throw new UnauthorizedAccessException("Token inválido.");

        if (user.RefreshTokenExpiry < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Token expirado.");

        var profile = await BuildProfileAsync(user);
        var (accessToken, expiresAt) = GenerateAccessToken(user, profile);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();

        return new LoginResponseDto(accessToken, refreshToken, expiresAt, profile);
    }

    public async Task LogoutAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException();
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException("Las contraseñas no coinciden.");

        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException();
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Contraseña actual incorrecta.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ModifiedAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();
    }

    public async Task<UserProfileDto> GetProfileAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException();
        return await BuildProfileAsync(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto request)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException();
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Phone = request.Phone;
        user.Theme = request.Theme;
        user.ModifiedAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();
        return await BuildProfileAsync(user);
    }

    public Task<string> UploadProfilePhotoAsync(int userId, Stream photoStream, string fileName)
        => Task.FromResult($"/uploads/profiles/{userId}_{fileName}");

    private (string token, DateTime expiresAt) GenerateAccessToken(User user, UserProfileDto profile)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Secret"] ?? "ERP_SECRET_KEY_CHANGE_IN_PRODUCTION_32CH"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddHours(8);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("firstName", user.FirstName),
            new("lastName", user.LastName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("isSeller", profile.IsSeller ? "1" : "0"),
        };
        if (profile.ZoneId.HasValue) claims.Add(new Claim("zoneId", profile.ZoneId.Value.ToString()));
        foreach (var r in profile.Roles) claims.Add(new Claim(ClaimTypes.Role, r));
        foreach (var p in profile.Permissions) claims.Add(new Claim("perm", p));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "ERP",
            audience: _config["Jwt:Audience"] ?? "ERP",
            claims: claims, expires: expiresAt, signingCredentials: creds);
        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private async Task<UserProfileDto> BuildProfileAsync(User user)
    {
        var userRoles = await _db.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == user.Id)
            .ToListAsync();

        var roleIds = userRoles.Select(ur => ur.RoleId).ToList();

        var rolePerms = await _db.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => roleIds.Contains(rp.RoleId))
            .ToListAsync();

        var roles = userRoles.Select(ur => ur.Role.Name).ToList();
        var isSeller = userRoles.Any(ur => ur.Role.IsSeller);
        var isAdmin = roles.Contains("Administrador");

        // Emit granular permissions: "module:read", "module:write", "module:delete".
        // Admins get '*:write' + '*:delete' wildcard so frontend treats them as superuser.
        var permissions = new HashSet<string>();
        foreach (var rp in rolePerms.Where(rp => rp.Permission != null))
        {
            var mod = rp.Permission!.Module;
            if (rp.CanRead) permissions.Add($"{mod}:read");
            if (rp.CanWrite) permissions.Add($"{mod}:write");
            if (rp.CanDelete) permissions.Add($"{mod}:delete");
        }
        if (isAdmin)
        {
            permissions.Add("*:read");
            permissions.Add("*:write");
            permissions.Add("*:delete");
        }

        string? zoneName = null;
        if (user.ZoneId.HasValue)
            zoneName = await _db.Zones.Where(z => z.Id == user.ZoneId).Select(z => z.Name).FirstOrDefaultAsync();

        return new UserProfileDto(user.Id, user.Code, user.FirstName, user.LastName,
            user.Email, user.ProfilePhotoUrl, user.Theme, user.Phone, roles, permissions,
            user.ZoneId, zoneName, isSeller);
    }
}
