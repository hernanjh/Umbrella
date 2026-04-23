using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Suppliers;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public SupplierService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<PagedResultDto<SupplierListDto>> GetAllAsync(QueryParamsDto query)
    {
        var q = _db.Suppliers.Include(s => s.VatCondition).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var p = $"%{query.Search}%";
            q = q.Where(s => EF.Functions.Like(s.BusinessName, p) || EF.Functions.Like(s.Cuit, p));
        }
        if (query.IncludeDeleted) q = q.IgnoreQueryFilters();
        var total = await q.CountAsync();
        var items = await q.OrderBy(s => s.BusinessName)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(s => new SupplierListDto(s.Id, s.Code, s.BusinessName, s.TradeName, s.Cuit,
                s.Email, s.Phone, s.City, s.IsActive,
                s.VatCondition != null ? s.VatCondition.Name : null, s.CreatedAt))
            .ToListAsync();
        return new PagedResultDto<SupplierListDto>(items, total, query.Page, query.PageSize,
            (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<SupplierDetailDto> GetByIdAsync(int id)
    {
        var s = await _db.Suppliers
            .Include(s => s.VatCondition)
            .Include(s => s.PaymentCondition)
            .FirstOrDefaultAsync(s => s.Id == id) ?? throw new KeyNotFoundException();
        return MapToDetail(s);
    }

    public async Task<IEnumerable<SupplierSearchDto>> SearchAsync(string term)
    {
        var p = $"%{term}%";
        return await _db.Suppliers
            .Where(s => EF.Functions.Like(s.BusinessName, p) || EF.Functions.Like(s.Cuit, p) || EF.Functions.Like(s.Code, p))
            .Take(20)
            .Select(s => new SupplierSearchDto(s.Id, s.Code, s.BusinessName, s.Cuit))
            .ToListAsync();
    }

    public async Task<SupplierDetailDto> CreateAsync(CreateSupplierDto dto, string createdBy)
    {
        if (await _db.Suppliers.AnyAsync(s => s.Code == dto.Code))
            throw new InvalidOperationException($"Código '{dto.Code}' ya existe.");
        var supplier = new Supplier
        {
            Code = dto.Code, BusinessName = dto.BusinessName, TradeName = dto.TradeName,
            Cuit = dto.Cuit, Email = dto.Email, Phone = dto.Phone, Mobile = dto.Mobile,
            Address = dto.Address, City = dto.City, Province = dto.Province,
            PostalCode = dto.PostalCode, Country = dto.Country ?? "Argentina",
            ContactPerson = dto.ContactPerson, Website = dto.Website,
            BankAccount = dto.BankAccount, Notes = dto.Notes,
            VatConditionId = dto.VatConditionId, PaymentConditionId = dto.PaymentConditionId,
            CreatedBy = createdBy
        };
        _db.Suppliers.Add(supplier);
        await _uow.SaveChangesAsync();
        return await GetByIdAsync(supplier.Id);
    }

    public async Task<SupplierDetailDto> UpdateAsync(int id, UpdateSupplierDto dto, string modifiedBy)
    {
        var s = await _db.Suppliers.FindAsync(id) ?? throw new KeyNotFoundException();
        s.BusinessName = dto.BusinessName; s.TradeName = dto.TradeName; s.Cuit = dto.Cuit;
        s.Email = dto.Email; s.Phone = dto.Phone; s.Mobile = dto.Mobile;
        s.Address = dto.Address; s.City = dto.City; s.Province = dto.Province;
        s.PostalCode = dto.PostalCode; s.Country = dto.Country;
        s.ContactPerson = dto.ContactPerson; s.Website = dto.Website;
        s.BankAccount = dto.BankAccount; s.Notes = dto.Notes; s.IsActive = dto.IsActive;
        s.VatConditionId = dto.VatConditionId; s.PaymentConditionId = dto.PaymentConditionId;
        s.ModifiedBy = modifiedBy; s.ModifiedAt = DateTime.UtcNow;
        _db.Suppliers.Update(s);
        await _uow.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var s = await _db.Suppliers.FindAsync(id) ?? throw new KeyNotFoundException();
        s.IsDeleted = true; s.DeletedBy = deletedBy; s.DeletedAt = DateTime.UtcNow;
        _db.Suppliers.Update(s); await _uow.SaveChangesAsync();
    }

    public async Task RestoreAsync(int id, string restoredBy)
    {
        var s = await _db.Suppliers.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException();
        s.IsDeleted = false; s.DeletedBy = null; s.DeletedAt = null;
        s.ModifiedBy = restoredBy; s.ModifiedAt = DateTime.UtcNow;
        _db.Suppliers.Update(s); await _uow.SaveChangesAsync();
    }

    private static SupplierDetailDto MapToDetail(Supplier s) => new(
        s.Id, s.Code, s.BusinessName, s.TradeName, s.Cuit, s.Email, s.Phone, s.Mobile,
        s.Address, s.City, s.Province, s.PostalCode, s.Country, s.ContactPerson,
        s.Website, s.BankAccount, s.Notes, s.IsActive,
        s.VatConditionId, s.VatCondition?.Name,
        s.PaymentConditionId, s.PaymentCondition?.Name,
        s.CreatedAt, s.CreatedBy, s.ModifiedAt, s.ModifiedBy);
}
