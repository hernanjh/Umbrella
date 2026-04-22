using ERP.Application.DTOs.Auth;

namespace ERP.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request);
    Task LogoutAsync(int userId);
    Task ChangePasswordAsync(int userId, ChangePasswordDto request);
    Task<UserProfileDto> GetProfileAsync(int userId);
    Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto request);
    Task<string> UploadProfilePhotoAsync(int userId, Stream photoStream, string fileName);
}
