namespace ERP.Application.DTOs.Users;

public record UserListDto(
    int Id,
    string Code,
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string Theme,
    bool IsActive,
    DateTime CreatedAt,
    string CreatedBy,
    IEnumerable<string> Roles
);

public record UserDetailDto(
    int Id,
    string Code,
    string FirstName,
    string LastName,
    string Email,
    string? ProfilePhotoUrl,
    string? Phone,
    string Theme,
    bool IsActive,
    DateTime? LastLoginAt,
    DateTime CreatedAt,
    string CreatedBy,
    DateTime? ModifiedAt,
    string? ModifiedBy,
    IEnumerable<RoleAssignmentDto> Roles
);

public record RoleAssignmentDto(int RoleId, string RoleName, string AssignedBy, DateTime AssignedAt);

public record CreateUserDto(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? Phone,
    IEnumerable<int> RoleIds
);

public record UpdateUserDto(
    string FirstName,
    string LastName,
    string? Phone,
    bool IsActive,
    IEnumerable<int> RoleIds
);
