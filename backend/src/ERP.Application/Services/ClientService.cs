using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Clients;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class ClientService : IClientService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public ClientService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<PagedResultDto<ClientListDto>> GetAllAsync(QueryParamsDto query, int? requestingUserId = null)
    {
        var q = _db.Clients.Include(c => c.ClientType).Include(c => c.Zone).Include(c => c.AssignedSeller).AsQueryable();
        if (requestingUserId.HasValue) q = q.Where(c => c.AssignedSellerId == requestingUserId);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var p = $"%{query.Search}%";
            q = q.Where(c => EF.Functions.Like(c.BusinessName, p) || (c.Cuit != null && EF.Functions.Like(c.Cuit, p)) || (c.Email != null && EF.Functions.Like(c.Email, p)));
        }
        if (query.IncludeDeleted) q = q.IgnoreQueryFilters();
        var total = await q.CountAsync();
        var items = await q.OrderBy(c => c.BusinessName).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(c => new ClientListDto(c.Id, c.Code, c.BusinessName, c.TradeName, c.Cuit, c.Email, c.Phone, c.City,
                c.IsActive, c.ClientType != null ? c.ClientType.Name : null,
                c.Zone != null ? c.Zone.Name : null,
                c.AssignedSeller != null ? c.AssignedSeller.FirstName + " " + c.AssignedSeller.LastName : null,
                c.CurrentBalance, c.CreatedAt))
            .ToListAsync();
        return new PagedResultDto<ClientListDto>(items, total, query.Page, query.PageSize, (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<ClientDetailDto> GetByIdAsync(int id)
    {
        var c = await _db.Clients.Include(c => c.ClientType).Include(c => c.Zone)
            .Include(c => c.VatCondition).Include(c => c.PaymentCondition)
            .Include(c => c.DefaultPriceList).Include(c => c.AssignedSeller)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == id) ?? throw new KeyNotFoundException();
        return MapToDetail(c);
    }

    public async Task<IEnumerable<ClientSearchDto>> SearchAsync(string term)
    {
        var p = $"%{term ?? ""}%";
        return await _db.Clients
            .Include(c => c.DefaultPriceList)
            .Include(c => c.ClientType).ThenInclude(ct => ct!.DefaultPriceList)
            .Include(c => c.AssignedSeller)
            .Include(c => c.Zone).ThenInclude(z => z!.DefaultSeller)
            .Where(c => EF.Functions.Like(c.BusinessName, p) || (c.Cuit != null && EF.Functions.Like(c.Cuit, p)) || EF.Functions.Like(c.Code, p))
            .OrderBy(c => c.BusinessName)
            .Take(50)
            .Select(c => new ClientSearchDto(
                c.Id, c.Code, c.BusinessName, c.Cuit, c.City,
                c.DefaultPriceListId ?? (c.ClientType != null ? c.ClientType.DefaultPriceListId : null),
                c.DefaultPriceList != null ? c.DefaultPriceList.Name
                    : (c.ClientType != null && c.ClientType.DefaultPriceList != null ? c.ClientType.DefaultPriceList.Name : null),
                c.AssignedSellerId ?? (c.Zone != null ? c.Zone.DefaultSellerId : null),
                c.AssignedSeller != null ? c.AssignedSeller.FirstName + " " + c.AssignedSeller.LastName
                    : (c.Zone != null && c.Zone.DefaultSeller != null ? c.Zone.DefaultSeller.FirstName + " " + c.Zone.DefaultSeller.LastName : null)
            ))
            .ToListAsync();
    }

    public async Task<ClientDetailDto> CreateAsync(CreateClientDto dto, string createdBy)
    {
        if (await _db.Clients.AnyAsync(c => c.Code == dto.Code)) throw new InvalidOperationException($"Código '{dto.Code}' ya existe.");
        var client = new Client
        {
            Code = dto.Code, BusinessName = dto.BusinessName, TradeName = dto.TradeName,
            Cuit = dto.Cuit, Dni = dto.Dni, Email = dto.Email, Phone = dto.Phone, Mobile = dto.Mobile,
            Address = dto.Address, City = dto.City, Province = dto.Province, PostalCode = dto.PostalCode,
            Country = dto.Country ?? "Argentina", Notes = dto.Notes, CreditLimit = dto.CreditLimit,
            ClientTypeId = dto.ClientTypeId, ZoneId = dto.ZoneId, VatConditionId = dto.VatConditionId,
            PaymentConditionId = dto.PaymentConditionId, DefaultPriceListId = dto.DefaultPriceListId,
            AssignedSellerId = dto.AssignedSellerId, CreatedBy = createdBy
        };
        _db.Clients.Add(client); await _uow.SaveChangesAsync();
        return await GetByIdAsync(client.Id);
    }

    public async Task<ClientDetailDto> UpdateAsync(int id, UpdateClientDto dto, string modifiedBy)
    {
        var c = await _db.Clients.FindAsync(id) ?? throw new KeyNotFoundException();
        c.BusinessName = dto.BusinessName; c.TradeName = dto.TradeName; c.Cuit = dto.Cuit; c.Dni = dto.Dni;
        c.Email = dto.Email; c.Phone = dto.Phone; c.Mobile = dto.Mobile; c.Address = dto.Address;
        c.City = dto.City; c.Province = dto.Province; c.PostalCode = dto.PostalCode; c.Country = dto.Country;
        c.Notes = dto.Notes; c.IsActive = dto.IsActive; c.CreditLimit = dto.CreditLimit;
        c.ClientTypeId = dto.ClientTypeId; c.ZoneId = dto.ZoneId; c.VatConditionId = dto.VatConditionId;
        c.PaymentConditionId = dto.PaymentConditionId; c.DefaultPriceListId = dto.DefaultPriceListId;
        c.AssignedSellerId = dto.AssignedSellerId; c.ModifiedBy = modifiedBy; c.ModifiedAt = DateTime.UtcNow;
        _db.Clients.Update(c); await _uow.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var c = await _db.Clients.FindAsync(id) ?? throw new KeyNotFoundException();
        c.IsDeleted = true; c.DeletedBy = deletedBy; c.DeletedAt = DateTime.UtcNow;
        _db.Clients.Update(c); await _uow.SaveChangesAsync();
    }

    public async Task RestoreAsync(int id, string restoredBy)
    {
        var c = await _db.Clients.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id) ?? throw new KeyNotFoundException();
        c.IsDeleted = false; c.DeletedBy = null; c.DeletedAt = null; c.ModifiedBy = restoredBy; c.ModifiedAt = DateTime.UtcNow;
        _db.Clients.Update(c); await _uow.SaveChangesAsync();
    }

    public Task<ClientDocumentDto> AddDocumentAsync(int clientId, Stream fileStream, string fileName, string fileType, string? description, string createdBy)
        => Task.FromResult(new ClientDocumentDto(0, fileName, $"/uploads/clients/{clientId}/{fileName}", fileType, 0, description, DateTime.UtcNow));

    public async Task RemoveDocumentAsync(int documentId, string deletedBy)
    {
        var doc = await _db.ClientDocuments.FindAsync(documentId) ?? throw new KeyNotFoundException();
        doc.IsDeleted = true; doc.DeletedBy = deletedBy; doc.DeletedAt = DateTime.UtcNow;
        _db.ClientDocuments.Update(doc); await _uow.SaveChangesAsync();
    }

    private static ClientDetailDto MapToDetail(Client c) => new(
        c.Id, c.Code, c.BusinessName, c.TradeName, c.Cuit, c.Dni, c.Email, c.Phone, c.Mobile,
        c.Address, c.City, c.Province, c.PostalCode, c.Country, c.Notes, c.IsActive, c.CreditLimit, c.CurrentBalance,
        c.ClientTypeId, c.ClientType?.Name, c.ZoneId, c.Zone?.Name, c.VatConditionId, c.VatCondition?.Name,
        c.PaymentConditionId, c.PaymentCondition?.Name, c.DefaultPriceListId, c.DefaultPriceList?.Name,
        c.AssignedSellerId, c.AssignedSeller != null ? $"{c.AssignedSeller.FirstName} {c.AssignedSeller.LastName}" : null,
        c.CreatedAt, c.CreatedBy, c.ModifiedAt, c.ModifiedBy,
        c.Documents.Where(d => !d.IsDeleted).Select(d => new ClientDocumentDto(d.Id, d.FileName, d.FileUrl, d.FileType, d.FileSizeBytes, d.Description, d.CreatedAt)));
}
