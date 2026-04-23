using ERP.Application.DTOs.Invoices;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ERP.Application.Services;

public interface IInvoicePdfService
{
    Task<byte[]> GenerateSalesInvoicePdfAsync(int invoiceId);
}

public class InvoicePdfService : IInvoicePdfService
{
    private readonly AppDbContext _db;
    public InvoicePdfService(AppDbContext db)
    {
        _db = db;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateSalesInvoicePdfAsync(int invoiceId)
    {
        var inv = await _db.SalesInvoices
            .Include(i => i.Client).ThenInclude(c => c.VatCondition)
            .Include(i => i.Seller)
            .Include(i => i.PriceList)
            .Include(i => i.PaymentCondition)
            .Include(i => i.Items).ThenInclude(it => it.Product)
            .FirstOrDefaultAsync(i => i.Id == invoiceId)
            ?? throw new KeyNotFoundException("Factura no encontrada");

        var cfg = await _db.SystemConfigs.FirstOrDefaultAsync();

        var payments = await _db.SalesPayments
            .Include(p => p.PaymentMethod)
            .Where(p => p.SalesInvoiceId == invoiceId)
            .OrderBy(p => p.PaymentDate)
            .ToListAsync();

        var bytes = Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(t => t.FontSize(10).FontFamily(Fonts.Arial));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text(cfg?.CompanyName ?? "Empresa").FontSize(16).Bold();
                            if (!string.IsNullOrWhiteSpace(cfg?.CompanyAddress)) c.Item().Text(cfg!.CompanyAddress);
                            if (!string.IsNullOrWhiteSpace(cfg?.CompanyCuit)) c.Item().Text($"CUIT: {cfg!.CompanyCuit}");
                            if (!string.IsNullOrWhiteSpace(cfg?.CompanyPhone)) c.Item().Text($"Tel: {cfg!.CompanyPhone}");
                            if (!string.IsNullOrWhiteSpace(cfg?.CompanyEmail)) c.Item().Text(cfg!.CompanyEmail!);
                        });
                        row.ConstantItem(100).Border(1).Padding(8).AlignCenter().Column(c =>
                        {
                            c.Item().AlignCenter().Text(inv.InvoiceType).FontSize(28).Bold();
                            c.Item().AlignCenter().Text("COD. 01").FontSize(8);
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().AlignRight().Text($"Factura {inv.InvoiceType}").FontSize(14).Bold();
                            c.Item().AlignRight().Text($"Nº {inv.FullNumber}");
                            c.Item().AlignRight().Text($"Fecha: {inv.InvoiceDate:dd/MM/yyyy}");
                            if (inv.DueDate != default) c.Item().AlignRight().Text($"Vencimiento: {inv.DueDate:dd/MM/yyyy}");
                            c.Item().AlignRight().Text($"Estado: {inv.Status}").FontColor(Colors.Grey.Darken2);
                        });
                    });
                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Item().PaddingBottom(8).Column(c =>
                    {
                        c.Item().Text("Cliente").Bold();
                        c.Item().Text($"{inv.Client.BusinessName}");
                        if (!string.IsNullOrWhiteSpace(inv.Client.Cuit)) c.Item().Text($"CUIT: {inv.Client.Cuit}");
                        if (inv.Client.VatCondition != null) c.Item().Text($"Cond. IVA: {inv.Client.VatCondition.Name}");
                        if (!string.IsNullOrWhiteSpace(inv.Client.Address)) c.Item().Text($"{inv.Client.Address}{(inv.Client.City != null ? $", {inv.Client.City}" : "")}");
                        if (inv.Seller != null) c.Item().Text($"Vendedor: {inv.Seller.FirstName} {inv.Seller.LastName}");
                        if (inv.PaymentCondition != null) c.Item().Text($"Cond. pago: {inv.PaymentCondition.Name}");
                    });

                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.ConstantColumn(60);
                            c.RelativeColumn(3);
                            c.ConstantColumn(60);
                            c.ConstantColumn(80);
                            c.ConstantColumn(50);
                            c.ConstantColumn(50);
                            c.ConstantColumn(80);
                        });
                        t.Header(h =>
                        {
                            h.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("Código").Bold();
                            h.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("Producto").Bold();
                            h.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text("Cant.").Bold();
                            h.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text("P.Unit.").Bold();
                            h.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text("Dto%").Bold();
                            h.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text("IVA%").Bold();
                            h.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text("Subtotal").Bold();
                        });
                        foreach (var item in inv.Items.OrderBy(x => x.SortOrder))
                        {
                            t.Cell().Padding(4).Text(item.Product.Code);
                            t.Cell().Padding(4).Text(item.ProductName);
                            t.Cell().Padding(4).AlignRight().Text(item.Quantity.ToString("F2"));
                            t.Cell().Padding(4).AlignRight().Text($"${item.UnitPrice:N2}");
                            t.Cell().Padding(4).AlignRight().Text($"{item.DiscountPercentage:F1}");
                            t.Cell().Padding(4).AlignRight().Text($"{item.VatRate:F1}");
                            t.Cell().Padding(4).AlignRight().Text($"${item.Total:N2}");
                        }
                    });

                    col.Item().PaddingTop(10).AlignRight().Column(c =>
                    {
                        c.Item().Row(r => { r.RelativeItem().AlignRight().Text("Subtotal neto:"); r.ConstantItem(100).AlignRight().Text($"${inv.TaxableBase:N2}"); });
                        if (inv.DiscountAmount > 0) c.Item().Row(r => { r.RelativeItem().AlignRight().Text("Descuento:"); r.ConstantItem(100).AlignRight().Text($"-${inv.DiscountAmount:N2}"); });
                        c.Item().Row(r => { r.RelativeItem().AlignRight().Text("IVA:"); r.ConstantItem(100).AlignRight().Text($"${inv.VatAmount:N2}"); });
                        c.Item().PaddingTop(4).Row(r => { r.RelativeItem().AlignRight().Text("TOTAL:").Bold().FontSize(12); r.ConstantItem(100).AlignRight().Text($"${inv.Total:N2}").Bold().FontSize(12); });
                        if (inv.PaidAmount > 0) c.Item().Row(r => { r.RelativeItem().AlignRight().Text("Pagado:"); r.ConstantItem(100).AlignRight().Text($"${inv.PaidAmount:N2}").FontColor(Colors.Green.Darken2); });
                        if (inv.BalanceDue > 0) c.Item().Row(r => { r.RelativeItem().AlignRight().Text("Saldo:").Bold(); r.ConstantItem(100).AlignRight().Text($"${inv.BalanceDue:N2}").Bold().FontColor(Colors.Orange.Darken2); });
                    });

                    if (payments.Any())
                    {
                        col.Item().PaddingTop(16).Text("Pagos registrados").Bold();
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.ConstantColumn(80); c.RelativeColumn(); c.ConstantColumn(120); c.ConstantColumn(80); });
                            t.Header(h =>
                            {
                                h.Cell().Background(Colors.Grey.Lighten3).Padding(3).Text("Fecha").Bold();
                                h.Cell().Background(Colors.Grey.Lighten3).Padding(3).Text("Forma").Bold();
                                h.Cell().Background(Colors.Grey.Lighten3).Padding(3).Text("Referencia").Bold();
                                h.Cell().Background(Colors.Grey.Lighten3).Padding(3).AlignRight().Text("Monto").Bold();
                            });
                            foreach (var p in payments)
                            {
                                t.Cell().Padding(3).Text(p.PaymentDate.ToString("dd/MM/yyyy"));
                                t.Cell().Padding(3).Text(p.PaymentMethod.Name);
                                t.Cell().Padding(3).Text(p.Reference ?? "—");
                                t.Cell().Padding(3).AlignRight().Text($"${p.Amount:N2}");
                            }
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(inv.Notes))
                    {
                        col.Item().PaddingTop(10).Text("Notas:").Bold();
                        col.Item().Text(inv.Notes!);
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Página ").FontSize(8);
                    x.CurrentPageNumber().FontSize(8);
                    x.Span(" / ").FontSize(8);
                    x.TotalPages().FontSize(8);
                });
            });
        }).GeneratePdf();

        return bytes;
    }
}
