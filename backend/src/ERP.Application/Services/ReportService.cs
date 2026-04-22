using ERP.Application.DTOs.Reports;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;

namespace ERP.Application.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;
    public ReportService(AppDbContext db) { _db = db; }

    public async Task<SalesByPeriodReportDto> GetSalesByPeriodAsync(ReportQueryDto q)
    {
        var invoices = await _db.SalesInvoices
            .Where(i => i.InvoiceDate >= q.DateFrom && i.InvoiceDate <= q.DateTo && i.Status != "cancelled")
            .ToListAsync();
        var byDay = invoices.GroupBy(i => i.InvoiceDate.Date)
            .Select(g => new SalesByPeriodItemDto(g.Key, g.Count(), g.Sum(i => i.Total)))
            .OrderBy(x => x.Date);
        return new SalesByPeriodReportDto(q.DateFrom, q.DateTo, invoices.Count,
            invoices.Sum(i => i.Total), invoices.Sum(i => i.VatAmount),
            invoices.Sum(i => i.TaxableBase), byDay);
    }

    public async Task<SalesBySellerReportDto> GetSalesBySellerAsync(ReportQueryDto q)
    {
        var invoices = await _db.SalesInvoices.Include(i => i.Seller)
            .Where(i => i.InvoiceDate >= q.DateFrom && i.InvoiceDate <= q.DateTo && i.Status != "cancelled")
            .ToListAsync();
        var bySeller = invoices.GroupBy(i => new { i.SellerId, Name = i.Seller != null ? $"{i.Seller.FirstName} {i.Seller.LastName}" : "Sin vendedor" })
            .Select(g => new SellerSalesDto(g.Key.SellerId ?? 0, g.Key.Name, g.Count(), g.Sum(i => i.Total), g.Select(i => i.ClientId).Distinct().Count()));
        return new SalesBySellerReportDto(q.DateFrom, q.DateTo, bySeller);
    }

    public async Task<SalesByClientReportDto> GetSalesByClientAsync(ReportQueryDto q)
    {
        var invoices = await _db.SalesInvoices.Include(i => i.Client)
            .Where(i => i.InvoiceDate >= q.DateFrom && i.InvoiceDate <= q.DateTo && i.Status != "cancelled")
            .ToListAsync();
        var byClient = invoices.GroupBy(i => new { i.ClientId, i.Client.BusinessName, i.Client.Cuit })
            .Select(g => new ClientSalesDto(g.Key.ClientId, g.Key.BusinessName, g.Key.Cuit,
                g.Count(), g.Sum(i => i.Total), g.Sum(i => i.BalanceDue)));
        return new SalesByClientReportDto(q.DateFrom, q.DateTo, byClient);
    }

    public async Task<StockReportDto> GetStockReportAsync(ReportQueryDto q)
    {
        var products = await _db.Products.Include(p => p.Category)
            .Include(p => p.StockEntries).ThenInclude(s => s.StockLocation).ToListAsync();
        var items = products.Select(p =>
        {
            var total = p.StockEntries.Sum(s => s.Quantity);
            var value = total * p.AveragePurchasePrice;
            return new StockReportItemDto(p.Id, p.Code, p.Name, p.Category?.Name, total, p.MinimumStock, total < p.MinimumStock,
                p.AveragePurchasePrice, value, p.StockEntries.Select(s => new StockLocationValueDto(s.StockLocation.Name, s.Quantity, s.Quantity * p.AveragePurchasePrice)));
        });
        return new StockReportDto(items, items.Sum(i => i.TotalValue));
    }

    public async Task<byte[]> ExportToExcelAsync(string reportType, ReportQueryDto query)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add(reportType);
        switch (reportType)
        {
            case "sales-by-period":
                var salesReport = await GetSalesByPeriodAsync(query);
                ws.Cell(1, 1).Value = "Fecha"; ws.Cell(1, 2).Value = "Cantidad"; ws.Cell(1, 3).Value = "Total";
                ws.Row(1).Style.Font.Bold = true;
                var row = 2;
                foreach (var item in salesReport.Items) { ws.Cell(row, 1).Value = item.Date.ToShortDateString(); ws.Cell(row, 2).Value = item.InvoiceCount; ws.Cell(row, 3).Value = (double)item.Amount; row++; }
                break;
            case "stock":
                var stockReport = await GetStockReportAsync(query);
                ws.Cell(1, 1).Value = "Código"; ws.Cell(1, 2).Value = "Producto"; ws.Cell(1, 3).Value = "Stock Total"; ws.Cell(1, 4).Value = "Valor";
                ws.Row(1).Style.Font.Bold = true;
                var rowS = 2;
                foreach (var item in stockReport.Items) { ws.Cell(rowS, 1).Value = item.ProductCode; ws.Cell(rowS, 2).Value = item.ProductName; ws.Cell(rowS, 3).Value = (double)item.TotalStock; ws.Cell(rowS, 4).Value = (double)item.TotalValue; rowS++; }
                break;
        }
        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public Task<byte[]> ExportToPdfAsync(string reportType, ReportQueryDto query)
        => Task.FromResult(Array.Empty<byte>());
}
