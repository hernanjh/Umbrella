using ERP.API.Attributes;
using ERP.Application.DTOs.Cash;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/cash")]
public class CashController : BaseController
{
    private readonly ICashService _service;
    public CashController(ICashService service) { _service = service; }

    [HttpGet("current")]
    [RequirePermission("cash", "read")]
    public async Task<IActionResult> Current()
        => Ok(new { success = true, data = await _service.GetCurrentAsync() });

    [HttpGet("sessions")]
    [RequirePermission("cash", "read")]
    public async Task<IActionResult> Sessions([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(new { success = true, data = await _service.GetSessionsAsync(from, to) });

    [HttpGet("sessions/{id}")]
    [RequirePermission("cash", "read")]
    public async Task<IActionResult> GetSession(int id)
        => Ok(new { success = true, data = await _service.GetSessionAsync(id) });

    [HttpPost("sessions/open")]
    [RequirePermission("cash", "write")]
    public async Task<IActionResult> Open([FromBody] OpenCashSessionDto dto)
        => Ok(new { success = true, data = await _service.OpenAsync(dto, CurrentUserEmail) });

    [HttpPost("sessions/{id}/close")]
    [RequirePermission("cash", "write")]
    public async Task<IActionResult> Close(int id, [FromBody] CloseCashSessionDto dto)
        => Ok(new { success = true, data = await _service.CloseAsync(id, dto, CurrentUserEmail) });

    [HttpPost("sessions/{id}/movements")]
    [RequirePermission("cash", "write")]
    public async Task<IActionResult> AddMovement(int id, [FromBody] AddCashMovementDto dto)
        => Ok(new { success = true, data = await _service.AddMovementAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("movements/{id}")]
    [RequirePermission("cash", "delete")]
    public async Task<IActionResult> DeleteMovement(int id)
    {
        await _service.DeleteMovementAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Movimiento anulado." });
    }
}
