using ERP.Application.DTOs.Stock;
using ERP.Application.DTOs.Common;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class StockController : BaseController
{
    private readonly IStockService _service;
    public StockController(IStockService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetStatus([FromQuery] int? locationId, [FromQuery] int? categoryId)
        => Ok(new { success = true, data = await _service.GetStockStatusAsync(locationId, categoryId) });

    [HttpGet("products/{productId}")]
    public async Task<IActionResult> GetProductStock(int productId)
        => Ok(new { success = true, data = await _service.GetProductStockAsync(productId) });

    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements([FromQuery] QueryParamsDto query, [FromQuery] int? productId, [FromQuery] int? locationId)
        => Ok(new { success = true, data = await _service.GetMovementsAsync(query, productId, locationId) });

    [HttpGet("adjustments")]
    public async Task<IActionResult> GetAdjustments([FromQuery] QueryParamsDto query)
        => Ok(new { success = true, data = await _service.GetAdjustmentsAsync(query) });

    [HttpPost("adjustments")]
    public async Task<IActionResult> CreateAdjustment([FromBody] CreateStockAdjustmentDto dto)
    {
        var id = await _service.CreateAdjustmentAsync(dto, CurrentUserEmail);
        return Ok(new { success = true, data = new { id }, message = "Ajuste creado en borrador." });
    }

    [HttpPost("adjustments/{id}/confirm")]
    public async Task<IActionResult> ConfirmAdjustment(int id)
    {
        await _service.ConfirmAdjustmentAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Ajuste confirmado y stock actualizado." });
    }

    [HttpGet("locations")]
    public async Task<IActionResult> GetLocations()
        => Ok(new { success = true, data = await _service.GetLocationsAsync() });

    [HttpPost("locations")]
    public async Task<IActionResult> CreateLocation([FromBody] CreateStockLocationDto dto)
        => Ok(new { success = true, data = await _service.CreateLocationAsync(dto, CurrentUserEmail) });

    [HttpPut("locations/{id}")]
    public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateStockLocationDto dto)
        => Ok(new { success = true, data = await _service.UpdateLocationAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("locations/{id}")]
    public async Task<IActionResult> DeleteLocation(int id)
    {
        await _service.DeleteLocationAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Locación eliminada." });
    }
}
