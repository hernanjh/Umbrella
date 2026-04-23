using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Users;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public UserService(AppDbContext db, IUnitOfWork uow)
    {
        _db = db;
        _uow = uow;
    }

    public async Task<PagedResultDto<UserListDto>> GetAllAsync(QueryParamsDto query)
    {
        var q = _db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(u => u.FirstName.ToLower().Contains(s) ||
                              u.LastName.ToLower().Contains(s) ||
                              u.Email.ToLower().Contains(s) ||
                              u.Code.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.OrderBy(u => u.LastName).ThenBy(u => u.FirstName);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync();

        return new PagedResultDto<UserListDto>(
            items.Select(u => new UserListDto(
                u.Id, u.Code, u.FirstName, u.LastName, u.Email, u.Phone, u.Theme, u.IsActive, u.CreatedAt, u.CreatedBy,
                u.UserRoles.Select(ur => ur.Role.Name))),
            total, query.Page, query.PageSize,
            (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<UserDetailDto> GetByIdAsync(int id)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado.");

        return MapToDetail(user);
    }

    public async Task<UserDetailDto> CreateAsync(CreateUserDto dto, string createdBy)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            throw new InvalidOperationException($"El email '{dto.Email}' ya está en uso.");

        var lastCode = await _db.Users.OrderByDescending(u => u.Id).Select(u => u.Code).FirstOrDefaultAsync();
        var nextNum = 1;
        if (lastCode != null && lastCode.StartsWith("USR") && int.TryParse(lastCode[3..], out var n)) nextNum = n + 1;

        var user = new User
        {
            Code = $"USR{nextNum:D3}",
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Phone = dto.Phone,
            IsActive = true,
            CreatedBy = createdBy
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        foreach (var roleId in dto.RoleIds)
        {
            if (await _db.Roles.AnyAsync(r => r.Id == roleId))
                _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId, AssignedBy = createdBy });
        }
        await _uow.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task<UserDetailDto> UpdateAsync(int id, UpdateUserDto dto, string modifiedBy)
    {
        var user = await _db.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado.");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Phone = dto.Phone;
        user.IsActive = dto.IsActive;
        user.ModifiedBy = modifiedBy;
        user.ModifiedAt = DateTime.UtcNow;

        _db.UserRoles.RemoveRange(user.UserRoles);
        foreach (var roleId in dto.RoleIds)
        {
            if (await _db.Roles.AnyAsync(r => r.Id == roleId))
                _db.UserRoles.Add(new UserRole { UserId = id, RoleId = roleId, AssignedBy = modifiedBy });
        }

        _db.Users.Update(user);
        await _uow.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException();
        user.IsDeleted = true;
        user.DeletedBy = deletedBy;
        user.DeletedAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();
    }

    public async Task RestoreAsync(int id, string restoredBy)
    {
        var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException();
        user.IsDeleted = false;
        user.DeletedBy = null;
        user.DeletedAt = null;
        user.ModifiedBy = restoredBy;
        user.ModifiedAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();
    }

    public async Task ResetPasswordAsync(int id, string newPassword, string changedBy)
    {
        var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException();
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ModifiedBy = changedBy;
        user.ModifiedAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _uow.SaveChangesAsync();
    }

    private static UserDetailDto MapToDetail(User u) => new(
        u.Id, u.Code, u.FirstName, u.LastName, u.Email, u.ProfilePhotoUrl, u.Phone, u.Theme,
        u.IsActive, u.LastLoginAt, u.CreatedAt, u.CreatedBy, u.ModifiedAt, u.ModifiedBy,
        u.UserRoles.Select(ur => new RoleAssignmentDto(ur.RoleId, ur.Role.Name, ur.AssignedBy, ur.AssignedAt)));
}
