using ERP.API.Attributes;
using ERP.Application.DTOs.Roles;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class RolesController : BaseController
{
    private readonly IRoleService _roles;
    private readonly AppDbContext _db;
    public RolesController(IRoleService roles, AppDbContext db) { _roles = roles; _db = db; }

    [HttpGet]
    [RequirePermission("security", "read")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _roles.GetAllAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpGet("permissions")]
    [RequirePermission("security", "read")]
    public async Task<IActionResult> GetPermissions()
        => Ok(new { success = true, data = await _db.Permissions.OrderBy(p => p.Description)
            .Select(p => new { p.Id, p.Module, p.Action, p.Description }).ToListAsync() });

    [HttpGet("{id:int}")]
    [RequirePermission("security", "read")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _roles.GetByIdAsync(id);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    [RequirePermission("security", "write")]
    public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
    {
        var result = await _roles.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id:int}")]
    [RequirePermission("security", "write")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleDto dto)
    {
        var result = await _roles.UpdateAsync(id, dto, CurrentUserEmail);
        return Ok(new { success = true, data = result });
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("security", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _roles.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Rol eliminado." });
    }
}
