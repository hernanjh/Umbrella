namespace ERP.Domain.Entities;

public class RolePermission
{
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public int PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
    public bool CanRead { get; set; } = true;
    public bool CanWrite { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    public bool ViewAll { get; set; } = true;
}
