namespace ERP.Application.DTOs.Auth;

public record LoginRequestDto(string Email, string Password);

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserProfileDto User
);

public record RefreshTokenRequestDto(string RefreshToken);

public record ChangePasswordDto(string CurrentPassword, string NewPassword, string ConfirmPassword);

public record UserProfileDto(
    int Id,
    string Code,
    string FirstName,
    string LastName,
    string Email,
    string? ProfilePhotoUrl,
    string Theme,
    string? Phone,
    IEnumerable<string> Roles,
    IEnumerable<string> Permissions,
    int? ZoneId,
    string? ZoneName,
    bool IsSeller
);

public record UpdateProfileDto(
    string FirstName,
    string LastName,
    string? Phone,
    string Theme
);
