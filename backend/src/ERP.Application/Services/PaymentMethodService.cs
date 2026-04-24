using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class PaymentMethodService : IPaymentMethodService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public PaymentMethodService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<IEnumerable<PaymentMethodDto>> GetAllAsync(bool includeInactive = false)
    {
        var q = _db.PaymentMethods.AsQueryable();
        if (!includeInactive) q = q.Where(p => p.IsActive);
        return await q.OrderBy(p => p.Name)
            .Select(p => new PaymentMethodDto(p.Id, p.Code, p.Name, p.Type, p.AffectsCash, p.IsActive, p.Notes))
            .ToListAsync();
    }

    public async Task<PaymentMethodDto> CreateAsync(CreatePaymentMethodDto dto, string createdBy)
    {
        if (await _db.PaymentMethods.AnyAsync(p => p.Code == dto.Code))
            throw new InvalidOperationException($"Código '{dto.Code}' ya existe.");
        var pm = new PaymentMethod
        {
            Code = dto.Code,
            Name = dto.Name,
            Type = dto.Type,
            AffectsCash = dto.AffectsCash,
            Notes = dto.Notes,
            CreatedBy = createdBy,
        };
        _db.PaymentMethods.Add(pm);
        await _uow.SaveChangesAsync();
        return new PaymentMethodDto(pm.Id, pm.Code, pm.Name, pm.Type, pm.AffectsCash, pm.IsActive, pm.Notes);
    }

    public async Task<PaymentMethodDto> UpdateAsync(int id, UpdatePaymentMethodDto dto, string modifiedBy)
    {
        var pm = await _db.PaymentMethods.FindAsync(id) ?? throw new KeyNotFoundException();
        pm.Name = dto.Name;
        pm.Type = dto.Type;
        pm.AffectsCash = dto.AffectsCash;
        pm.IsActive = dto.IsActive;
        pm.Notes = dto.Notes;
        pm.ModifiedBy = modifiedBy;
        pm.ModifiedAt = DateTime.UtcNow;
        _db.PaymentMethods.Update(pm);
        await _uow.SaveChangesAsync();
        return new PaymentMethodDto(pm.Id, pm.Code, pm.Name, pm.Type, pm.AffectsCash, pm.IsActive, pm.Notes);
    }

    public async Task DeleteAsync(int id, string deletedBy)
    {
        var pm = await _db.PaymentMethods.FindAsync(id) ?? throw new KeyNotFoundException();
        pm.IsDeleted = true;
        pm.DeletedBy = deletedBy;
        pm.DeletedAt = DateTime.UtcNow;
        _db.PaymentMethods.Update(pm);
        await _uow.SaveChangesAsync();
    }
}
