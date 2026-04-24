using ERP.API.Attributes;
using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Products;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class ProductsController : BaseController
{
    private readonly IProductService _service;
    public ProductsController(IProductService service) { _service = service; }

    [HttpGet]
    [RequirePermission("products", "read")]
    public async Task<IActionResult> GetAll([FromQuery] QueryParamsDto query)
        => Ok(new { success = true, data = await _service.GetAllAsync(query) });

    [HttpGet("search")]
    [RequirePermission("products", "read")]
    public async Task<IActionResult> Search([FromQuery] string term)
        => Ok(new { success = true, data = await _service.SearchAsync(term) });

    [HttpGet("{id}")]
    [RequirePermission("products", "read")]
    public async Task<IActionResult> GetById(int id)
        => Ok(new { success = true, data = await _service.GetByIdAsync(id) });

    [HttpPost]
    [RequirePermission("products", "write")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var result = await _service.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id}")]
    [RequirePermission("products", "write")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
        => Ok(new { success = true, data = await _service.UpdateAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("{id}")]
    [RequirePermission("products", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Producto eliminado." });
    }

    [HttpPost("{id}/restore")]
    [RequirePermission("products", "write")]
    public async Task<IActionResult> Restore(int id)
    {
        await _service.RestoreAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Producto restaurado." });
    }
}
