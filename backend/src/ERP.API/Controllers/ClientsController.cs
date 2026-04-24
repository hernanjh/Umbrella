using ERP.API.Attributes;
using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Clients;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class ClientsController : BaseController
{
    private readonly IClientService _service;
    public ClientsController(IClientService service) { _service = service; }

    [HttpGet]
    [RequirePermission("clients", "read")]
    public async Task<IActionResult> GetAll([FromQuery] QueryParamsDto query)
        => Ok(new { success = true, data = await _service.GetAllAsync(query) });

    [HttpGet("search")]
    [RequirePermission("clients", "read")]
    public async Task<IActionResult> Search([FromQuery] string term)
        => Ok(new { success = true, data = await _service.SearchAsync(term) });

    [HttpGet("{id}")]
    [RequirePermission("clients", "read")]
    public async Task<IActionResult> GetById(int id)
        => Ok(new { success = true, data = await _service.GetByIdAsync(id) });

    [HttpPost]
    [RequirePermission("clients", "write")]
    public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
    {
        var result = await _service.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id}")]
    [RequirePermission("clients", "write")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateClientDto dto)
        => Ok(new { success = true, data = await _service.UpdateAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("{id}")]
    [RequirePermission("clients", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Cliente eliminado." });
    }

    [HttpPost("{id}/restore")]
    [RequirePermission("clients", "write")]
    public async Task<IActionResult> Restore(int id)
    {
        await _service.RestoreAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Cliente restaurado." });
    }
}
