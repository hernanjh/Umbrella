using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Users;

namespace ERP.Application.Interfaces;

public interface IUserService
{
    Task<PagedResultDto<UserListDto>> GetAllAsync(QueryParamsDto query);
    Task<UserDetailDto> GetByIdAsync(int id);
    Task<UserDetailDto> CreateAsync(CreateUserDto dto, string createdBy);
    Task<UserDetailDto> UpdateAsync(int id, UpdateUserDto dto, string modifiedBy);
    Task SoftDeleteAsync(int id, string deletedBy);
    Task RestoreAsync(int id, string restoredBy);
    Task ResetPasswordAsync(int id, string newPassword, string changedBy);
}
