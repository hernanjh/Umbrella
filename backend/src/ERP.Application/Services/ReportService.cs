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

    public async Task<PaymentsReportDto> GetPaymentsReportAsync(ReportQueryDto q)
    {
        var salesQ = _db.SalesPayments.Include(p => p.PaymentMethod).Include(p => p.SalesInvoice).ThenInclude(i => i.Client)
            .Where(p => p.PaymentDate >= q.DateFrom && p.PaymentDate <= q.DateTo);
        if (q.PaymentMethodId.HasValue) salesQ = salesQ.Where(p => p.PaymentMethodId == q.PaymentMethodId);
        if (q.ClientId.HasValue) salesQ = salesQ.Where(p => p.SalesInvoice.ClientId == q.ClientId);
        var salesPayments = await salesQ.ToListAsync();

        var purchaseQ = _db.PurchasePayments.Include(p => p.PaymentMethod).Include(p => p.PurchaseInvoice).ThenInclude(i => i.Supplier)
            .Where(p => p.PaymentDate >= q.DateFrom && p.PaymentDate <= q.DateTo);
        if (q.PaymentMethodId.HasValue) purchaseQ = purchaseQ.Where(p => p.PaymentMethodId == q.PaymentMethodId);
        if (q.SupplierId.HasValue) purchaseQ = purchaseQ.Where(p => p.PurchaseInvoice.SupplierId == q.SupplierId);
        var purchasePayments = await purchaseQ.ToListAsync();

        var items = salesPayments.Select(p => new PaymentsReportItemDto(
                p.Id, "sales", p.PaymentDate, p.SalesInvoice.Client.BusinessName, p.SalesInvoice.FullNumber,
                p.PaymentMethod.Name, p.PaymentMethod.AffectsCash, p.Amount, p.Reference, p.CreatedBy))
            .Concat(purchasePayments.Select(p => new PaymentsReportItemDto(
                p.Id, "purchase", p.PaymentDate, p.PurchaseInvoice.Supplier.BusinessName, p.PurchaseInvoice.FullNumber,
                p.PaymentMethod.Name, p.PaymentMethod.AffectsCash, p.Amount, p.Reference, p.CreatedBy)))
            .OrderByDescending(i => i.PaymentDate).ToList();

        var totalReceived = salesPayments.Sum(p => p.Amount);
        var totalPaid = purchasePayments.Sum(p => p.Amount);
        return new PaymentsReportDto(q.DateFrom, q.DateTo, items.Count, totalReceived, totalPaid, totalReceived - totalPaid, items);
    }

    public async Task<ReceivablesReportDto> GetReceivablesReportAsync()
    {
        var today = DateTime.UtcNow.Date;
        var invoices = await _db.SalesInvoices.Include(i => i.Client)
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid") && i.BalanceDue > 0)
            .ToListAsync();
        var groups = invoices.GroupBy(i => i.Client);
        var items = groups.Select(g => new ReceivableItemDto(
                g.Key.Id, g.Key.Code, g.Key.BusinessName, g.Key.Cuit, g.Key.Phone,
                g.Count(i => i.DueDate < today),
                g.Where(i => i.DueDate < today).Sum(i => i.BalanceDue),
                g.Count(i => i.DueDate >= today),
                g.Where(i => i.DueDate >= today).Sum(i => i.BalanceDue),
                g.Sum(i => i.BalanceDue),
                g.Min(i => (DateTime?)i.InvoiceDate)))
            .OrderByDescending(r => r.TotalDue)
            .ToList();
        return new ReceivablesReportDto(items.Count, items.Sum(r => r.TotalDue), items.Sum(r => r.OverdueAmount), items);
    }

    public async Task<PayablesReportDto> GetPayablesReportAsync()
    {
        var today = DateTime.UtcNow.Date;
        var invoices = await _db.PurchaseInvoices.Include(i => i.Supplier)
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid") && i.BalanceDue > 0)
            .ToListAsync();
        var groups = invoices.GroupBy(i => i.Supplier);
        var items = groups.Select(g => new PayableItemDto(
                g.Key.Id, g.Key.Code, g.Key.BusinessName, g.Key.Cuit,
                g.Count(i => i.DueDate < today),
                g.Where(i => i.DueDate < today).Sum(i => i.BalanceDue),
                g.Count(i => i.DueDate >= today),
                g.Where(i => i.DueDate >= today).Sum(i => i.BalanceDue),
                g.Sum(i => i.BalanceDue),
                g.Min(i => (DateTime?)i.InvoiceDate)))
            .OrderByDescending(r => r.TotalDue)
            .ToList();
        return new PayablesReportDto(items.Count, items.Sum(r => r.TotalDue), items.Sum(r => r.OverdueAmount), items);
    }

    public async Task<CashReportDto> GetCashReportAsync(ReportQueryDto q)
    {
        var movements = await _db.CashMovements.Include(m => m.PaymentMethod)
            .Where(m => m.MovementDate >= q.DateFrom && m.MovementDate <= q.DateTo)
            .ToListAsync();
        var totalIncome = movements.Where(m => m.Type == "income" || m.Type == "opening").Sum(m => m.Amount);
        var totalExpense = movements.Where(m => m.Type == "expense").Sum(m => m.Amount);
        var byDay = movements.GroupBy(m => m.MovementDate.Date)
            .Select(g => new CashReportDayDto(g.Key,
                g.Where(m => m.Type == "income" || m.Type == "opening").Sum(m => m.Amount),
                g.Where(m => m.Type == "expense").Sum(m => m.Amount),
                g.Where(m => m.Type == "income" || m.Type == "opening").Sum(m => m.Amount) - g.Where(m => m.Type == "expense").Sum(m => m.Amount)))
            .OrderBy(d => d.Date);
        var byMethod = movements.Where(m => m.PaymentMethod != null).GroupBy(m => m.PaymentMethod!.Name)
            .Select(g => new PaymentMethodSummaryDto(g.Key,
                g.Where(m => m.Type == "income").Sum(m => m.Amount),
                g.Where(m => m.Type == "expense").Sum(m => m.Amount)));
        return new CashReportDto(q.DateFrom, q.DateTo, totalIncome, totalExpense, totalIncome - totalExpense, byDay, byMethod);
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var receivables = await _db.SalesInvoices
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid") && i.BalanceDue > 0)
            .ToListAsync();
        var payables = await _db.PurchaseInvoices
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid") && i.BalanceDue > 0)
            .ToListAsync();
        var session = await _db.CashSessions.Include(s => s.Movements)
            .FirstOrDefaultAsync(s => s.Status == "open");
        decimal cashBalance = 0;
        if (session != null)
        {
            var active = session.Movements.Where(m => !m.IsDeleted);
            cashBalance = active.Where(m => m.Type == "income" || m.Type == "opening").Sum(m => m.Amount)
                - active.Where(m => m.Type == "expense").Sum(m => m.Amount)
                + active.Where(m => m.Type == "adjustment").Sum(m => m.Amount);
        }
        var overdue = receivables.Where(i => i.DueDate < today).ToList();
        return new DashboardSummaryDto(
            receivables.Sum(i => i.BalanceDue),
            payables.Sum(i => i.BalanceDue),
            cashBalance,
            overdue.Count,
            overdue.Sum(i => i.BalanceDue),
            session?.Id ?? 0,
            session?.Code,
            session?.OpeningDate);
    }
}
