using ClosedXML.Excel;
using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ERP.Application.Services;

public class SupplierAccountService : ISupplierAccountService
{
    private readonly AppDbContext _db;
    public SupplierAccountService(AppDbContext db) { _db = db; }

    public async Task<SupplierAccountDto> GetAsync(int supplierId)
    {
        var supplier = await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == supplierId)
            ?? throw new KeyNotFoundException($"Proveedor {supplierId} no encontrado.");

        var invoices = await _db.PurchaseInvoices
            .Where(i => i.SupplierId == supplierId && i.Status != "cancelled" && i.Status != "draft")
            .Select(i => new { i.Id, i.FullNumber, i.InvoiceDate, i.Total })
            .ToListAsync();

        var payments = await _db.PurchasePayments
            .Include(p => p.PurchaseInvoice)
            .Include(p => p.PaymentMethod)
            .Where(p => p.PurchaseInvoice.SupplierId == supplierId)
            .Select(p => new { p.Id, p.PaymentDate, p.Amount, InvoiceNumber = p.PurchaseInvoice.FullNumber, MethodName = p.PaymentMethod.Name, InvoiceId = p.PurchaseInvoiceId })
            .ToListAsync();

        var entries = new List<(DateTime Date, string Kind, string Description, decimal Debit, decimal Credit, int? InvoiceId, int? PaymentId)>();
        foreach (var i in invoices)
            entries.Add((i.InvoiceDate, "invoice", $"Factura {i.FullNumber}", i.Total, 0m, i.Id, null));
        foreach (var p in payments)
            entries.Add((p.PaymentDate, "payment", $"Pago ({p.MethodName}) - {p.InvoiceNumber}", 0m, p.Amount, p.InvoiceId, p.Id));

        var ordered = entries.OrderBy(e => e.Date).ThenBy(e => e.Kind == "invoice" ? 0 : 1).ToList();
        decimal running = 0;
        var result = new List<SupplierAccountEntryDto>();
        foreach (var e in ordered)
        {
            running += e.Debit - e.Credit;
            result.Add(new SupplierAccountEntryDto(e.Date, e.Kind, e.Description, e.Debit, e.Credit, running, e.InvoiceId, e.PaymentId));
        }

        var totalInvoiced = invoices.Sum(i => i.Total);
        var totalPaid = payments.Sum(p => p.Amount);

