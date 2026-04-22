namespace ERP.Application.DTOs.Roles;

public record RoleListDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    bool IsSeller,
    bool IsActive,
    int UserCount,
    DateTime CreatedAt
);

public record RoleDetailDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    bool IsSeller,
    bool IsActive,
    IEnumerable<RolePermissionDto> Permissions
);

public record RolePermissionDto(
    int PermissionId,
    string Module,
    string Action,
    string Description,
    bool CanRead,
    bool CanWrite,
    bool CanDelete,
    bool ViewAll
);

public record CreateRoleDto(
    string Code,
    string Name,
    string? Description,
    bool IsSeller,
    IEnumerable<RolePermissionInputDto> Permissions
);

public record UpdateRoleDto(
    string Name,
    string? Description,
    bool IsSeller,
    bool IsActive,
    IEnumerable<RolePermissionInputDto> Permissions
);

public record RolePermissionInputDto(
    int PermissionId,
    bool CanRead,
    bool CanWrite,
    bool CanDelete,
    bool ViewAll
);
