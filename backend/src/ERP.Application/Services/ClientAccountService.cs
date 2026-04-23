using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class ClientAccountService : IClientAccountService
{
    private readonly AppDbContext _db;
    public ClientAccountService(AppDbContext db) { _db = db; }

    public async Task<ClientAccountDto> GetAsync(int clientId)
    {
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == clientId)
            ?? throw new KeyNotFoundException($"Cliente {clientId} no encontrado.");

        var invoices = await _db.SalesInvoices
            .Where(i => i.ClientId == clientId && i.Status != "cancelled" && i.Status != "draft")
            .Select(i => new { i.Id, i.FullNumber, i.InvoiceDate, i.Total })
            .ToListAsync();

        var payments = await _db.SalesPayments
            .Include(p => p.SalesInvoice)
            .Include(p => p.PaymentMethod)
            .Where(p => p.SalesInvoice.ClientId == clientId)
            .Select(p => new { p.Id, p.PaymentDate, p.Amount, InvoiceNumber = p.SalesInvoice.FullNumber, MethodName = p.PaymentMethod.Name, InvoiceId = p.SalesInvoiceId })
            .ToListAsync();

        var entries = new List<(DateTime Date, string Kind, string Description, decimal Debit, decimal Credit, int? InvoiceId, int? PaymentId)>();
        foreach (var i in invoices)
            entries.Add((i.InvoiceDate, "invoice", $"Factura {i.FullNumber}", i.Total, 0m, i.Id, null));
        foreach (var p in payments)
            entries.Add((p.PaymentDate, "payment", $"Pago ({p.MethodName}) - {p.InvoiceNumber}", 0m, p.Amount, p.InvoiceId, p.Id));

        var ordered = entries.OrderBy(e => e.Date).ThenBy(e => e.Kind == "invoice" ? 0 : 1).ToList();
        decimal running = 0;
        var result = new List<ClientAccountEntryDto>();
        foreach (var e in ordered)
        {
            running += e.Debit - e.Credit;
            result.Add(new ClientAccountEntryDto(e.Date, e.Kind, e.Description, e.Debit, e.Credit, running, e.InvoiceId, e.PaymentId));
        }

        var totalInvoiced = invoices.Sum(i => i.Total);
        var totalPaid = payments.Sum(p => p.Amount);

        return new ClientAccountDto(
            client.Id, client.Code, client.BusinessName, client.Cuit,
            running, totalInvoiced, totalPaid,
            result.OrderByDescending(r => r.Date).ThenByDescending(r => r.Kind == "invoice" ? 0 : 1));
    }
}
