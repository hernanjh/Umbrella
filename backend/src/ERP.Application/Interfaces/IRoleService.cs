using ERP.Application.DTOs.Roles;

namespace ERP.Application.Interfaces;

public interface IRoleService
{
    Task<IEnumerable<RoleListDto>> GetAllAsync();
    Task<RoleDetailDto> GetByIdAsync(int id);
    Task<RoleDetailDto> CreateAsync(CreateRoleDto dto, string createdBy);
    Task<RoleDetailDto> UpdateAsync(int id, UpdateRoleDto dto, string modifiedBy);
    Task SoftDeleteAsync(int id, string deletedBy);
}
