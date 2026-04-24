using ERP.Application.DTOs.Reports;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ERP.Application.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserContext _user;

    public ReportService(AppDbContext db, ICurrentUserContext user) { _db = db; _user = user; }

    // Apply seller zone scope on a query over SalesInvoices
    private IQueryable<Domain.Entities.SalesInvoice> ScopeSales(IQueryable<Domain.Entities.SalesInvoice> q)
        => _user.IsZoneScoped ? q.Where(i => i.Client.ZoneId == _user.ZoneId) : q;

    public async Task<SalesByPeriodReportDto> GetSalesByPeriodAsync(ReportQueryDto q)
    {
        var invoices = await ScopeSales(_db.SalesInvoices
            .Include(i => i.Client)
            .Where(i => i.InvoiceDate >= q.DateFrom && i.InvoiceDate <= q.DateTo && i.Status != "cancelled"))
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
        var invoices = await ScopeSales(_db.SalesInvoices.Include(i => i.Seller).Include(i => i.Client)
            .Where(i => i.InvoiceDate >= q.DateFrom && i.InvoiceDate <= q.DateTo && i.Status != "cancelled"))
            .ToListAsync();
        var bySeller = invoices.GroupBy(i => new { i.SellerId, Name = i.Seller != null ? $"{i.Seller.FirstName} {i.Seller.LastName}" : "Sin vendedor" })
            .Select(g => new SellerSalesDto(g.Key.SellerId ?? 0, g.Key.Name, g.Count(), g.Sum(i => i.Total), g.Select(i => i.ClientId).Distinct().Count()));
        return new SalesBySellerReportDto(q.DateFrom, q.DateTo, bySeller);
    }

    public async Task<SalesByClientReportDto> GetSalesByClientAsync(ReportQueryDto q)
    {
        var invoices = await ScopeSales(_db.SalesInvoices.Include(i => i.Client)
            .Where(i => i.InvoiceDate >= q.DateFrom && i.InvoiceDate <= q.DateTo && i.Status != "cancelled"))
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

    public async Task<PaymentsReportDto> GetPaymentsReportAsync(ReportQueryDto q)
    {
        var salesQ = _db.SalesPayments.Include(p => p.PaymentMethod).Include(p => p.SalesInvoice).ThenInclude(i => i.Client)
            .Where(p => p.PaymentDate >= q.DateFrom && p.PaymentDate <= q.DateTo);
        if (q.PaymentMethodId.HasValue) salesQ = salesQ.Where(p => p.PaymentMethodId == q.PaymentMethodId);
        if (q.ClientId.HasValue) salesQ = salesQ.Where(p => p.SalesInvoice.ClientId == q.ClientId);
        if (_user.IsZoneScoped) salesQ = salesQ.Where(p => p.SalesInvoice.Client.ZoneId == _user.ZoneId);
        var salesPayments = await salesQ.ToListAsync();

        var purchaseQ = _db.PurchasePayments.Include(p => p.PaymentMethod).Include(p => p.PurchaseInvoice).ThenInclude(i => i.Supplier)
            .Where(p => p.PaymentDate >= q.DateFrom && p.PaymentDate <= q.DateTo);
        if (q.PaymentMethodId.HasValue) purchaseQ = purchaseQ.Where(p => p.PaymentMethodId == q.PaymentMethodId);
        if (q.SupplierId.HasValue) purchaseQ = purchaseQ.Where(p => p.PurchaseInvoice.SupplierId == q.SupplierId);
        // Sellers don't see purchase payments
        var purchasePayments = _user.IsZoneScoped
            ? new List<Domain.Entities.PurchasePayment>()
            : await purchaseQ.ToListAsync();

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
        var baseQ = _db.SalesInvoices.Include(i => i.Client)
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid") && i.BalanceDue > 0);
        if (_user.IsZoneScoped) baseQ = baseQ.Where(i => i.Client.ZoneId == _user.ZoneId);
        var invoices = await baseQ.ToListAsync();
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
        var recQ = _db.SalesInvoices.Include(i => i.Client)
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid") && i.BalanceDue > 0);
        if (_user.IsZoneScoped) recQ = recQ.Where(i => i.Client.ZoneId == _user.ZoneId);
        var receivables = await recQ.ToListAsync();
        var payables = _user.IsZoneScoped
            ? new List<Domain.Entities.PurchaseInvoice>()
            : await _db.PurchaseInvoices
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

        var instQ = _db.SalesInstallments.Include(i => i.Plan).ThenInclude(p => p.SalesInvoice).ThenInclude(si => si.Client)
            .Where(i => i.DueDate < today && i.Status != "paid" && i.Plan.Status == "active");
        if (_user.IsZoneScoped) instQ = instQ.Where(i => i.Plan.SalesInvoice.Client.ZoneId == _user.ZoneId);
        var overdueInstallments = await instQ.ToListAsync();

        return new DashboardSummaryDto(
            receivables.Sum(i => i.BalanceDue),
            payables.Sum(i => i.BalanceDue),
            cashBalance,
            overdue.Count,
            overdue.Sum(i => i.BalanceDue),
            session?.Id ?? 0,
            session?.Code,
            session?.OpeningDate,
            overdueInstallments.Count,
            overdueInstallments.Sum(i => i.Amount - i.PaidAmount));
    }

    // =====================================================================
    // Daily collections sheet (cobros del día por zona)
    // =====================================================================

    public async Task<DailyCollectionsReportDto> GetDailyCollectionsAsync(int? zoneId, DateTime? date)
    {
        var targetDate = (date ?? DateTime.UtcNow).Date;
        var upcomingWindow = targetDate.AddDays(7); // next 7 days

        // Seller-scope overrides zone param
        if (_user.IsZoneScoped) zoneId = _user.ZoneId;

        // Pull active receivable invoices in zone
        var invoicesQ = _db.SalesInvoices
            .Include(i => i.Client).ThenInclude(c => c.Zone)
            .Include(i => i.Client).ThenInclude(c => c.AssignedSeller)
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid") && i.BalanceDue > 0);
        if (zoneId.HasValue) invoicesQ = invoicesQ.Where(i => i.Client.ZoneId == zoneId);
        var invoices = await invoicesQ.ToListAsync();

        var invoiceIds = invoices.Select(i => i.Id).ToHashSet();

        var installmentsQ = _db.SalesInstallments
            .Include(s => s.Plan).ThenInclude(p => p.SalesInvoice).ThenInclude(si => si.Client).ThenInclude(c => c.Zone)
            .Where(s => s.Status != "paid" && s.Plan.Status == "active" && s.DueDate <= upcomingWindow);
        if (zoneId.HasValue) installmentsQ = installmentsQ.Where(s => s.Plan.SalesInvoice.Client.ZoneId == zoneId);
        var installments = await installmentsQ.ToListAsync();

        var invoicesWithInstallments = installments.Select(i => i.Plan.SalesInvoiceId).ToHashSet();

        // Group everything by client
        var clientIds = invoices.Select(i => i.ClientId)
            .Concat(installments.Select(s => s.Plan.SalesInvoice.ClientId))
            .Distinct().ToList();
        var clients = await _db.Clients
            .Include(c => c.Zone)
            .Include(c => c.AssignedSeller)
            .Where(c => clientIds.Contains(c.Id))
            .ToListAsync();

        var result = new List<DailyCollectionClientDto>();

        foreach (var client in clients.OrderBy(c => c.BusinessName))
        {
            var clientInvoices = invoices.Where(i => i.ClientId == client.Id).ToList();
            var clientInstallments = installments.Where(s => s.Plan.SalesInvoice.ClientId == client.Id).ToList();

            var overdueInst = clientInstallments
                .Where(s => s.DueDate.Date < targetDate)
                .OrderBy(s => s.DueDate)
                .Select(s => new DailyCollectionInstallmentLineDto(
                    s.Id, s.SalesInstallmentPlanId, s.Plan.Code, s.Plan.SalesInvoiceId, s.Plan.SalesInvoice.FullNumber,
                    s.SequenceNumber, s.DueDate, s.Amount, s.PaidAmount, s.Amount - s.PaidAmount,
                    (int)(targetDate - s.DueDate.Date).TotalDays))
                .ToList();

            var upcomingInst = clientInstallments
                .Where(s => s.DueDate.Date >= targetDate && s.DueDate.Date <= upcomingWindow)
                .OrderBy(s => s.DueDate)
                .Select(s => new DailyCollectionInstallmentLineDto(
                    s.Id, s.SalesInstallmentPlanId, s.Plan.Code, s.Plan.SalesInvoiceId, s.Plan.SalesInvoice.FullNumber,
                    s.SequenceNumber, s.DueDate, s.Amount, s.PaidAmount, s.Amount - s.PaidAmount, 0))
                .ToList();

            // Invoices overdue that don't have an installment plan (raw unpaid invoices)
            var rawUnpaid = clientInvoices
                .Where(i => !invoicesWithInstallments.Contains(i.Id))
                .Where(i => i.DueDate.Date < targetDate)
                .OrderBy(i => i.DueDate)
                .Select(i => new DailyCollectionInvoiceLineDto(
                    i.Id, i.FullNumber, i.InvoiceDate, i.DueDate, i.Total, i.BalanceDue,
                    (int)(targetDate - i.DueDate.Date).TotalDays))
                .ToList();

            var overdueAmount = overdueInst.Sum(x => x.BalanceDue) + rawUnpaid.Sum(x => x.BalanceDue);
            var upcomingAmount = upcomingInst.Sum(x => x.BalanceDue);
            var totalToCollect = overdueAmount + upcomingAmount;

            // Only include clients who actually have something to collect in window
            if (totalToCollect <= 0 && overdueInst.Count == 0 && rawUnpaid.Count == 0 && upcomingInst.Count == 0)
                continue;

            result.Add(new DailyCollectionClientDto(
                client.Id, client.Code, client.BusinessName, client.Phone, client.Mobile,
                client.Address, client.City, client.Cuit,
                client.ZoneId, client.Zone?.Name,
                client.AssignedSeller != null ? $"{client.AssignedSeller.FirstName} {client.AssignedSeller.LastName}" : null,
                client.CurrentBalance,
                overdueInst, upcomingInst, rawUnpaid,
                totalToCollect, overdueAmount, upcomingAmount));
        }

        string? zoneName = null;
        if (zoneId.HasValue)
            zoneName = await _db.Zones.Where(z => z.Id == zoneId).Select(z => z.Name).FirstOrDefaultAsync();

        return new DailyCollectionsReportDto(
            targetDate, zoneId, zoneName,
            result.Count,
            result.Sum(c => c.TotalToCollect),
            result.Sum(c => c.OverdueAmount),
            result.Sum(c => c.UpcomingAmount),
            result);
    }

    public async Task<byte[]> ExportDailyCollectionsToExcelAsync(int? zoneId, DateTime? date)
    {
        var data = await GetDailyCollectionsAsync(zoneId, date);
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Cobros del día");

        // Header
        ws.Cell(1, 1).Value = "PLANILLA DE COBROS DEL DÍA";
        ws.Range(1, 1, 1, 12).Merge().Style.Font.Bold = true;
        ws.Row(1).Style.Font.FontSize = 14;
        ws.Cell(2, 1).Value = "Fecha:";
        ws.Cell(2, 2).Value = data.Date.ToString("dd/MM/yyyy");
        ws.Cell(2, 4).Value = "Zona:";
        ws.Cell(2, 5).Value = data.ZoneName ?? "Todas";
        ws.Cell(2, 7).Value = "Total a cobrar:";
        ws.Cell(2, 8).Value = (double)data.TotalToCollect;
        ws.Cell(2, 8).Style.NumberFormat.Format = "$ #,##0.00";

        var row = 4;
        ws.Cell(row, 1).Value = "Código";
        ws.Cell(row, 2).Value = "Cliente";
        ws.Cell(row, 3).Value = "CUIT";
        ws.Cell(row, 4).Value = "Dirección";
        ws.Cell(row, 5).Value = "Ciudad";
        ws.Cell(row, 6).Value = "Teléfono";
        ws.Cell(row, 7).Value = "Vendedor";
        ws.Cell(row, 8).Value = "Factura";
        ws.Cell(row, 9).Value = "Cuota / Comprob.";
        ws.Cell(row, 10).Value = "Vencimiento";
        ws.Cell(row, 11).Value = "Días";
        ws.Cell(row, 12).Value = "Saldo";
        ws.Cell(row, 13).Value = "Monto cobrado";
        ws.Cell(row, 14).Value = "Forma de pago";
        ws.Cell(row, 15).Value = "Observaciones";
        ws.Range(row, 1, row, 15).Style.Font.Bold = true;
        ws.Range(row, 1, row, 15).Style.Fill.BackgroundColor = XLColor.LightGray;
        row++;

        foreach (var client in data.Clients)
        {
            // Client header row
            ws.Cell(row, 1).Value = client.ClientCode;
            ws.Cell(row, 2).Value = client.BusinessName;
            ws.Cell(row, 3).Value = client.Cuit ?? "";
            ws.Cell(row, 4).Value = client.Address ?? "";
            ws.Cell(row, 5).Value = client.City ?? "";
            ws.Cell(row, 6).Value = client.Phone ?? client.Mobile ?? "";
            ws.Cell(row, 7).Value = client.AssignedSellerName ?? "";
            ws.Range(row, 1, row, 15).Style.Fill.BackgroundColor = XLColor.LightBlue;
            ws.Range(row, 1, row, 15).Style.Font.Bold = true;
            row++;

            foreach (var inst in client.OverdueInstallments)
            {
                ws.Cell(row, 8).Value = inst.InvoiceFullNumber;
                ws.Cell(row, 9).Value = $"Cuota {inst.SequenceNumber} ({inst.PlanCode})";
                ws.Cell(row, 10).Value = inst.DueDate.ToString("dd/MM/yyyy");
                ws.Cell(row, 11).Value = inst.DaysOverdue;
                ws.Cell(row, 11).Style.Font.FontColor = XLColor.Red;
                ws.Cell(row, 12).Value = (double)inst.BalanceDue;
                ws.Cell(row, 12).Style.NumberFormat.Format = "$ #,##0.00";
                row++;
            }
            foreach (var inv in client.UnpaidInvoices)
            {
                ws.Cell(row, 8).Value = inv.FullNumber;
                ws.Cell(row, 9).Value = "Factura vencida";
                ws.Cell(row, 10).Value = inv.DueDate.ToString("dd/MM/yyyy");
                ws.Cell(row, 11).Value = inv.DaysOverdue;
                ws.Cell(row, 11).Style.Font.FontColor = XLColor.Red;
                ws.Cell(row, 12).Value = (double)inv.BalanceDue;
                ws.Cell(row, 12).Style.NumberFormat.Format = "$ #,##0.00";
                row++;
            }
            foreach (var inst in client.UpcomingInstallments)
            {
                ws.Cell(row, 8).Value = inst.InvoiceFullNumber;
                ws.Cell(row, 9).Value = $"Cuota {inst.SequenceNumber} ({inst.PlanCode})";
                ws.Cell(row, 10).Value = inst.DueDate.ToString("dd/MM/yyyy");
                ws.Cell(row, 11).Value = 0;
                ws.Cell(row, 12).Value = (double)inst.BalanceDue;
                ws.Cell(row, 12).Style.NumberFormat.Format = "$ #,##0.00";
                row++;
            }
            // Client subtotal
            ws.Cell(row, 11).Value = "Total cliente:";
            ws.Cell(row, 12).Value = (double)client.TotalToCollect;
            ws.Range(row, 11, row, 12).Style.Font.Bold = true;
            ws.Cell(row, 12).Style.NumberFormat.Format = "$ #,##0.00";
            ws.Cell(row, 12).Style.Font.FontColor = XLColor.DarkBlue;
            row++;
        }

        // Grand total
        row++;
        ws.Cell(row, 11).Value = "TOTAL GENERAL:";
        ws.Cell(row, 12).Value = (double)data.TotalToCollect;
        ws.Range(row, 11, row, 12).Style.Font.Bold = true;
        ws.Cell(row, 12).Style.NumberFormat.Format = "$ #,##0.00";
        ws.Cell(row, 12).Style.Fill.BackgroundColor = XLColor.Yellow;

        ws.Columns().AdjustToContents();
        ws.Column(13).Width = 15;
        ws.Column(14).Width = 15;
        ws.Column(15).Width = 25;

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> ExportDailyCollectionsToPdfAsync(int? zoneId, DateTime? date)
    {
        var data = await GetDailyCollectionsAsync(zoneId, date);
        QuestPDF.Settings.License = LicenseType.Community;

        var bytes = Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(s => s.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text("PLANILLA DE COBROS DEL DÍA").FontSize(16).Bold();
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text($"Fecha: {data.Date:dd/MM/yyyy}");
                        r.RelativeItem().Text($"Zona: {data.ZoneName ?? "Todas"}");
                        r.RelativeItem().Text($"Total a cobrar: $ {data.TotalToCollect:N2}").AlignRight().Bold();
                    });
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    foreach (var client in data.Clients)
                    {
                        col.Item().PaddingTop(8).BorderBottom(1).PaddingBottom(2).Row(r =>
                        {
                            r.RelativeItem(4).Text(t =>
                            {
                                t.Span(client.BusinessName).Bold();
                                t.Span($"   [{client.ClientCode}]").FontColor(Colors.Grey.Darken1);
                                if (!string.IsNullOrEmpty(client.Cuit)) t.Span($"   CUIT: {client.Cuit}");
                            });
                            r.RelativeItem(2).AlignRight().Text($"Total: $ {client.TotalToCollect:N2}").Bold();
                        });
                        col.Item().Text(t =>
                        {
                            var contact = new List<string>();
                            if (!string.IsNullOrEmpty(client.Address)) contact.Add(client.Address);
                            if (!string.IsNullOrEmpty(client.City)) contact.Add(client.City);
                            if (!string.IsNullOrEmpty(client.Phone)) contact.Add("Tel: " + client.Phone);
                            else if (!string.IsNullOrEmpty(client.Mobile)) contact.Add("Cel: " + client.Mobile);
                            if (!string.IsNullOrEmpty(client.AssignedSellerName)) contact.Add("Vend: " + client.AssignedSellerName);
                            t.Span(string.Join("  ·  ", contact)).FontSize(8).FontColor(Colors.Grey.Darken1);
                        });

                        col.Item().PaddingTop(3).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(90);  // Factura
                                c.ConstantColumn(130); // Cuota
                                c.ConstantColumn(60);  // Vto
                                c.ConstantColumn(40);  // Días
                                c.ConstantColumn(70);  // Saldo
                                c.ConstantColumn(80);  // Monto cobrado
                                c.ConstantColumn(80);  // Forma de pago
                                c.RelativeColumn();    // Observaciones
                            });

                            table.Header(h =>
                            {
                                void H(string s) => h.Cell().Background(Colors.Grey.Lighten3).Padding(2).Text(s).Bold().FontSize(8);
                                H("Factura"); H("Cuota/Comp."); H("Vto"); H("Días"); H("Saldo"); H("Cobrado"); H("Forma pago"); H("Obs.");
                            });

                            void Row(string factura, string cuota, string vto, string dias, decimal saldo, bool overdue)
                            {
                                table.Cell().Padding(2).Text(factura).FontSize(8);
                                table.Cell().Padding(2).Text(cuota).FontSize(8);
                                table.Cell().Padding(2).Text(vto).FontSize(8);
                                table.Cell().Padding(2).Text(txt => { var s = txt.Span(dias).FontSize(8); if (overdue) s.FontColor(Colors.Red.Medium).Bold(); });
                                table.Cell().Padding(2).AlignRight().Text($"$ {saldo:N2}").FontSize(8);
                                table.Cell().Padding(2).BorderBottom(0.5f); // writable
                                table.Cell().Padding(2).BorderBottom(0.5f); // writable
                                table.Cell().Padding(2).BorderBottom(0.5f); // writable
                            }

                            foreach (var i in client.OverdueInstallments)
                                Row(i.InvoiceFullNumber, $"Cuota {i.SequenceNumber}", i.DueDate.ToString("dd/MM/yy"), i.DaysOverdue.ToString(), i.BalanceDue, true);
                            foreach (var inv in client.UnpaidInvoices)
                                Row(inv.FullNumber, "Vencida", inv.DueDate.ToString("dd/MM/yy"), inv.DaysOverdue.ToString(), inv.BalanceDue, true);
                            foreach (var i in client.UpcomingInstallments)
                                Row(i.InvoiceFullNumber, $"Cuota {i.SequenceNumber}", i.DueDate.ToString("dd/MM/yy"), "—", i.BalanceDue, false);
                        });
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Página ");
                    t.CurrentPageNumber();
                    t.Span(" de ");
                    t.TotalPages();
                });
            });
        }).GeneratePdf();

        return bytes;
    }

    // =====================================================================
    // Detailed sales report (every invoice line with client/seller/zone/product/installments)
    // =====================================================================
    public async Task<DetailedSalesReportDto> GetDetailedSalesAsync(ReportQueryDto q, int? zoneId = null)
    {
        if (_user.IsZoneScoped) zoneId = _user.ZoneId;

        var invQ = _db.SalesInvoices
            .Include(i => i.Client).ThenInclude(c => c.Zone)
            .Include(i => i.Seller)
            .Include(i => i.PaymentCondition)
            .Include(i => i.Items).ThenInclude(it => it.Product).ThenInclude(p => p.Category)
            .Where(i => i.InvoiceDate >= q.DateFrom && i.InvoiceDate <= q.DateTo && i.Status != "cancelled" && i.Status != "draft");
        if (zoneId.HasValue) invQ = invQ.Where(i => i.Client.ZoneId == zoneId);
        if (q.ClientId.HasValue) invQ = invQ.Where(i => i.ClientId == q.ClientId);
        if (q.SellerId.HasValue) invQ = invQ.Where(i => i.SellerId == q.SellerId);
        var invoices = await invQ.OrderBy(i => i.InvoiceDate).ThenBy(i => i.FullNumber).ToListAsync();

        var invoiceIds = invoices.Select(i => i.Id).ToList();
        var plans = await _db.SalesInstallmentPlans
            .Include(p => p.Installments)
            .Where(p => invoiceIds.Contains(p.SalesInvoiceId))
            .ToListAsync();
        var today = DateTime.UtcNow.Date;
        var planByInvoice = plans.ToDictionary(p => p.SalesInvoiceId);

        var items = new List<DetailedSalesItemDto>();
        foreach (var inv in invoices)
        {
            planByInvoice.TryGetValue(inv.Id, out var plan);
            var overdue = plan?.Installments.Where(ins => !ins.IsDeleted && ins.DueDate.Date < today && ins.Status != "paid").ToList();
            foreach (var it in inv.Items.Where(it => !it.IsDeleted))
            {
                items.Add(new DetailedSalesItemDto(
                    inv.InvoiceDate, inv.FullNumber, inv.InvoiceType, inv.Status,
                    inv.ClientId, inv.Client.Code, inv.Client.BusinessName, inv.Client.Cuit,
                    inv.Client.Zone?.Name,
                    inv.Seller != null ? $"{inv.Seller.FirstName} {inv.Seller.LastName}" : null,
                    inv.PaymentCondition?.Name,
                    it.Product?.Code ?? "",
                    !string.IsNullOrEmpty(it.ProductName) ? it.ProductName : (it.Product?.Name ?? ""),
                    it.Product?.Category?.Name,
                    it.Product?.Brand,
                    it.Quantity, it.Product?.Unit ?? "un",
                    it.UnitPrice, it.DiscountAmount, it.Subtotal, it.VatAmount, it.Total,
                    inv.Total, inv.BalanceDue,
                    plan != null,
                    plan?.NumberOfInstallments,
                    plan?.Frequency,
                    overdue?.Count,
                    overdue?.Sum(i => i.Amount - i.PaidAmount)));
            }
        }

        return new DetailedSalesReportDto(
            q.DateFrom, q.DateTo,
            items.Count, invoices.Count,
            invoices.Sum(i => i.Total),
            invoices.Sum(i => i.BalanceDue),
            items);
    }

    // =====================================================================
    // Generic report exports (Excel with full columns, PDF as table)
    // =====================================================================

    public async Task<byte[]> ExportToExcelAsync(string reportType, ReportQueryDto query)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add(reportType);

        switch (reportType)
        {
            case "sales-by-period":
            {
                var r = await GetSalesByPeriodAsync(query);
                WriteTitle(ws, $"Ventas por período: {r.DateFrom:dd/MM/yyyy} a {r.DateTo:dd/MM/yyyy}", 4);
                Headers(ws, 3, "Fecha", "Cantidad de facturas", "Importe");
                var row = 4;
                foreach (var it in r.Items)
                {
                    ws.Cell(row, 1).Value = it.Date.ToString("dd/MM/yyyy");
                    ws.Cell(row, 2).Value = it.InvoiceCount;
                    ws.Cell(row, 3).Value = (double)it.Amount;
                    ws.Cell(row, 3).Style.NumberFormat.Format = "$ #,##0.00";
                    row++;
                }
                ws.Cell(row, 1).Value = "TOTAL";
                ws.Cell(row, 2).Value = r.TotalInvoices;
                ws.Cell(row, 3).Value = (double)r.TotalAmount;
                ws.Cell(row, 3).Style.NumberFormat.Format = "$ #,##0.00";
                ws.Range(row, 1, row, 3).Style.Font.Bold = true;
                break;
            }
            case "sales-by-seller":
            {
                var r = await GetSalesBySellerAsync(query);
                WriteTitle(ws, $"Ventas por vendedor: {r.DateFrom:dd/MM/yyyy} a {r.DateTo:dd/MM/yyyy}", 4);
                Headers(ws, 3, "Vendedor", "Facturas", "Clientes", "Importe");
                var row = 4;
                foreach (var it in r.Sellers)
                {
                    ws.Cell(row, 1).Value = it.SellerName;
                    ws.Cell(row, 2).Value = it.InvoiceCount;
                    ws.Cell(row, 3).Value = it.ClientCount;
                    ws.Cell(row, 4).Value = (double)it.TotalAmount;
                    ws.Cell(row, 4).Style.NumberFormat.Format = "$ #,##0.00";
                    row++;
                }
                break;
            }
            case "sales-by-client":
            {
                var r = await GetSalesByClientAsync(query);
                WriteTitle(ws, $"Ventas por cliente: {r.DateFrom:dd/MM/yyyy} a {r.DateTo:dd/MM/yyyy}", 5);
                Headers(ws, 3, "Cliente", "CUIT", "Facturas", "Importe", "Saldo pendiente");
                var row = 4;
                foreach (var it in r.Clients)
                {
                    ws.Cell(row, 1).Value = it.ClientName;
                    ws.Cell(row, 2).Value = it.Cuit ?? "";
                    ws.Cell(row, 3).Value = it.InvoiceCount;
                    ws.Cell(row, 4).Value = (double)it.TotalAmount;
                    ws.Cell(row, 5).Value = (double)it.BalanceDue;
                    ws.Cell(row, 4).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, 5).Style.NumberFormat.Format = "$ #,##0.00";
                    row++;
                }
                break;
            }
            case "stock":
            {
                var r = await GetStockReportAsync(query);
                WriteTitle(ws, "Estado de stock", 7);
                Headers(ws, 3, "Código", "Producto", "Categoría", "Stock", "Mínimo", "Costo prom.", "Valor total");
                var row = 4;
                foreach (var it in r.Items)
                {
                    ws.Cell(row, 1).Value = it.ProductCode;
                    ws.Cell(row, 2).Value = it.ProductName;
                    ws.Cell(row, 3).Value = it.CategoryName ?? "";
                    ws.Cell(row, 4).Value = (double)it.TotalStock;
                    ws.Cell(row, 5).Value = (double)it.MinimumStock;
                    ws.Cell(row, 6).Value = (double)it.AveragePurchasePrice;
                    ws.Cell(row, 7).Value = (double)it.TotalValue;
                    ws.Cell(row, 6).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, 7).Style.NumberFormat.Format = "$ #,##0.00";
                    if (it.BelowMinimum) ws.Range(row, 1, row, 7).Style.Fill.BackgroundColor = XLColor.LightPink;
                    row++;
                }
                ws.Cell(row, 6).Value = "Total:";
                ws.Cell(row, 7).Value = (double)r.TotalValue;
                ws.Cell(row, 7).Style.NumberFormat.Format = "$ #,##0.00";
                ws.Range(row, 1, row, 7).Style.Font.Bold = true;
                break;
            }
            case "payments":
            {
                var r = await GetPaymentsReportAsync(query);
                WriteTitle(ws, $"Pagos: {r.DateFrom:dd/MM/yyyy} a {r.DateTo:dd/MM/yyyy}", 7);
                Headers(ws, 3, "Fecha", "Tipo", "Cliente/Proveedor", "Comprob.", "Forma pago", "Importe", "Referencia");
                var row = 4;
                foreach (var it in r.Items)
                {
                    ws.Cell(row, 1).Value = it.PaymentDate.ToString("dd/MM/yyyy");
                    ws.Cell(row, 2).Value = it.Kind == "sales" ? "Venta" : "Compra";
                    ws.Cell(row, 3).Value = it.PartyName;
                    ws.Cell(row, 4).Value = it.InvoiceFullNumber;
                    ws.Cell(row, 5).Value = it.PaymentMethodName;
                    ws.Cell(row, 6).Value = (double)it.Amount;
                    ws.Cell(row, 7).Value = it.Reference ?? "";
                    ws.Cell(row, 6).Style.NumberFormat.Format = "$ #,##0.00";
                    row++;
                }
                ws.Cell(row, 5).Value = "Recibido:";
                ws.Cell(row, 6).Value = (double)r.TotalReceived;
                ws.Cell(row, 6).Style.NumberFormat.Format = "$ #,##0.00";
                ws.Range(row, 5, row, 6).Style.Font.Bold = true;
                row++;
                ws.Cell(row, 5).Value = "Pagado:";
                ws.Cell(row, 6).Value = (double)r.TotalPaid;
                ws.Cell(row, 6).Style.NumberFormat.Format = "$ #,##0.00";
                ws.Range(row, 5, row, 6).Style.Font.Bold = true;
                row++;
                ws.Cell(row, 5).Value = "Neto:";
                ws.Cell(row, 6).Value = (double)r.NetFlow;
                ws.Cell(row, 6).Style.NumberFormat.Format = "$ #,##0.00";
                ws.Range(row, 5, row, 6).Style.Font.Bold = true;
                break;
            }
            case "receivables":
            {
                var r = await GetReceivablesReportAsync();
                WriteTitle(ws, "Cuentas por cobrar", 8);
                Headers(ws, 3, "Código", "Cliente", "CUIT", "Teléfono", "Vencidas", "Importe vencido", "Pendientes", "Saldo total");
                var row = 4;
                foreach (var it in r.Items)
                {
                    ws.Cell(row, 1).Value = it.ClientCode;
                    ws.Cell(row, 2).Value = it.ClientName;
                    ws.Cell(row, 3).Value = it.Cuit ?? "";
                    ws.Cell(row, 4).Value = it.Phone ?? "";
                    ws.Cell(row, 5).Value = it.OverdueInvoices;
                    ws.Cell(row, 6).Value = (double)it.OverdueAmount;
                    ws.Cell(row, 7).Value = it.PendingInvoices;
                    ws.Cell(row, 8).Value = (double)it.TotalDue;
                    ws.Cell(row, 6).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, 8).Style.NumberFormat.Format = "$ #,##0.00";
                    row++;
                }
                break;
            }
            case "payables":
            {
                var r = await GetPayablesReportAsync();
                WriteTitle(ws, "Cuentas por pagar", 7);
                Headers(ws, 3, "Código", "Proveedor", "CUIT", "Vencidas", "Importe vencido", "Pendientes", "Saldo total");
                var row = 4;
                foreach (var it in r.Items)
                {
                    ws.Cell(row, 1).Value = it.SupplierCode;
                    ws.Cell(row, 2).Value = it.SupplierName;
                    ws.Cell(row, 3).Value = it.Cuit;
                    ws.Cell(row, 4).Value = it.OverdueInvoices;
                    ws.Cell(row, 5).Value = (double)it.OverdueAmount;
                    ws.Cell(row, 6).Value = it.PendingInvoices;
                    ws.Cell(row, 7).Value = (double)it.TotalDue;
                    ws.Cell(row, 5).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, 7).Style.NumberFormat.Format = "$ #,##0.00";
                    row++;
                }
                break;
            }
            case "cash":
            {
                var r = await GetCashReportAsync(query);
                WriteTitle(ws, $"Caja: {r.DateFrom:dd/MM/yyyy} a {r.DateTo:dd/MM/yyyy}", 4);
                Headers(ws, 3, "Fecha", "Ingresos", "Egresos", "Neto");
                var row = 4;
                foreach (var it in r.ByDay)
                {
                    ws.Cell(row, 1).Value = it.Date.ToString("dd/MM/yyyy");
                    ws.Cell(row, 2).Value = (double)it.Income;
                    ws.Cell(row, 3).Value = (double)it.Expense;
                    ws.Cell(row, 4).Value = (double)it.Net;
                    ws.Range(row, 2, row, 4).Style.NumberFormat.Format = "$ #,##0.00";
                    row++;
                }
                ws.Cell(row, 1).Value = "Totales";
                ws.Cell(row, 2).Value = (double)r.TotalIncome;
                ws.Cell(row, 3).Value = (double)r.TotalExpense;
                ws.Cell(row, 4).Value = (double)r.NetFlow;
                ws.Range(row, 2, row, 4).Style.NumberFormat.Format = "$ #,##0.00";
                ws.Range(row, 1, row, 4).Style.Font.Bold = true;
                break;
            }
            case "detailed-sales":
            {
                var r = await GetDetailedSalesAsync(query);
                WriteTitle(ws, $"Ventas detalladas: {r.DateFrom:dd/MM/yyyy} a {r.DateTo:dd/MM/yyyy}", 19);
                Headers(ws, 3,
                    "Fecha", "Factura", "Tipo", "Estado", "Cliente", "CUIT", "Zona", "Vendedor",
                    "Cond. pago", "Producto", "Categoría", "Marca", "Cant.", "Unidad",
                    "P. unit.", "Subtotal", "IVA", "Total línea", "Cuotas", "Vencidas");
                var row = 4;
                foreach (var it in r.Items)
                {
                    var c = 1;
                    ws.Cell(row, c++).Value = it.InvoiceDate.ToString("dd/MM/yyyy");
                    ws.Cell(row, c++).Value = it.InvoiceFullNumber;
                    ws.Cell(row, c++).Value = it.InvoiceType;
                    ws.Cell(row, c++).Value = it.Status;
                    ws.Cell(row, c++).Value = it.ClientName;
                    ws.Cell(row, c++).Value = it.ClientCuit ?? "";
                    ws.Cell(row, c++).Value = it.ZoneName ?? "";
                    ws.Cell(row, c++).Value = it.SellerName ?? "";
                    ws.Cell(row, c++).Value = it.PaymentConditionName ?? "";
                    ws.Cell(row, c++).Value = $"[{it.ProductCode}] {it.ProductName}";
                    ws.Cell(row, c++).Value = it.CategoryName ?? "";
                    ws.Cell(row, c++).Value = it.Brand ?? "";
                    ws.Cell(row, c++).Value = (double)it.Quantity;
                    ws.Cell(row, c++).Value = it.Unit;
                    ws.Cell(row, c).Value = (double)it.UnitPrice; ws.Cell(row, c++).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, c).Value = (double)it.LineSubtotal; ws.Cell(row, c++).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, c).Value = (double)it.LineVat; ws.Cell(row, c++).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, c).Value = (double)it.LineTotal; ws.Cell(row, c++).Style.NumberFormat.Format = "$ #,##0.00";
                    ws.Cell(row, c++).Value = it.HasInstallmentPlan ? $"{it.NumberOfInstallments} ({it.InstallmentFrequency})" : "—";
                    if ((it.OverdueInstallmentCount ?? 0) > 0)
                    {
                        ws.Cell(row, c).Value = $"{it.OverdueInstallmentCount} · $ {it.OverdueInstallmentAmount:N2}";
                        ws.Cell(row, c).Style.Font.FontColor = XLColor.Red;
                    }
                    else ws.Cell(row, c).Value = "—";
                    row++;
                }
                ws.Cell(row, 14).Value = "TOTALES:";
                ws.Cell(row, 18).Value = (double)r.TotalAmount;
                ws.Cell(row, 18).Style.NumberFormat.Format = "$ #,##0.00";
                ws.Range(row, 14, row, 18).Style.Font.Bold = true;
                break;
            }
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> ExportToPdfAsync(string reportType, ReportQueryDto query)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        // Build rows from report
        string title;
        List<string> headers;
        List<List<string>> rows;

        switch (reportType)
        {
            case "sales-by-period":
            {
                var r = await GetSalesByPeriodAsync(query);
                title = $"Ventas por período ({r.DateFrom:dd/MM/yyyy} – {r.DateTo:dd/MM/yyyy})";
                headers = new() { "Fecha", "Facturas", "Importe" };
                rows = r.Items.Select(i => new List<string> { i.Date.ToString("dd/MM/yyyy"), i.InvoiceCount.ToString(), $"$ {i.Amount:N2}" }).ToList();
                rows.Add(new() { "TOTAL", r.TotalInvoices.ToString(), $"$ {r.TotalAmount:N2}" });
                break;
            }
            case "sales-by-seller":
            {
                var r = await GetSalesBySellerAsync(query);
                title = $"Ventas por vendedor ({r.DateFrom:dd/MM/yyyy} – {r.DateTo:dd/MM/yyyy})";
                headers = new() { "Vendedor", "Facturas", "Clientes", "Importe" };
                rows = r.Sellers.Select(s => new List<string> { s.SellerName, s.InvoiceCount.ToString(), s.ClientCount.ToString(), $"$ {s.TotalAmount:N2}" }).ToList();
                break;
            }
            case "sales-by-client":
            {
                var r = await GetSalesByClientAsync(query);
                title = $"Ventas por cliente ({r.DateFrom:dd/MM/yyyy} – {r.DateTo:dd/MM/yyyy})";
                headers = new() { "Cliente", "CUIT", "Facturas", "Importe", "Saldo" };
                rows = r.Clients.Select(c => new List<string> { c.ClientName, c.Cuit ?? "", c.InvoiceCount.ToString(), $"$ {c.TotalAmount:N2}", $"$ {c.BalanceDue:N2}" }).ToList();
                break;
            }
            case "stock":
            {
                var r = await GetStockReportAsync(query);
                title = "Estado de stock";
                headers = new() { "Código", "Producto", "Categoría", "Stock", "Mínimo", "Valor" };
                rows = r.Items.Select(i => new List<string> { i.ProductCode, i.ProductName, i.CategoryName ?? "", i.TotalStock.ToString("N2"), i.MinimumStock.ToString("N2"), $"$ {i.TotalValue:N2}" }).ToList();
                break;
            }
            case "payments":
            {
                var r = await GetPaymentsReportAsync(query);
                title = $"Pagos ({r.DateFrom:dd/MM/yyyy} – {r.DateTo:dd/MM/yyyy})";
                headers = new() { "Fecha", "Tipo", "Contraparte", "Comprob.", "Forma", "Importe" };
                rows = r.Items.Select(i => new List<string> { i.PaymentDate.ToString("dd/MM/yyyy"), i.Kind, i.PartyName, i.InvoiceFullNumber, i.PaymentMethodName, $"$ {i.Amount:N2}" }).ToList();
                break;
            }
            case "receivables":
            {
                var r = await GetReceivablesReportAsync();
                title = "Cuentas por cobrar";
                headers = new() { "Cliente", "CUIT", "Vencidas", "Importe vencido", "Pendientes", "Total" };
                rows = r.Items.Select(i => new List<string> { i.ClientName, i.Cuit ?? "", i.OverdueInvoices.ToString(), $"$ {i.OverdueAmount:N2}", i.PendingInvoices.ToString(), $"$ {i.TotalDue:N2}" }).ToList();
                break;
            }
            case "payables":
            {
                var r = await GetPayablesReportAsync();
                title = "Cuentas por pagar";
                headers = new() { "Proveedor", "CUIT", "Vencidas", "Importe vencido", "Pendientes", "Total" };
                rows = r.Items.Select(i => new List<string> { i.SupplierName, i.Cuit, i.OverdueInvoices.ToString(), $"$ {i.OverdueAmount:N2}", i.PendingInvoices.ToString(), $"$ {i.TotalDue:N2}" }).ToList();
                break;
            }
            case "cash":
            {
                var r = await GetCashReportAsync(query);
                title = $"Caja ({r.DateFrom:dd/MM/yyyy} – {r.DateTo:dd/MM/yyyy})";
                headers = new() { "Fecha", "Ingresos", "Egresos", "Neto" };
                rows = r.ByDay.Select(d => new List<string> { d.Date.ToString("dd/MM/yyyy"), $"$ {d.Income:N2}", $"$ {d.Expense:N2}", $"$ {d.Net:N2}" }).ToList();
                break;
            }
            case "detailed-sales":
            {
                var r = await GetDetailedSalesAsync(query);
                title = $"Ventas detalladas ({r.DateFrom:dd/MM/yyyy} – {r.DateTo:dd/MM/yyyy})";
                headers = new() { "Fecha", "Factura", "Cliente", "Zona", "Vendedor", "Producto", "Cant.", "P. unit.", "Total", "Cuotas" };
                rows = r.Items.Select(i => new List<string>
                {
                    i.InvoiceDate.ToString("dd/MM/yy"),
                    i.InvoiceFullNumber,
                    i.ClientName,
                    i.ZoneName ?? "",
                    i.SellerName ?? "",
                    i.ProductName,
                    i.Quantity.ToString("N2"),
                    $"$ {i.UnitPrice:N2}",
                    $"$ {i.LineTotal:N2}",
                    i.HasInstallmentPlan ? $"{i.NumberOfInstallments}" : "—"
                }).ToList();
                break;
            }
            default:
                return Array.Empty<byte>();
        }

        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(s => s.FontSize(9));

                page.Header().Text(title).FontSize(14).Bold();

                page.Content().PaddingVertical(10).Table(t =>
                {
                    t.ColumnsDefinition(cd =>
                    {
                        foreach (var _ in headers) cd.RelativeColumn();
                    });
                    t.Header(h =>
                    {
                        foreach (var col in headers)
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(3).Text(col).Bold();
                    });
                    foreach (var r in rows)
                    {
                        foreach (var c in r)
                            t.Cell().Padding(3).BorderBottom(0.3f).BorderColor(Colors.Grey.Lighten2).Text(c);
                    }
                });

                page.Footer().AlignCenter().Text(tt =>
                {
                    tt.Span("Página "); tt.CurrentPageNumber(); tt.Span(" de "); tt.TotalPages();
                });
            });
        }).GeneratePdf();
    }

    // =====================================================================
    // Helpers
    // =====================================================================
    private static void WriteTitle(IXLWorksheet ws, string title, int colSpan)
    {
        ws.Cell(1, 1).Value = title;
        ws.Range(1, 1, 1, colSpan).Merge().Style.Font.Bold = true;
        ws.Row(1).Style.Font.FontSize = 14;
    }

    private static void Headers(IXLWorksheet ws, int row, params string[] headers)
    {
        for (int i = 0; i < headers.Length; i++) ws.Cell(row, i + 1).Value = headers[i];
        ws.Range(row, 1, row, headers.Length).Style.Font.Bold = true;
        ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.LightGray;
    }
}
