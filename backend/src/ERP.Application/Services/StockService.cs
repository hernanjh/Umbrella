using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Stock;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class StockService : IStockService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public StockService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<IEnumerable<StockStatusDto>> GetStockStatusAsync(int? locationId = null, int? categoryId = null)
    {
        var q = _db.Products.Include(p => p.Category).Include(p => p.StockEntries).ThenInclude(s => s.StockLocation).AsQueryable();
        if (categoryId.HasValue) q = q.Where(p => p.CategoryId == categoryId);
        var products = await q.ToListAsync();
        return products.Select(p =>
        {
            var entries = locationId.HasValue ? p.StockEntries.Where(s => s.StockLocationId == locationId).ToList() : p.StockEntries.ToList();
            var total = entries.Sum(s => s.Quantity);
            return new StockStatusDto(p.Id, p.Code, p.Name, total, p.MinimumStock, total < p.MinimumStock,
                entries.Select(s => new StockByLocationDto(s.StockLocationId, s.StockLocation.Name, s.StockLocation.Type, s.Quantity)));
        });
    }

    public async Task<StockStatusDto> GetProductStockAsync(int productId)
    {
        var p = await _db.Products.Include(p => p.StockEntries).ThenInclude(s => s.StockLocation)
            .FirstOrDefaultAsync(p => p.Id == productId) ?? throw new KeyNotFoundException();
        var total = p.StockEntries.Sum(s => s.Quantity);
        return new StockStatusDto(p.Id, p.Code, p.Name, total, p.MinimumStock, total < p.MinimumStock,
            p.StockEntries.Select(s => new StockByLocationDto(s.StockLocationId, s.StockLocation.Name, s.StockLocation.Type, s.Quantity)));
    }

    public async Task<PagedResultDto<StockMovementListDto>> GetMovementsAsync(QueryParamsDto query, int? productId = null, int? locationId = null)
    {
        var q = _db.StockMovements.Include(m => m.Product).Include(m => m.StockLocation).AsQueryable();
        if (productId.HasValue) q = q.Where(m => m.ProductId == productId);
        if (locationId.HasValue) q = q.Where(m => m.StockLocationId == locationId);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(m => m.CreatedAt).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(m => new StockMovementListDto(m.Id, m.Product.Name, m.StockLocation.Name, m.Quantity, m.MovementType,
                m.ReferenceType, m.ReferenceId, m.Reason, m.StockBefore, m.StockAfter, m.CreatedAt, m.CreatedBy))
            .ToListAsync();
        return new PagedResultDto<StockMovementListDto>(items, total, query.Page, query.PageSize, (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<PagedResultDto<StockAdjustmentListDto>> GetAdjustmentsAsync(QueryParamsDto query)
    {
        var q = _db.StockAdjustments.Include(a => a.Items).AsQueryable();
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(a => a.AdjustmentDate).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(a => new StockAdjustmentListDto(a.Id, a.Code, a.Reason, a.Status, a.AdjustmentDate,
                a.ApprovedBy, a.Items.Count, a.CreatedAt, a.CreatedBy))
            .ToListAsync();
        return new PagedResultDto<StockAdjustmentListDto>(items, total, query.Page, query.PageSize, (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<int> CreateAdjustmentAsync(CreateStockAdjustmentDto dto, string createdBy)
    {
        var adj = new StockAdjustment
        {
            Code = $"AJ{DateTime.UtcNow:yyyyMMddHHmmss}",
            Reason = dto.Reason, Notes = dto.Notes,
            AdjustmentDate = dto.AdjustmentDate, Status = "draft",
            ApprovedBy = createdBy, CreatedBy = createdBy
        };
        foreach (var item in dto.Items)
        {
            var stock = await _db.StockEntries.FirstOrDefaultAsync(s => s.ProductId == item.ProductId && s.StockLocationId == item.StockLocationId);
            var before = stock?.Quantity ?? 0;
            adj.Items.Add(new StockAdjustmentItem
            {
                Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                ProductId = item.ProductId, StockLocationId = item.StockLocationId,
                QuantityBefore = before, QuantityAfter = item.NewQuantity,
                QuantityDifference = item.NewQuantity - before, CreatedBy = createdBy
            });
        }
        _db.StockAdjustments.Add(adj);
        await _uow.SaveChangesAsync();
        return adj.Id;
    }

    public async Task ConfirmAdjustmentAsync(int adjustmentId, string confirmedBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var adj = await _db.StockAdjustments.Include(a => a.Items).FirstOrDefaultAsync(a => a.Id == adjustmentId)
                ?? throw new KeyNotFoundException();
            if (adj.Status != "draft") throw new InvalidOperationException("Solo se pueden confirmar ajustes en borrador.");
            foreach (var item in adj.Items)
            {
                var stock = await _db.StockEntries.FirstOrDefaultAsync(s => s.ProductId == item.ProductId && s.StockLocationId == item.StockLocationId);
                if (stock == null)
                {
                    stock = new StockEntry { Code = Guid.NewGuid().ToString("N")[..8].ToUpper(), ProductId = item.ProductId, StockLocationId = item.StockLocationId, Quantity = 0, CreatedBy = confirmedBy };
                    _db.StockEntries.Add(stock); await _db.SaveChangesAsync();
                }
                var before = stock.Quantity;
                stock.Quantity = item.QuantityAfter;
                _db.StockEntries.Update(stock);
                _db.StockMovements.Add(new StockMovement
                {
                    Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                    ProductId = item.ProductId, StockLocationId = item.StockLocationId,
                    Quantity = item.QuantityDifference, MovementType = "Adjustment",
                    ReferenceType = "StockAdjustment", ReferenceId = adj.Id,
                    Reason = adj.Reason, StockBefore = before, StockAfter = stock.Quantity, CreatedBy = confirmedBy
                });
            }
            adj.Status = "confirmed"; adj.ApprovedBy = confirmedBy;
            adj.ModifiedBy = confirmedBy; adj.ModifiedAt = DateTime.UtcNow;
            _db.StockAdjustments.Update(adj);
            await _uow.CommitTransactionAsync();
        }
        catch { await _uow.RollbackTransactionAsync(); throw; }
    }

    public async Task<IEnumerable<StockLocationListDto>> GetLocationsAsync()
        => await _db.StockLocations.Include(l => l.ResponsibleUser)
            .Select(l => new StockLocationListDto(l.Id, l.Code, l.Name, l.Type, l.IsActive,
                l.ResponsibleUser != null ? l.ResponsibleUser.FirstName + " " + l.ResponsibleUser.LastName : null, l.CreatedAt))
            .ToListAsync();

    public async Task<StockLocationListDto> CreateLocationAsync(CreateStockLocationDto dto, string createdBy)
    {
        var loc = new StockLocation { Code = dto.Code, Name = dto.Name, Description = dto.Description, Type = dto.Type, ResponsibleUserId = dto.ResponsibleUserId, CreatedBy = createdBy };
        _db.StockLocations.Add(loc); await _uow.SaveChangesAsync();
        return new StockLocationListDto(loc.Id, loc.Code, loc.Name, loc.Type, loc.IsActive, null, loc.CreatedAt);
    }

    public async Task<StockLocationListDto> UpdateLocationAsync(int id, UpdateStockLocationDto dto, string modifiedBy)
    {
        var loc = await _db.StockLocations.FindAsync(id) ?? throw new KeyNotFoundException();
        loc.Name = dto.Name; loc.Description = dto.Description; loc.Type = dto.Type;
        loc.IsActive = dto.IsActive; loc.ResponsibleUserId = dto.ResponsibleUserId;
        loc.ModifiedBy = modifiedBy; loc.ModifiedAt = DateTime.UtcNow;
        _db.StockLocations.Update(loc); await _uow.SaveChangesAsync();
        return new StockLocationListDto(loc.Id, loc.Code, loc.Name, loc.Type, loc.IsActive, null, loc.CreatedAt);
    }

    public async Task DeleteLocationAsync(int id, string deletedBy)
    {
        var loc = await _db.StockLocations.FindAsync(id) ?? throw new KeyNotFoundException();
        var hasStock = await _db.StockEntries.AnyAsync(s => s.StockLocationId == id && s.Quantity > 0);
        if (hasStock) throw new InvalidOperationException("No se puede eliminar una locación con stock.");
        loc.IsDeleted = true; loc.DeletedBy = deletedBy; loc.DeletedAt = DateTime.UtcNow;
        _db.StockLocations.Update(loc); await _uow.SaveChangesAsync();
    }
}
