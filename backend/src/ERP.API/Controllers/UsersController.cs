using ERP.API.Attributes;
using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Users;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class UsersController : BaseController
{
    private readonly IUserService _users;
    private readonly AppDbContext _db;
    public UsersController(IUserService users, AppDbContext db) { _users = users; _db = db; }

    // Open to any authenticated user — used by zone/sales forms, not a security-module read
    [HttpGet("sellers")]
    public async Task<IActionResult> GetSellers([FromQuery] string? term)
    {
        var q = _db.UserRoles.Include(ur => ur.User).Include(ur => ur.Role)
            .Where(ur => ur.Role.IsSeller && ur.User.IsActive);
        if (!string.IsNullOrWhiteSpace(term))
        {
            var p = $"%{term}%";
            q = q.Where(ur => EF.Functions.Like(ur.User.FirstName, p) || EF.Functions.Like(ur.User.LastName, p) || EF.Functions.Like(ur.User.Email, p));
        }
        var data = await q.Select(ur => new { id = ur.User.Id, firstName = ur.User.FirstName, lastName = ur.User.LastName, email = ur.User.Email })
            .Distinct().Take(50).ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpGet]
    [RequirePermission("security", "read")]
    public async Task<IActionResult> GetAll([FromQuery] QueryParamsDto query)
    {
        var result = await _users.GetAllAsync(query);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id:int}")]
    [RequirePermission("security", "read")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _users.GetByIdAsync(id);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    [RequirePermission("security", "write")]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var result = await _users.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id:int}")]
    [RequirePermission("security", "write")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var result = await _users.UpdateAsync(id, dto, CurrentUserEmail);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("{id:int}/reset-password")]
    [RequirePermission("security", "write")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
    {
        await _users.ResetPasswordAsync(id, dto.NewPassword, CurrentUserEmail);
        return Ok(new { success = true, message = "Contraseña restablecida." });
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("security", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _users.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Usuario eliminado." });
    }

    [HttpPost("{id:int}/restore")]
    [RequirePermission("security", "write")]
    public async Task<IActionResult> Restore(int id)
    {
        await _users.RestoreAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Usuario restaurado." });
    }
}

public record ResetPasswordDto(string NewPassword);
