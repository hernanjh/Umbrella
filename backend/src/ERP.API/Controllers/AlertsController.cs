using ERP.Application.DTOs.Alerts;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class AlertsController : BaseController
{
    private readonly IAlertService _service;
    public AlertsController(IAlertService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new { success = true, data = await _service.GetForCurrentUserAsync() });

    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkRead([FromBody] MarkReadDto dto)
    {
        await _service.MarkReadAsync(dto.Keys ?? Array.Empty<string>());
        return Ok(new { success = true });
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _service.MarkAllReadAsync();
        return Ok(new { success = true });
    }
}
