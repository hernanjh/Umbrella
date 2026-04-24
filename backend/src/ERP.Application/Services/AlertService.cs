using ERP.Application.DTOs.Alerts;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class AlertService : IAlertService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserContext _user;

    public AlertService(AppDbContext db, IUnitOfWork uow, ICurrentUserContext user)
    {
        _db = db;
        _uow = uow;
        _user = user;
    }

    public async Task<AlertListDto> GetForCurrentUserAsync()
    {
        if (!_user.IsAuthenticated)
            return new AlertListDto(0, 0, Array.Empty<AlertDto>());

        var alerts = new List<AlertDto>();

        // 1) Low stock (module "stock")
        if (_user.HasPermission("stock", "read") || _user.HasPermission("stock", "write"))
            alerts.AddRange(await LowStockAlertsAsync());

        // 2) Overdue installments (module "receivables")
        if (_user.HasPermission("receivables", "read") || _user.HasPermission("receivables", "write"))
            alerts.AddRange(await OverdueInstallmentAlertsAsync());

        // 3) Overdue invoices without installment plan (module "receivables")
        if (_user.HasPermission("receivables", "read") || _user.HasPermission("receivables", "write"))
            alerts.AddRange(await OverdueReceivableAlertsAsync());

        // 4) Overdue payables (module "payables") — sellers do not see these
        if (!_user.IsZoneScoped &&
            (_user.HasPermission("payables", "read") || _user.HasPermission("payables", "write")))
            alerts.AddRange(await OverduePayableAlertsAsync());

        // 5) Cash session open > 24h (module "cash")
        if (!_user.IsZoneScoped &&
            (_user.HasPermission("cash", "read") || _user.HasPermission("cash", "write")))
            alerts.AddRange(await StaleCashSessionAlertsAsync());

        // Merge with user's read marks
        var keys = alerts.Select(a => a.Key).ToList();
        var readKeys = await _db.NotificationReads
            .Where(n => n.UserId == _user.UserId && keys.Contains(n.AlertKey))
            .Select(n => n.AlertKey)
            .ToListAsync();
        var readSet = readKeys.ToHashSet();

        var items = alerts
            .Select(a => a with { IsRead = readSet.Contains(a.Key) })
            .OrderBy(a => a.IsRead)                 // unread first
            .ThenByDescending(a => a.Severity == "error" ? 2 : a.Severity == "warning" ? 1 : 0)
            .ThenByDescending(a => a.CreatedAt)
            .ToList();

        return new AlertListDto(items.Count, items.Count(a => !a.IsRead), items);
    }

    public async Task MarkReadAsync(IEnumerable<string> keys)
    {
        if (!_user.IsAuthenticated) return;
        var now = DateTime.UtcNow;
        foreach (var key in keys.Distinct())
        {
            var existing = await _db.NotificationReads
                .FirstOrDefaultAsync(n => n.UserId == _user.UserId && n.AlertKey == key);
            if (existing == null)
            {
                _db.NotificationReads.Add(new NotificationRead
                {
                    UserId = _user.UserId, AlertKey = key, ReadAt = now
                });
            }
        }
        await _uow.SaveChangesAsync();
    }

    public async Task MarkAllReadAsync()
    {
        var list = await GetForCurrentUserAsync();
        await MarkReadAsync(list.Items.Where(i => !i.IsRead).Select(i => i.Key));
    }

    // =========================================================================
    // Alert sources
    // =========================================================================

    private async Task<IEnumerable<AlertDto>> LowStockAlertsAsync()
    {
        var products = await _db.Products
            .Include(p => p.StockEntries)
            .Where(p => p.MinimumStock > 0)
            .ToListAsync();
        var now = DateTime.UtcNow;
        return products
            .Where(p => p.StockEntries.Sum(s => s.Quantity) < p.MinimumStock)
            .Select(p =>
            {
                var total = p.StockEntries.Sum(s => s.Quantity);
                return new AlertDto(
                    Key: $"stock-min:{p.Id}",
                    Module: "stock",
                    Severity: total <= 0 ? "error" : "warning",
                    Title: "Stock bajo mínimo",
                    Description: $"{p.Name}: {total} (mínimo {p.MinimumStock})",
                    Link: "/stock",
                    CreatedAt: now,
                    IsRead: false);
            });
    }

    private async Task<IEnumerable<AlertDto>> OverdueInstallmentAlertsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var q = _db.SalesInstallments
            .Include(s => s.Plan).ThenInclude(p => p.SalesInvoice).ThenInclude(si => si.Client)
            .Where(s => s.DueDate < today && s.Status != "paid" && s.Plan.Status == "active");
        if (_user.IsZoneScoped) q = q.Where(s => s.Plan.SalesInvoice.Client.ZoneId == _user.ZoneId);
        var list = await q.ToListAsync();

        return list.Select(s =>
        {
            var days = (int)(today - s.DueDate.Date).TotalDays;
            var balance = s.Amount - s.PaidAmount;
            return new AlertDto(
                Key: $"inst-overdue:{s.Id}",
                Module: "receivables",
                Severity: days > 30 ? "error" : "warning",
                Title: "Cuota vencida",
                Description: $"{s.Plan.SalesInvoice.Client.BusinessName} · Cuota {s.SequenceNumber} · {days} día(s) de atraso · $ {balance:N2}",
                Link: "/installment-plans",
                CreatedAt: s.DueDate,
                IsRead: false);
        });
    }

    private async Task<IEnumerable<AlertDto>> OverdueReceivableAlertsAsync()
    {
        var today = DateTime.UtcNow.Date;
        // Invoices overdue that DO NOT have an active installment plan (those are already covered above)
        var plansQ = _db.SalesInstallmentPlans.Where(p => p.Status == "active").Select(p => p.SalesInvoiceId);
        var planIds = await plansQ.ToListAsync();
        var planSet = planIds.ToHashSet();

        var q = _db.SalesInvoices.Include(i => i.Client)
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid")
                        && i.BalanceDue > 0
                        && i.DueDate < today);
        if (_user.IsZoneScoped) q = q.Where(i => i.Client.ZoneId == _user.ZoneId);
        var invoices = await q.ToListAsync();

        return invoices
            .Where(i => !planSet.Contains(i.Id))
            .Select(i =>
            {
                var days = (int)(today - i.DueDate.Date).TotalDays;
                return new AlertDto(
                    Key: $"sales-overdue:{i.Id}",
                    Module: "receivables",
                    Severity: days > 30 ? "error" : "warning",
                    Title: "Factura vencida sin pagar",
                    Description: $"{i.Client.BusinessName} · {i.FullNumber} · {days} día(s) · $ {i.BalanceDue:N2}",
                    Link: "/receivables",
                    CreatedAt: i.DueDate,
                    IsRead: false);
            });
    }

    private async Task<IEnumerable<AlertDto>> OverduePayableAlertsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var invoices = await _db.PurchaseInvoices.Include(i => i.Supplier)
            .Where(i => (i.Status == "confirmed" || i.Status == "partially_paid")
                        && i.BalanceDue > 0
                        && i.DueDate < today)
            .ToListAsync();

        return invoices.Select(i =>
        {
            var days = (int)(today - i.DueDate.Date).TotalDays;
            return new AlertDto(
                Key: $"purchase-overdue:{i.Id}",
                Module: "payables",
                Severity: days > 30 ? "error" : "warning",
                Title: "Factura de compra vencida",
                Description: $"{i.Supplier.BusinessName} · {i.FullNumber} · {days} día(s) · $ {i.BalanceDue:N2}",
                Link: "/payables",
                CreatedAt: i.DueDate,
                IsRead: false);
        });
    }

    private async Task<IEnumerable<AlertDto>> StaleCashSessionAlertsAsync()
    {
        var now = DateTime.UtcNow;
        var session = await _db.CashSessions.FirstOrDefaultAsync(s => s.Status == "open");
        if (session == null) return Array.Empty<AlertDto>();
        var hoursOpen = (now - session.OpeningDate).TotalHours;
        if (hoursOpen < 24) return Array.Empty<AlertDto>();
        return new[]
        {
            new AlertDto(
                Key: $"cash-stale:{session.Id}",
                Module: "cash",
                Severity: "warning",
                Title: "Caja abierta hace más de 24h",
                Description: $"Sesión {session.Code} abierta desde {session.OpeningDate:dd/MM HH:mm}",
                Link: "/cash",
                CreatedAt: session.OpeningDate,
                IsRead: false)
        };
    }
}