        return new SupplierAccountDto(
            supplier.Id, supplier.Code, supplier.BusinessName, supplier.Cuit,
            running, totalInvoiced, totalPaid,
            result.OrderByDescending(r => r.Date).ThenByDescending(r => r.Kind == "invoice" ? 0 : 1));
    }

    public async Task<byte[]> ExportExcelAsync(int supplierId)
    {
        var acc = await GetAsync(supplierId);
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Cuenta corriente");

        ws.Cell(1, 1).Value = "CUENTA CORRIENTE PROVEEDOR";
        ws.Range(1, 1, 1, 6).Merge().Style.Font.Bold = true;
        ws.Row(1).Style.Font.FontSize = 14;

        ws.Cell(3, 1).Value = "Proveedor:"; ws.Cell(3, 2).Value = acc.SupplierName; ws.Cell(3, 2).Style.Font.Bold = true;
        ws.Cell(3, 4).Value = "Código:"; ws.Cell(3, 5).Value = acc.SupplierCode;
        ws.Cell(4, 1).Value = "CUIT:"; ws.Cell(4, 2).Value = acc.Cuit ?? "";
        ws.Cell(4, 4).Value = "Saldo actual:"; ws.Cell(4, 5).Value = (double)acc.CurrentBalance;
        ws.Cell(4, 5).Style.NumberFormat.Format = "$ #,##0.00";
        ws.Cell(4, 5).Style.Font.Bold = true;
        ws.Cell(4, 5).Style.Font.FontColor = acc.CurrentBalance > 0 ? XLColor.Red : XLColor.Green;

        ws.Cell(5, 1).Value = "Total facturado:"; ws.Cell(5, 2).Value = (double)acc.TotalInvoiced;
        ws.Cell(5, 2).Style.NumberFormat.Format = "$ #,##0.00";
        ws.Cell(5, 4).Value = "Total pagado:"; ws.Cell(5, 5).Value = (double)acc.TotalPaid;
        ws.Cell(5, 5).Style.NumberFormat.Format = "$ #,##0.00";

        var header = 7;
        ws.Cell(header, 1).Value = "Fecha";
        ws.Cell(header, 2).Value = "Tipo";
        ws.Cell(header, 3).Value = "Descripción";
        ws.Cell(header, 4).Value = "Debe";
        ws.Cell(header, 5).Value = "Haber";
        ws.Cell(header, 6).Value = "Saldo";
        ws.Range(header, 1, header, 6).Style.Font.Bold = true;
        ws.Range(header, 1, header, 6).Style.Fill.BackgroundColor = XLColor.LightGray;

        var row = header + 1;
        foreach (var e in acc.Entries.Reverse())
        {
            ws.Cell(row, 1).Value = e.Date.ToString("dd/MM/yyyy");
            ws.Cell(row, 2).Value = e.Kind == "invoice" ? "Factura" : "Pago";
            ws.Cell(row, 3).Value = e.Description;
            if (e.Debit > 0) { ws.Cell(row, 4).Value = (double)e.Debit; ws.Cell(row, 4).Style.NumberFormat.Format = "$ #,##0.00"; }
            if (e.Credit > 0) { ws.Cell(row, 5).Value = (double)e.Credit; ws.Cell(row, 5).Style.NumberFormat.Format = "$ #,##0.00"; }
            ws.Cell(row, 6).Value = (double)e.Balance;
            ws.Cell(row, 6).Style.NumberFormat.Format = "$ #,##0.00";
            ws.Cell(row, 6).Style.Font.Bold = true;
            if (e.Kind == "payment") ws.Range(row, 1, row, 6).Style.Fill.BackgroundColor = XLColor.FromHtml("#f0fff4");
            row++;
        }

        ws.Columns().AdjustToContents();
        ws.Column(3).Width = 45;

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> ExportPdfAsync(int supplierId)
    {
        var acc = await GetAsync(supplierId);
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(s => s.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("CUENTA CORRIENTE PROVEEDOR").FontSize(16).Bold();
                    col.Item().PaddingTop(4).Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text(t => { t.Span("Proveedor: ").SemiBold(); t.Span(acc.SupplierName); });
                            c.Item().Text(t => { t.Span("Código: ").SemiBold(); t.Span(acc.SupplierCode); });
                            c.Item().Text(t => { t.Span("CUIT: ").SemiBold(); t.Span(acc.Cuit ?? "—"); });
                        });
                        r.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text(t => { t.Span("Total facturado: ").SemiBold(); t.Span($"$ {acc.TotalInvoiced:N2}"); });
                            c.Item().Text(t => { t.Span("Total pagado: ").SemiBold(); t.Span($"$ {acc.TotalPaid:N2}"); });
                            c.Item().Text(t =>
                            {
                                t.Span("Saldo actual: ").Bold();
                                var s = t.Span($"$ {acc.CurrentBalance:N2}").Bold();
                                if (acc.CurrentBalance > 0) s.FontColor(Colors.Red.Medium);
                            });
                        });
                    });
                });

                page.Content().PaddingVertical(12).Table(t =>
                {
                    t.ColumnsDefinition(c =>
                    {
                        c.ConstantColumn(70);
                        c.ConstantColumn(60);
                        c.RelativeColumn();
                        c.ConstantColumn(80);
                        c.ConstantColumn(80);
                        c.ConstantColumn(80);
                    });
                    t.Header(h =>
                    {
                        void H(string s) => h.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(s).Bold().FontSize(9);
                        H("Fecha"); H("Tipo"); H("Descripción"); H("Debe"); H("Haber"); H("Saldo");
                    });

                    foreach (var e in acc.Entries.Reverse())
                    {
                        var bg = e.Kind == "payment" ? Colors.Green.Lighten5 : Colors.White;
                        t.Cell().Background(bg).Padding(3).Text(e.Date.ToString("dd/MM/yyyy")).FontSize(9);
                        t.Cell().Background(bg).Padding(3).Text(e.Kind == "invoice" ? "Factura" : "Pago").FontSize(9);
                        t.Cell().Background(bg).Padding(3).Text(e.Description).FontSize(9);
                        t.Cell().Background(bg).Padding(3).AlignRight().Text(e.Debit > 0 ? $"$ {e.Debit:N2}" : "").FontSize(9);
                        t.Cell().Background(bg).Padding(3).AlignRight().Text(e.Credit > 0 ? $"$ {e.Credit:N2}" : "").FontSize(9);
                        t.Cell().Background(bg).Padding(3).AlignRight().Text($"$ {e.Balance:N2}").FontSize(9).Bold();
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span($"Generado el {DateTime.Now:dd/MM/yyyy HH:mm}  ·  Página ");
                    t.CurrentPageNumber(); t.Span(" de "); t.TotalPages();
                });
            });
        }).GeneratePdf();
    }
}
