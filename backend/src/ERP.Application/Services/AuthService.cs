using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ERP.Application.DTOs.Auth;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ERP.Application.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _users;
    private readonly IRepository<UserRole> _userRoles;
    private readonly IRepository<RolePermission> _rolePermissions;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public AuthService(IRepository<User> users, IRepository<UserRole> userRoles,
        IRepository<RolePermission> rolePermissions, IUnitOfWork uow, IConfiguration config)
    {
        _users = users;
        _userRoles = userRoles;
        _rolePermissions = rolePermissions;
        _uow = uow;
        _config = config;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = (await _users.FindAsync(u => u.Email == request.Email.ToLower() && !u.IsDeleted))
            .FirstOrDefault() ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!user.IsActive) throw new UnauthorizedAccessException("Usuario inactivo.");
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        var (accessToken, expiresAt) = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        return new LoginResponseDto(accessToken, refreshToken, expiresAt, await BuildProfileAsync(user));
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        var user = (await _users.FindAsync(u => u.RefreshToken == request.RefreshToken && !u.IsDeleted))
            .FirstOrDefault() ?? throw new UnauthorizedAccessException("Token inválido.");

        if (user.RefreshTokenExpiry < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Token expirado.");

        var (accessToken, expiresAt) = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        return new LoginResponseDto(accessToken, refreshToken, expiresAt, await BuildProfileAsync(user));
    }

    public async Task LogoutAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId) ?? throw new KeyNotFoundException();
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException("Las contraseñas no coinciden.");

        var user = await _users.GetByIdAsync(userId) ?? throw new KeyNotFoundException();
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Contraseña actual incorrecta.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ModifiedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task<UserProfileDto> GetProfileAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId) ?? throw new KeyNotFoundException();
        return await BuildProfileAsync(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto request)
    {
        var user = await _users.GetByIdAsync(userId) ?? throw new KeyNotFoundException();
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Phone = request.Phone;
        user.Theme = request.Theme;
        user.ModifiedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
        return await BuildProfileAsync(user);
    }

    public Task<string> UploadProfilePhotoAsync(int userId, Stream photoStream, string fileName)
    {
        // In production: upload to Azure Blob / S3. Here returns a local path.
        var path = $"/uploads/profiles/{userId}_{fileName}";
        return Task.FromResult(path);
    }

    private (string token, DateTime expiresAt) GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Secret"] ?? "ERP_SECRET_KEY_CHANGE_IN_PRODUCTION_32CH"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddHours(8);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "ERP",
            audience: _config["Jwt:Audience"] ?? "ERP",
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

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
        var userRoles = await _userRoles.FindAsync(ur => ur.UserId == user.Id);
        var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
        var rolePerms = await _rolePermissions.FindAsync(rp => roleIds.Contains(rp.RoleId));

        var roles = userRoles.Select(ur => ur.RoleId.ToString());
        var permissions = rolePerms.Select(rp => $"{rp.Permission?.Module}:{rp.Permission?.Action}").Distinct();

        return new UserProfileDto(user.Id, user.Code, user.FirstName, user.LastName,
            user.Email, user.ProfilePhotoUrl, user.Theme, user.Phone, roles, permissions);
    }
}
