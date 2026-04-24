using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class SalesPaymentService : ISalesPaymentService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public SalesPaymentService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<IEnumerable<SalesPaymentDto>> GetByInvoiceAsync(int invoiceId)
    {
        return await _db.SalesPayments
            .Include(p => p.PaymentMethod)
            .Include(p => p.SalesInvoice)
            .Where(p => p.SalesInvoiceId == invoiceId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new SalesPaymentDto(
                p.Id, p.SalesInvoiceId, p.SalesInvoice.FullNumber,
                p.PaymentMethodId, p.PaymentMethod.Name, p.PaymentMethod.AffectsCash,
                p.PaymentDate, p.Amount, p.Reference, p.Notes, p.CreatedAt, p.CreatedBy))
            .ToListAsync();
    }

    public async Task<SalesPaymentDto> CreateAsync(int invoiceId, CreateSalesPaymentDto dto, string createdBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var invoice = await _db.SalesInvoices.FirstOrDefaultAsync(i => i.Id == invoiceId)
                ?? throw new KeyNotFoundException($"Factura {invoiceId} no encontrada.");
            if (invoice.Status == "cancelled")
                throw new InvalidOperationException("No se pueden registrar pagos sobre facturas canceladas.");
            if (dto.Amount <= 0)
                throw new InvalidOperationException("El monto debe ser mayor a cero.");
            if (dto.Amount > invoice.BalanceDue + 0.001m)
                throw new InvalidOperationException($"El monto excede el saldo pendiente ({invoice.BalanceDue:F2}).");

            var method = await _db.PaymentMethods.FindAsync(dto.PaymentMethodId)
                ?? throw new KeyNotFoundException($"Forma de pago {dto.PaymentMethodId} no encontrada.");

            var payment = new SalesPayment
            {
                Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                SalesInvoiceId = invoiceId,
                PaymentMethodId = dto.PaymentMethodId,
                PaymentDate = dto.PaymentDate,
                Amount = dto.Amount,
                Reference = dto.Reference,
                Notes = dto.Notes,
                CreatedBy = createdBy,
            };
            _db.SalesPayments.Add(payment);
            await _db.SaveChangesAsync();

            if (method.AffectsCash)
            {
                var openSession = await _db.CashSessions.FirstOrDefaultAsync(s => s.Status == "open")
                    ?? throw new InvalidOperationException("No hay una sesión de caja abierta. Abrí caja antes de registrar pagos en efectivo.");
                _db.CashMovements.Add(new CashMovement
                {
                    Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                    CashSessionId = openSession.Id,
                    MovementDate = dto.PaymentDate,
                    Type = "income",
                    Amount = dto.Amount,
                    PaymentMethodId = dto.PaymentMethodId,
                    ReferenceType = "SalesPayment",
                    ReferenceId = payment.Id,
                    Description = $"Pago factura {invoice.FullNumber}",
                    CreatedBy = createdBy,
                });
            }

            invoice.PaidAmount += dto.Amount;
            invoice.BalanceDue = invoice.Total - invoice.PaidAmount;
            if (invoice.BalanceDue <= 0.001m)
            {
                invoice.BalanceDue = 0;
                invoice.Status = "paid";
            }
            invoice.ModifiedBy = createdBy;
            invoice.ModifiedAt = DateTime.UtcNow;
            _db.SalesInvoices.Update(invoice);

            var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == invoice.ClientId);
            if (client != null)
            {
                client.CurrentBalance -= dto.Amount;
                _db.Clients.Update(client);
            }

            await _uow.CommitTransactionAsync();

            return new SalesPaymentDto(
                payment.Id, invoice.Id, invoice.FullNumber,
                method.Id, method.Name, method.AffectsCash,
                payment.PaymentDate, payment.Amount, payment.Reference, payment.Notes,
                payment.CreatedAt, payment.CreatedBy);
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task DeleteAsync(int paymentId, string deletedBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var payment = await _db.SalesPayments.FirstOrDefaultAsync(p => p.Id == paymentId)
                ?? throw new KeyNotFoundException();
            var invoice = await _db.SalesInvoices.FirstOrDefaultAsync(i => i.Id == payment.SalesInvoiceId);

            payment.IsDeleted = true;
            payment.DeletedBy = deletedBy;
            payment.DeletedAt = DateTime.UtcNow;
            _db.SalesPayments.Update(payment);

            if (payment.SalesInstallmentId.HasValue)
            {
                var inst = await _db.SalesInstallments.FindAsync(payment.SalesInstallmentId.Value);
                if (inst != null)
                {
                    inst.PaidAmount -= payment.Amount;
                    if (inst.PaidAmount < 0) inst.PaidAmount = 0;
                    inst.Status = inst.PaidAmount >= inst.Amount - 0.001m
                        ? "paid"
                        : inst.PaidAmount > 0
                            ? "partially_paid"
                            : (inst.DueDate.Date < DateTime.UtcNow.Date ? "overdue" : "pending");
                    inst.ModifiedBy = deletedBy;
                    inst.ModifiedAt = DateTime.UtcNow;
                    _db.SalesInstallments.Update(inst);
                }
            }

            var cashMovements = await _db.CashMovements
                .Where(m => m.ReferenceType == "SalesPayment" && m.ReferenceId == payment.Id && !m.IsDeleted)
                .ToListAsync();
            foreach (var m in cashMovements)
            {
                var session = await _db.CashSessions.FindAsync(m.CashSessionId);
                if (session?.Status == "open")
                {
                    m.IsDeleted = true;
                    m.DeletedBy = deletedBy;
                    m.DeletedAt = DateTime.UtcNow;
                    _db.CashMovements.Update(m);
                }
            }

            if (invoice != null)
            {
                invoice.PaidAmount -= payment.Amount;
                if (invoice.PaidAmount < 0) invoice.PaidAmount = 0;
                invoice.BalanceDue = invoice.Total - invoice.PaidAmount;
                if (invoice.Status == "paid" && invoice.BalanceDue > 0.001m) invoice.Status = "confirmed";
                invoice.ModifiedBy = deletedBy;
                invoice.ModifiedAt = DateTime.UtcNow;
                _db.SalesInvoices.Update(invoice);

                var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == invoice.ClientId);
                if (client != null)
                {
                    client.CurrentBalance += payment.Amount;
                    _db.Clients.Update(client);
                }
            }

            await _uow.CommitTransactionAsync();
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }
}
