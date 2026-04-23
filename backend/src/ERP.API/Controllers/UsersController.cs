using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Users;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class UsersController : BaseController
{
    private readonly IUserService _users;
    public UsersController(IUserService users) { _users = users; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] QueryParamsDto query)
    {
        var result = await _users.GetAllAsync(query);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _users.GetByIdAsync(id);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var result = await _users.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var result = await _users.UpdateAsync(id, dto, CurrentUserEmail);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
    {
        await _users.ResetPasswordAsync(id, dto.NewPassword, CurrentUserEmail);
        return Ok(new { success = true, message = "Contraseña restablecida." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _users.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Usuario eliminado." });
    }

    [HttpPost("{id:int}/restore")]
    public async Task<IActionResult> Restore(int id)
    {
        await _users.RestoreAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Usuario restaurado." });
    }
}

public record ResetPasswordDto(string NewPassword);
