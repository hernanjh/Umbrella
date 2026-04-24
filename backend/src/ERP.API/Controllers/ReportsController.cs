using ERP.API.Attributes;
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
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> SalesByPeriod([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetSalesByPeriodAsync(query) });

    [HttpGet("sales-by-seller")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> SalesBySeller([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetSalesBySellerAsync(query) });

    [HttpGet("sales-by-client")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> SalesByClient([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetSalesByClientAsync(query) });

    [HttpGet("stock")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> Stock([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetStockReportAsync(query) });

    [HttpGet("payments")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> Payments([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetPaymentsReportAsync(query) });

    [HttpGet("receivables")]
    [RequirePermission("receivables", "read")]
    public async Task<IActionResult> Receivables()
        => Ok(new { success = true, data = await _service.GetReceivablesReportAsync() });

    [HttpGet("payables")]
    [RequirePermission("payables", "read")]
    public async Task<IActionResult> Payables()
        => Ok(new { success = true, data = await _service.GetPayablesReportAsync() });

    [HttpGet("cash")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> Cash([FromQuery] ReportQueryDto query)
        => Ok(new { success = true, data = await _service.GetCashReportAsync(query) });

    [HttpGet("detailed-sales")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> DetailedSales([FromQuery] ReportQueryDto query, [FromQuery] int? zoneId)
        => Ok(new { success = true, data = await _service.GetDetailedSalesAsync(query, zoneId) });

    [HttpGet("dashboard-summary")]
    public async Task<IActionResult> DashboardSummary()
        => Ok(new { success = true, data = await _service.GetDashboardSummaryAsync() });

    [HttpGet("daily-collections")]
    [RequirePermission("receivables", "read")]
    public async Task<IActionResult> DailyCollections([FromQuery] int? zoneId, [FromQuery] DateTime? date)
        => Ok(new { success = true, data = await _service.GetDailyCollectionsAsync(zoneId, date) });

    [HttpGet("daily-collections/excel")]
    [RequirePermission("receivables", "read")]
    public async Task<IActionResult> DailyCollectionsExcel([FromQuery] int? zoneId, [FromQuery] DateTime? date)
    {
        var bytes = await _service.ExportDailyCollectionsToExcelAsync(zoneId, date);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"cobros-dia-{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("daily-collections/pdf")]
    [RequirePermission("receivables", "read")]
    public async Task<IActionResult> DailyCollectionsPdf([FromQuery] int? zoneId, [FromQuery] DateTime? date)
    {
        var bytes = await _service.ExportDailyCollectionsToPdfAsync(zoneId, date);
        return File(bytes, "application/pdf", $"cobros-dia-{DateTime.Now:yyyyMMdd}.pdf");
    }

    [HttpGet("{reportType}/excel")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> ExportExcel(string reportType, [FromQuery] ReportQueryDto query)
    {
        var bytes = await _service.ExportToExcelAsync(reportType, query);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{reportType}-{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("{reportType}/pdf")]
    [RequirePermission("reports", "read")]
    public async Task<IActionResult> ExportPdf(string reportType, [FromQuery] ReportQueryDto query)
    {
        var bytes = await _service.ExportToPdfAsync(reportType, query);
        return File(bytes, "application/pdf", $"{reportType}-{DateTime.Now:yyyyMMdd}.pdf");
    }
}
