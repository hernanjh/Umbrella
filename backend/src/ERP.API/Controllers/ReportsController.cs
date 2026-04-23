using ERP.Application.DTOs.Reports;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class ReportsController : BaseController
{
    private readonly IReportService _service;
    public ReportsController(IReportService service) { _service = service; }

    [HttpGet("sales-by-period")]
    public async Task<IActionResult> SalesByPeriod([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetSalesByPeriodAsync(query) });

    [HttpGet("sales-by-seller")]
    public async Task<IActionResult> SalesBySeller([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetSalesBySellerAsync(query) });

    [HttpGet("sales-by-client")]
    public async Task<IActionResult> SalesByClient([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetSalesByClientAsync(query) });

    [HttpGet("stock")]
    public async Task<IActionResult> Stock([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetStockReportAsync(query) });

    [HttpGet("payments")]
    public async Task<IActionResult> Payments([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetPaymentsReportAsync(query) });

    [HttpGet("receivables")]
    public async Task<IActionResult> Receivables()
        => Ok(new { success = true, data = await _service.GetReceivablesReportAsync() });

    [HttpGet("payables")]
    public async Task<IActionResult> Payables()
        => Ok(new { success = true, data = await _service.GetPayablesReportAsync() });

    [HttpGet("cash")]
    public async Task<IActionResult> Cash([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetCashReportAsync(query) });

    [HttpGet("dashboard-summary")]
    public async Task<IActionResult> DashboardSummary()
        => Ok(new { success = true, data = await _service.GetDashboardSummaryAsync() });

    [HttpGet("{reportType}/excel")]
    public async Task<IActionResult> ExportExcel(string reportType, [FromQuery] ReportQueryDto query)
    {
        var bytes = await _service.ExportToExcelAsync(reportType, query);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{reportType}-{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("{reportType}/pdf")]
    public async Task<IActionResult> ExportPdf(string reportType, [FromQuery] ReportQueryDto query)
    {
        var bytes = await _service.ExportToPdfAsync(reportType, query);
        return File(bytes, "application/pdf", $"{reportType}-{DateTime.Now:yyyyMMdd}.pdf");
    }
}
