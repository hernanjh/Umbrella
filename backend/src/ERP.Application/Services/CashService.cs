using ERP.Application.DTOs.Cash;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class CashService : ICashService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public CashService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<CashSessionDetailDto?> GetCurrentAsync()
    {
        var session = await _db.CashSessions
            .Include(s => s.Movements).ThenInclude(m => m.PaymentMethod)
            .Where(s => s.Status == "open")
            .OrderByDescending(s => s.OpeningDate)
            .FirstOrDefaultAsync();
        return session == null ? null : MapDetail(session);
    }

    public async Task<IEnumerable<CashSessionListDto>> GetSessionsAsync(DateTime? from = null, DateTime? to = null)
    {
        var q = _db.CashSessions.AsQueryable();
        if (from.HasValue) q = q.Where(s => s.OpeningDate >= from.Value);
        if (to.HasValue) q = q.Where(s => s.OpeningDate <= to.Value);
        return await q.OrderByDescending(s => s.OpeningDate)
            .Select(s => new CashSessionListDto(
                s.Id, s.Code, s.OpeningDate, s.OpeningBalance, s.ClosingDate,
                s.CountedBalance, s.ExpectedBalance, s.DifferenceAmount, s.Status,
                s.CreatedBy, s.ClosedBy, s.Movements.Count))
            .ToListAsync();
    }

    public async Task<CashSessionDetailDto> GetSessionAsync(int id)
    {
        var session = await _db.CashSessions
            .Include(s => s.Movements).ThenInclude(m => m.PaymentMethod)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException($"Sesión de caja {id} no encontrada.");
        return MapDetail(session);
    }

    public async Task<CashSessionDetailDto> OpenAsync(OpenCashSessionDto dto, string createdBy)
    {
        if (await _db.CashSessions.AnyAsync(s => s.Status == "open"))
            throw new InvalidOperationException("Ya existe una sesión de caja abierta.");

        var session = new CashSession
        {
            Code = $"CJ{DateTime.UtcNow:yyyyMMddHHmmss}",
            OpeningDate = DateTime.UtcNow,
            OpeningBalance = dto.OpeningBalance,
            Notes = dto.Notes,
            Status = "open",
            CreatedBy = createdBy,
        };
        _db.CashSessions.Add(session);
        await _uow.SaveChangesAsync();

        if (dto.OpeningBalance > 0)
        {
            _db.CashMovements.Add(new CashMovement
            {
                Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                CashSessionId = session.Id,
                MovementDate = session.OpeningDate,
                Type = "opening",
                Amount = dto.OpeningBalance,
                Description = "Apertura de caja",
                CreatedBy = createdBy,
            });
            await _uow.SaveChangesAsync();
        }

        return await GetSessionAsync(session.Id);
    }

    public async Task<CashSessionDetailDto> CloseAsync(int id, CloseCashSessionDto dto, string closedBy)
    {
        var session = await _db.CashSessions.Include(s => s.Movements)
            .FirstOrDefaultAsync(s => s.Id == id) ?? throw new KeyNotFoundException();
        if (session.Status != "open") throw new InvalidOperationException("La sesión ya está cerrada.");

        var expected = ComputeBalance(session);
        session.ClosingDate = DateTime.UtcNow;
        session.CountedBalance = dto.CountedBalance;
        session.ExpectedBalance = expected;
        session.DifferenceAmount = dto.CountedBalance - expected;
        session.Status = "closed";
        session.ClosedBy = closedBy;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
            session.Notes = string.IsNullOrWhiteSpace(session.Notes) ? dto.Notes : session.Notes + "\n" + dto.Notes;
        session.ModifiedBy = closedBy;
        session.ModifiedAt = DateTime.UtcNow;

        _db.CashMovements.Add(new CashMovement
        {
            Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
            CashSessionId = session.Id,
            MovementDate = session.ClosingDate.Value,
            Type = "closing",
            Amount = dto.CountedBalance,
            Description = $"Cierre de caja (esperado: {expected:F2}, contado: {dto.CountedBalance:F2}, dif: {session.DifferenceAmount:F2})",
            CreatedBy = closedBy,
        });

        _db.CashSessions.Update(session);
        await _uow.SaveChangesAsync();
        return await GetSessionAsync(id);
    }

    public async Task<CashMovementDto> AddMovementAsync(int sessionId, AddCashMovementDto dto, string createdBy)
    {
        var session = await _db.CashSessions.FindAsync(sessionId) ?? throw new KeyNotFoundException();
        if (session.Status != "open") throw new InvalidOperationException("La sesión está cerrada.");
        if (dto.Amount <= 0) throw new InvalidOperationException("Monto inválido.");
        if (dto.Type != "income" && dto.Type != "expense" && dto.Type != "adjustment")
            throw new InvalidOperationException("Tipo de movimiento inválido.");

        var method = dto.PaymentMethodId.HasValue ? await _db.PaymentMethods.FindAsync(dto.PaymentMethodId.Value) : null;

        var movement = new CashMovement
        {
            Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
            CashSessionId = sessionId,
            MovementDate = DateTime.UtcNow,
            Type = dto.Type,
            Amount = dto.Amount,
            PaymentMethodId = dto.PaymentMethodId,
            Description = dto.Description ?? "",
            CreatedBy = createdBy,
        };
        _db.CashMovements.Add(movement);
        await _uow.SaveChangesAsync();

        return new CashMovementDto(
            movement.Id, movement.CashSessionId, movement.MovementDate, movement.Type, movement.Amount,
            movement.PaymentMethodId, method?.Name, movement.ReferenceType, movement.ReferenceId,
            movement.Description, movement.CreatedBy, movement.CreatedAt);
    }

    public async Task DeleteMovementAsync(int movementId, string deletedBy)
    {
        var movement = await _db.CashMovements.FirstOrDefaultAsync(m => m.Id == movementId)
            ?? throw new KeyNotFoundException();
        if (movement.Type == "opening" || movement.Type == "closing")
            throw new InvalidOperationException("No se puede anular un movimiento de apertura/cierre.");
        var session = await _db.CashSessions.FindAsync(movement.CashSessionId);
        if (session?.Status != "open") throw new InvalidOperationException("La sesión está cerrada.");

        movement.IsDeleted = true;
        movement.DeletedBy = deletedBy;
        movement.DeletedAt = DateTime.UtcNow;
        _db.CashMovements.Update(movement);
        await _uow.SaveChangesAsync();
    }

    private static decimal ComputeBalance(CashSession session)
    {
        decimal income = 0, expense = 0;
        foreach (var m in session.Movements.Where(m => !m.IsDeleted))
        {
            if (m.Type == "income" || m.Type == "opening") income += m.Amount;
            else if (m.Type == "expense") expense += m.Amount;
            else if (m.Type == "adjustment") income += m.Amount; // positive adjustment; negative via expense
        }
        return income - expense;
    }

    private static CashSessionDetailDto MapDetail(CashSession s)
    {
        var active = s.Movements.Where(m => !m.IsDeleted).ToList();
        var totalIncome = active.Where(m => m.Type == "income" || m.Type == "opening").Sum(m => m.Amount);
        var totalExpense = active.Where(m => m.Type == "expense").Sum(m => m.Amount);
        var adjustments = active.Where(m => m.Type == "adjustment").Sum(m => m.Amount);
        var current = totalIncome - totalExpense + adjustments;
        return new CashSessionDetailDto(
            s.Id, s.Code, s.OpeningDate, s.OpeningBalance, s.ClosingDate,
            s.CountedBalance, s.ExpectedBalance, s.DifferenceAmount, s.Status,
            s.CreatedBy, s.ClosedBy, s.Notes, totalIncome, totalExpense, current,
            active.OrderByDescending(m => m.MovementDate).Select(m => new CashMovementDto(
                m.Id, m.CashSessionId, m.MovementDate, m.Type, m.Amount,
                m.PaymentMethodId, m.PaymentMethod?.Name, m.ReferenceType, m.ReferenceId,
                m.Description, m.CreatedBy, m.CreatedAt)));
    }
}
