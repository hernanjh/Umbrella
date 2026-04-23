using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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
}
