using ERP.API.Attributes;
using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Suppliers;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class SuppliersController : BaseController
{
    private readonly ISupplierService _service;
    public SuppliersController(ISupplierService service) { _service = service; }

    [HttpGet]
    [RequirePermission("suppliers", "read")]
    public async Task<IActionResult> GetAll([FromQuery] QueryParamsDto query)
        => Ok(new { success = true, data = await _service.GetAllAsync(query) });

    [HttpGet("search")]
    [RequirePermission("suppliers", "read")]
    public async Task<IActionResult> Search([FromQuery] string term)
        => Ok(new { success = true, data = await _service.SearchAsync(term) });

    [HttpGet("{id}")]
    [RequirePermission("suppliers", "read")]
    public async Task<IActionResult> GetById(int id)
        => Ok(new { success = true, data = await _service.GetByIdAsync(id) });

    [HttpPost]
    [RequirePermission("suppliers", "write")]
    public async Task<IActionResult> Create([FromBody] CreateSupplierDto dto)
    {
        var result = await _service.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id}")]
    [RequirePermission("suppliers", "write")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierDto dto)
        => Ok(new { success = true, data = await _service.UpdateAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("{id}")]
    [RequirePermission("suppliers", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Proveedor eliminado." });
    }

    [HttpPost("{id}/restore")]
    [RequirePermission("suppliers", "write")]
    public async Task<IActionResult> Restore(int id)
    {
        await _service.RestoreAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Proveedor restaurado." });
    }
}
