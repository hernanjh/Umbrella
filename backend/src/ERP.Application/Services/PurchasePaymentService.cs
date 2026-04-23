using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class PurchasePaymentService : IPurchasePaymentService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public PurchasePaymentService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<IEnumerable<PurchasePaymentDto>> GetByInvoiceAsync(int invoiceId)
    {
        return await _db.PurchasePayments
            .Include(p => p.PaymentMethod)
            .Include(p => p.PurchaseInvoice)
            .Where(p => p.PurchaseInvoiceId == invoiceId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PurchasePaymentDto(
                p.Id, p.PurchaseInvoiceId, p.PurchaseInvoice.FullNumber,
                p.PaymentMethodId, p.PaymentMethod.Name, p.PaymentMethod.AffectsCash,
                p.PaymentDate, p.Amount, p.Reference, p.Notes, p.CreatedAt, p.CreatedBy))
            .ToListAsync();
    }

    public async Task<PurchasePaymentDto> CreateAsync(int invoiceId, CreatePurchasePaymentDto dto, string createdBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var invoice = await _db.PurchaseInvoices.FirstOrDefaultAsync(i => i.Id == invoiceId)
                ?? throw new KeyNotFoundException($"Factura de compra {invoiceId} no encontrada.");
            if (invoice.Status == "cancelled")
                throw new InvalidOperationException("No se pueden registrar pagos sobre facturas canceladas.");
            if (dto.Amount <= 0)
                throw new InvalidOperationException("El monto debe ser mayor a cero.");
            if (dto.Amount > invoice.BalanceDue + 0.001m)
                throw new InvalidOperationException($"El monto excede el saldo pendiente ({invoice.BalanceDue:F2}).");

            var method = await _db.PaymentMethods.FindAsync(dto.PaymentMethodId)
                ?? throw new KeyNotFoundException($"Forma de pago {dto.PaymentMethodId} no encontrada.");

            var payment = new PurchasePayment
            {
                Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                PurchaseInvoiceId = invoiceId,
                PaymentMethodId = dto.PaymentMethodId,
                PaymentDate = dto.PaymentDate,
                Amount = dto.Amount,
                Reference = dto.Reference,
                Notes = dto.Notes,
                CreatedBy = createdBy,
            };
            _db.PurchasePayments.Add(payment);
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
                    Type = "expense",
                    Amount = dto.Amount,
                    PaymentMethodId = dto.PaymentMethodId,
                    ReferenceType = "PurchasePayment",
                    ReferenceId = payment.Id,
                    Description = $"Pago factura proveedor {invoice.FullNumber}",
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
            _db.PurchaseInvoices.Update(invoice);

            await _uow.CommitTransactionAsync();

            return new PurchasePaymentDto(
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
            var payment = await _db.PurchasePayments.FirstOrDefaultAsync(p => p.Id == paymentId)
                ?? throw new KeyNotFoundException();
            var invoice = await _db.PurchaseInvoices.FirstOrDefaultAsync(i => i.Id == payment.PurchaseInvoiceId);

            payment.IsDeleted = true;
            payment.DeletedBy = deletedBy;
            payment.DeletedAt = DateTime.UtcNow;
            _db.PurchasePayments.Update(payment);

            var cashMovements = await _db.CashMovements
                .Where(m => m.ReferenceType == "PurchasePayment" && m.ReferenceId == payment.Id && !m.IsDeleted)
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
                _db.PurchaseInvoices.Update(invoice);
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
