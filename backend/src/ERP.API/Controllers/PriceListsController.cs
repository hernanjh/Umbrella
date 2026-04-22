using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.PriceLists;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/price-lists")]
public class PriceListsController : BaseController
{
    private readonly IPriceListService _service;
    public PriceListsController(IPriceListService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] QueryParamsDto query)
        => Ok(new { success = true, data = await _service.GetAllAsync(query) });

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
        => Ok(new { success = true, data = await _service.GetByIdAsync(id) });

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePriceListDto dto)
    {
        var result = await _service.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePriceListDto dto)
        => Ok(new { success = true, data = await _service.UpdateAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Lista eliminada." });
    }

    [HttpPut("{id}/items")]
    public async Task<IActionResult> UpsertItem(int id, [FromBody] UpsertPriceListItemDto dto)
    {
        await _service.UpsertItemAsync(id, dto, CurrentUserEmail);
        return Ok(new { success = true, message = "Precio actualizado." });
    }

    [HttpDelete("{id}/items/{productId}")]
    public async Task<IActionResult> RemoveItem(int id, int productId)
    {
        await _service.RemoveItemAsync(id, productId, CurrentUserEmail);
        return Ok(new { success = true, message = "Item removido." });
    }

    [HttpPost("{id}/bulk-update")]
    public async Task<IActionResult> BulkUpdate(int id, [FromBody] BulkUpdatePriceListDto dto)
    {
        await _service.BulkUpdateAsync(id, dto, CurrentUserEmail);
        return Ok(new { success = true, message = "Precios actualizados masivamente." });
    }

    [HttpPost("{id}/recalculate")]
    public async Task<IActionResult> Recalculate(int id)
    {
        await _service.RecalculatePricesAsync(id);
        return Ok(new { success = true, message = "Precios recalculados." });
    }
}
