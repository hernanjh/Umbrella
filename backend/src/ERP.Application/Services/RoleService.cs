using ERP.Application.DTOs.Roles;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class RoleService : IRoleService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public RoleService(AppDbContext db, IUnitOfWork uow)
    {
        _db = db;
        _uow = uow;
    }

    public async Task<IEnumerable<RoleListDto>> GetAllAsync()
    {
        var roles = await _db.Roles
            .Include(r => r.UserRoles)
            .OrderBy(r => r.Name)
            .ToListAsync();

        return roles.Select(r => new RoleListDto(
            r.Id, r.Code, r.Name, r.Description, r.IsSeller, r.IsActive,
            r.UserRoles.Count, r.CreatedAt));
    }

    public async Task<RoleDetailDto> GetByIdAsync(int id)
    {
        var role = await _db.Roles
            .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new KeyNotFoundException($"Rol {id} no encontrado.");

        return MapToDetail(role);
    }

    public async Task<RoleDetailDto> CreateAsync(CreateRoleDto dto, string createdBy)
    {
        if (await _db.Roles.AnyAsync(r => r.Code == dto.Code.ToUpper()))
            throw new InvalidOperationException($"El código '{dto.Code}' ya existe.");

        var role = new Role
        {
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            Description = dto.Description,
            IsSeller = dto.IsSeller,
            IsActive = true,
            CreatedBy = createdBy
        };

        _db.Roles.Add(role);
        await _db.SaveChangesAsync();

        foreach (var perm in dto.Permissions)
        {
            _db.RolePermissions.Add(new RolePermission
            {
                RoleId = role.Id,
                PermissionId = perm.PermissionId,
                CanRead = perm.CanRead,
                CanWrite = perm.CanWrite,
                CanDelete = perm.CanDelete,
                ViewAll = perm.ViewAll
            });
        }
        await _uow.SaveChangesAsync();

        return await GetByIdAsync(role.Id);
    }

    public async Task<RoleDetailDto> UpdateAsync(int id, UpdateRoleDto dto, string modifiedBy)
    {
        var role = await _db.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new KeyNotFoundException($"Rol {id} no encontrado.");

        role.Name = dto.Name;
        role.Description = dto.Description;
        role.IsSeller = dto.IsSeller;
        role.IsActive = dto.IsActive;
        role.ModifiedBy = modifiedBy;
        role.ModifiedAt = DateTime.UtcNow;

        _db.RolePermissions.RemoveRange(role.RolePermissions);
        foreach (var perm in dto.Permissions)
        {
            _db.RolePermissions.Add(new RolePermission
            {
                RoleId = id,
                PermissionId = perm.PermissionId,
                CanRead = perm.CanRead,
                CanWrite = perm.CanWrite,
                CanDelete = perm.CanDelete,
                ViewAll = perm.ViewAll
            });
        }

        _db.Roles.Update(role);
        await _uow.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var role = await _db.Roles.FindAsync(id) ?? throw new KeyNotFoundException();
        if (await _db.UserRoles.AnyAsync(ur => ur.RoleId == id))
            throw new InvalidOperationException("No se puede eliminar un rol que tiene usuarios asignados.");

        role.IsDeleted = true;
        role.DeletedBy = deletedBy;
        role.DeletedAt = DateTime.UtcNow;
        _db.Roles.Update(role);
        await _uow.SaveChangesAsync();
    }

    private static RoleDetailDto MapToDetail(Role r) => new(
        r.Id, r.Code, r.Name, r.Description, r.IsSeller, r.IsActive,
        r.RolePermissions.Select(rp => new RolePermissionDto(
            rp.PermissionId, rp.Permission.Module, rp.Permission.Action,
            rp.Permission.Description, rp.CanRead, rp.CanWrite, rp.CanDelete, rp.ViewAll)));
}
