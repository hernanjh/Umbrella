using ERP.Application.DTOs.Installments;
using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class InstallmentPlanService : IInstallmentPlanService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    private readonly ISalesPaymentService _payments;

    public InstallmentPlanService(AppDbContext db, IUnitOfWork uow, ISalesPaymentService payments)
    {
        _db = db;
        _uow = uow;
        _payments = payments;
    }

    public async Task<InstallmentPlanDto?> GetByInvoiceAsync(int invoiceId)
    {
        var plan = await _db.SalesInstallmentPlans
            .Include(p => p.Installments)
            .Include(p => p.SalesInvoice).ThenInclude(i => i.Client)
            .FirstOrDefaultAsync(p => p.SalesInvoiceId == invoiceId);
        return plan == null ? null : Map(plan);
    }

    public async Task<InstallmentPlanDto> CreateAsync(int invoiceId, CreateInstallmentPlanDto dto, string createdBy)
    {
        var invoice = await _db.SalesInvoices.FirstOrDefaultAsync(i => i.Id == invoiceId)
            ?? throw new KeyNotFoundException($"Factura {invoiceId} no encontrada.");
        if (invoice.Status == "cancelled" || invoice.Status == "draft")
            throw new InvalidOperationException("Solo se puede crear un plan en facturas confirmadas.");
        if (await _db.SalesInstallmentPlans.AnyAsync(p => p.SalesInvoiceId == invoiceId))
            throw new InvalidOperationException("La factura ya tiene un plan de pago.");
        if (dto.NumberOfInstallments <= 0) throw new InvalidOperationException("Cantidad de cuotas inválida.");
        if (dto.Frequency != "weekly" && dto.Frequency != "biweekly" && dto.Frequency != "monthly")
            throw new InvalidOperationException("Frecuencia inválida.");

        var outstanding = invoice.BalanceDue;
        if (outstanding <= 0) throw new InvalidOperationException("La factura no tiene saldo para generar plan.");

        var start = dto.StartDate ?? invoice.InvoiceDate.AddDays(FrequencyDays(dto.Frequency));
        var perAmount = Math.Round(outstanding / dto.NumberOfInstallments, 2);
        var remainder = outstanding - perAmount * dto.NumberOfInstallments;

        var plan = new SalesInstallmentPlan
        {
            Code = $"PP{DateTime.UtcNow:yyyyMMddHHmmss}",
            SalesInvoiceId = invoiceId,
            Frequency = dto.Frequency,
            NumberOfInstallments = dto.NumberOfInstallments,
            StartDate = start,
            TotalAmount = outstanding,
            Status = "active",
            CreatedBy = createdBy,
        };
        _db.SalesInstallmentPlans.Add(plan);
        await _db.SaveChangesAsync();

        for (var i = 1; i <= dto.NumberOfInstallments; i++)
        {
            var due = AddFrequency(start, dto.Frequency, i - 1);
            var amount = i == dto.NumberOfInstallments ? perAmount + remainder : perAmount;
            _db.SalesInstallments.Add(new SalesInstallment
            {
                Code = $"CT{plan.Id:D4}-{i:D2}",
                SalesInstallmentPlanId = plan.Id,
                SequenceNumber = i,
                DueDate = due,
                Amount = amount,
                PaidAmount = 0,
                Status = "pending",
                CreatedBy = createdBy,
            });
        }
        await _uow.SaveChangesAsync();
        return (await GetByInvoiceAsync(invoiceId))!;
    }

    public async Task<InstallmentPlanDto> UpdateInstallmentAsync(int invoiceId, int installmentId, UpdateInstallmentDto dto, string modifiedBy)
    {
        var plan = await _db.SalesInstallmentPlans.Include(p => p.Installments)
            .FirstOrDefaultAsync(p => p.SalesInvoiceId == invoiceId) ?? throw new KeyNotFoundException();

        var installment = plan.Installments.FirstOrDefault(i => i.Id == installmentId)
            ?? throw new KeyNotFoundException("Cuota no encontrada.");
        if (installment.PaidAmount > 0 && dto.Amount < installment.PaidAmount)
            throw new InvalidOperationException("El monto no puede ser menor al ya pagado.");

        installment.DueDate = dto.DueDate;
        installment.Amount = dto.Amount;
        installment.ModifiedBy = modifiedBy;
        installment.ModifiedAt = DateTime.UtcNow;
        UpdateStatus(installment);
        _db.SalesInstallments.Update(installment);

        if (dto.Cascade)
        {
            var later = plan.Installments
                .Where(i => i.SequenceNumber > installment.SequenceNumber && i.PaidAmount == 0)
                .OrderBy(i => i.SequenceNumber).ToList();
            var current = installment.DueDate;
            foreach (var next in later)
            {
                current = AddFrequency(current, plan.Frequency, 1);
                next.DueDate = current;
                next.ModifiedBy = modifiedBy;
                next.ModifiedAt = DateTime.UtcNow;
                UpdateStatus(next);
                _db.SalesInstallments.Update(next);
            }
        }

        await _uow.SaveChangesAsync();
        return (await GetByInvoiceAsync(invoiceId))!;
    }

    public async Task DeleteAsync(int invoiceId, string deletedBy)
    {
        var plan = await _db.SalesInstallmentPlans.Include(p => p.Installments)
            .FirstOrDefaultAsync(p => p.SalesInvoiceId == invoiceId) ?? throw new KeyNotFoundException();
        if (plan.Installments.Any(i => i.PaidAmount > 0))
            throw new InvalidOperationException("No se puede eliminar un plan con cuotas pagadas.");
        plan.IsDeleted = true; plan.DeletedBy = deletedBy; plan.DeletedAt = DateTime.UtcNow;
        foreach (var i in plan.Installments) { i.IsDeleted = true; i.DeletedBy = deletedBy; i.DeletedAt = DateTime.UtcNow; }
        _db.SalesInstallmentPlans.Update(plan);
        _db.SalesInstallments.UpdateRange(plan.Installments);
        await _uow.SaveChangesAsync();
    }

    public async Task PayInstallmentAsync(int invoiceId, int installmentId, PayInstallmentDto dto, string createdBy)
    {
        var plan = await _db.SalesInstallmentPlans.Include(p => p.Installments)
            .FirstOrDefaultAsync(p => p.SalesInvoiceId == invoiceId) ?? throw new KeyNotFoundException();
        var installment = plan.Installments.FirstOrDefault(i => i.Id == installmentId)
            ?? throw new KeyNotFoundException("Cuota no encontrada.");

        var balance = installment.Amount - installment.PaidAmount;
        if (dto.Amount <= 0 || dto.Amount > balance + 0.001m)
            throw new InvalidOperationException($"Monto fuera de rango (pendiente {balance:F2}).");

        await _payments.CreateAsync(invoiceId, new CreateSalesPaymentDto(
            dto.PaymentMethodId, dto.PaymentDate, dto.Amount, dto.Reference, dto.Notes), createdBy);

        // Link the just-created payment to this installment (newest one for the invoice).
        var latestPayment = await _db.SalesPayments
            .Where(p => p.SalesInvoiceId == invoiceId)
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync();
        if (latestPayment != null)
        {
            latestPayment.SalesInstallmentId = installmentId;
            _db.SalesPayments.Update(latestPayment);
        }

        installment.PaidAmount += dto.Amount;
        UpdateStatus(installment);
        installment.ModifiedBy = createdBy;
        installment.ModifiedAt = DateTime.UtcNow;
        _db.SalesInstallments.Update(installment);

        if (plan.Installments.All(i => i.Status == "paid"))
        {
            plan.Status = "completed";
            plan.ModifiedBy = createdBy;
            plan.ModifiedAt = DateTime.UtcNow;
            _db.SalesInstallmentPlans.Update(plan);
        }

        await _uow.SaveChangesAsync();
    }

    public async Task<IEnumerable<InstallmentPlanListItemDto>> GetAllAsync(string? status = null)
    {
        var q = _db.SalesInstallmentPlans
            .Include(p => p.Installments)
            .Include(p => p.SalesInvoice).ThenInclude(i => i.Client)
            .AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(p => p.Status == status);
        var plans = await q.OrderByDescending(p => p.CreatedAt).ToListAsync();

        var today = DateTime.UtcNow.Date;
        return plans.Select(p =>
        {
            var paid = p.Installments.Sum(i => i.PaidAmount);
            var overdue = p.Installments.Where(i => i.DueDate < today && i.Status != "paid").ToList();
            var pending = p.Installments.Where(i => i.Status != "paid").ToList();
            return new InstallmentPlanListItemDto(
                p.Id, p.Code, p.SalesInvoiceId, p.SalesInvoice.FullNumber,
                p.SalesInvoice.ClientId, p.SalesInvoice.Client.BusinessName,
                p.Frequency, p.NumberOfInstallments, p.StartDate,
                p.TotalAmount, paid, p.TotalAmount - paid,
                pending.Count, overdue.Count,
                overdue.Sum(i => i.Amount - i.PaidAmount),
                pending.OrderBy(i => i.DueDate).FirstOrDefault()?.DueDate,
                p.Status
            );
        });
    }

    public async Task<OverdueInstallmentReportDto> GetOverdueReportAsync()
    {
        var today = DateTime.UtcNow.Date;
        var overdueData = await _db.SalesInstallments
            .Include(i => i.Plan).ThenInclude(p => p.SalesInvoice).ThenInclude(i => i.Client)
            .Where(i => i.DueDate < today && i.Status != "paid" && i.Plan.Status == "active")
            .OrderBy(i => i.DueDate)
            .ToListAsync();
        var items = overdueData.Select(i => new OverdueInstallmentReportItemDto(
            i.Id, i.SalesInstallmentPlanId, i.Plan.SalesInvoiceId, i.Plan.SalesInvoice.FullNumber,
            i.Plan.SalesInvoice.ClientId, i.Plan.SalesInvoice.Client.BusinessName, i.Plan.SalesInvoice.Client.Phone,
            i.SequenceNumber, i.Plan.NumberOfInstallments,
            i.DueDate, (today - i.DueDate.Date).Days,
            i.Amount, i.PaidAmount, i.Amount - i.PaidAmount));
        return new OverdueInstallmentReportDto(overdueData.Count,
            overdueData.Sum(i => i.Amount - i.PaidAmount), items);
    }

    private static int FrequencyDays(string freq) => freq switch
    {
        "weekly" => 7, "biweekly" => 14, _ => 30
    };

    private static DateTime AddFrequency(DateTime from, string freq, int steps) => freq switch
    {
        "weekly" => from.AddDays(7 * steps),
        "biweekly" => from.AddDays(14 * steps),
        _ => from.AddMonths(steps),
    };

    private static void UpdateStatus(SalesInstallment i)
    {
        if (i.PaidAmount >= i.Amount - 0.001m) i.Status = "paid";
        else if (i.PaidAmount > 0) i.Status = "partially_paid";
        else i.Status = i.DueDate.Date < DateTime.UtcNow.Date ? "overdue" : "pending";
    }

    private static InstallmentPlanDto Map(SalesInstallmentPlan plan)
    {
        var today = DateTime.UtcNow.Date;
        var items = plan.Installments.OrderBy(i => i.SequenceNumber).Select(i =>
        {
            var isOverdue = i.Status != "paid" && i.DueDate.Date < today;
            var effectiveStatus = isOverdue && i.Status != "partially_paid" ? "overdue" : i.Status;
            return new InstallmentDto(i.Id, i.SequenceNumber, i.DueDate, i.Amount, i.PaidAmount,
                i.Amount - i.PaidAmount, effectiveStatus, isOverdue);
        }).ToList();
        var paid = plan.Installments.Sum(i => i.PaidAmount);
        return new InstallmentPlanDto(
            plan.Id, plan.Code, plan.SalesInvoiceId, plan.SalesInvoice.FullNumber,
            plan.SalesInvoice.ClientId, plan.SalesInvoice.Client.BusinessName,
            plan.Frequency, plan.NumberOfInstallments, plan.StartDate,
            plan.TotalAmount, paid, plan.TotalAmount - paid,
            plan.Installments.Count(i => i.Status != "paid"),
            plan.Installments.Count(i => i.DueDate < today && i.Status != "paid"),
            plan.Status, items);
    }
}
