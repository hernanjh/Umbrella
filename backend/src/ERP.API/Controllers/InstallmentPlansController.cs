using ERP.API.Attributes;
using ERP.Application.DTOs.Installments;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
public class InstallmentPlansController : BaseController
{
    private readonly IInstallmentPlanService _service;
    public InstallmentPlansController(IInstallmentPlanService service) { _service = service; }

    [HttpGet("api/sales-invoices/{invoiceId}/installment-plan")]
    [RequirePermission("sales", "read")]
    public async Task<IActionResult> GetByInvoice(int invoiceId)
        => Ok(new { success = true, data = await _service.GetByInvoiceAsync(invoiceId) });

    [HttpPost("api/sales-invoices/{invoiceId}/installment-plan")]
    [RequirePermission("sales", "write")]
    public async Task<IActionResult> Create(int invoiceId, [FromBody] CreateInstallmentPlanDto dto)
        => Ok(new { success = true, data = await _service.CreateAsync(invoiceId, dto, CurrentUserEmail) });

    [HttpPut("api/sales-invoices/{invoiceId}/installment-plan/installments/{installmentId}")]
    [RequirePermission("sales", "write")]
    public async Task<IActionResult> UpdateInstallment(int invoiceId, int installmentId, [FromBody] UpdateInstallmentDto dto)
        => Ok(new { success = true, data = await _service.UpdateInstallmentAsync(invoiceId, installmentId, dto, CurrentUserEmail) });

    [HttpDelete("api/sales-invoices/{invoiceId}/installment-plan")]
    [RequirePermission("sales", "delete")]
    public async Task<IActionResult> Delete(int invoiceId)
    {
        await _service.DeleteAsync(invoiceId, CurrentUserEmail);
        return Ok(new { success = true, message = "Plan anulado." });
    }

    [HttpPost("api/sales-invoices/{invoiceId}/installment-plan/installments/{installmentId}/pay")]
    [RequirePermission("sales", "write")]
    public async Task<IActionResult> Pay(int invoiceId, int installmentId, [FromBody] PayInstallmentDto dto)
    {
        await _service.PayInstallmentAsync(invoiceId, installmentId, dto, CurrentUserEmail);
        return Ok(new { success = true, message = "Cuota pagada." });
    }

    [HttpGet("api/installment-plans")]
    [RequirePermission("receivables", "read")]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
        => Ok(new { success = true, data = await _service.GetAllAsync(status) });

    [HttpGet("api/reports/overdue-installments")]
    [RequirePermission("receivables", "read")]
    public async Task<IActionResult> Overdue()
        => Ok(new { success = true, data = await _service.GetOverdueReportAsync() });
}
