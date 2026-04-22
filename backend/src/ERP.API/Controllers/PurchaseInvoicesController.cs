using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Invoices;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/purchase-invoices")]
public class PurchaseInvoicesController : BaseController
{
    private readonly IPurchaseInvoiceService _service;
    public PurchaseInvoicesController(IPurchaseInvoiceService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] QueryParamsDto query)
        => Ok(new { success = true, data = await _service.GetAllAsync(query) });

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
        => Ok(new { success = true, data = await _service.GetByIdAsync(id) });

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseInvoiceDto dto)
    {
        var result = await _service.CreateAsync(dto, CurrentUserEmail);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreatePurchaseInvoiceDto dto)
        => Ok(new { success = true, data = await _service.UpdateAsync(id, dto, CurrentUserEmail) });

    [HttpPost("{id}/confirm")]
    public async Task<IActionResult> Confirm(int id)
    {
        await _service.ConfirmAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Compra confirmada. Stock y precios actualizados." });
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        await _service.CancelAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Compra cancelada." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.SoftDeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Compra eliminada." });
    }
}
