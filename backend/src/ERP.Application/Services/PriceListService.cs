using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.PriceLists;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class PriceListService : IPriceListService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public PriceListService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<PagedResultDto<PriceListListDto>> GetAllAsync(QueryParamsDto query)
    {
        var q = _db.PriceLists.Include(pl => pl.Items).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search)) { var p = $"%{query.Search}%"; q = q.Where(pl => EF.Functions.Like(pl.Name, p)); }
        var total = await q.CountAsync();
        var items = await q.OrderBy(pl => pl.Name).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(pl => new PriceListListDto(pl.Id, pl.Code, pl.Name, pl.Description, pl.Currency, pl.IsActive, pl.Items.Count, pl.CreatedAt))
            .ToListAsync();
        return new PagedResultDto<PriceListListDto>(items, total, query.Page, query.PageSize, (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<PriceListDetailDto> GetByIdAsync(int id)
    {
        var pl = await _db.PriceLists.Include(pl => pl.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(pl => pl.Id == id) ?? throw new KeyNotFoundException();
        return MapToDetail(pl);
    }

    public async Task<PriceListDetailDto> CreateAsync(CreatePriceListDto dto, string createdBy)
    {
        var pl = new PriceList { Code = dto.Code, Name = dto.Name, Description = dto.Description, Currency = dto.Currency, CreatedBy = createdBy };
        _db.PriceLists.Add(pl);
        var products = await _db.Products.Where(p => p.IsActive).ToListAsync();
        foreach (var prod in products)
            pl.Items.Add(new PriceListItem { ProductId = prod.Id, PricingMode = "percentage", ProfitPercentage = 0, FinalPrice = prod.LastPurchasePrice, Code = Guid.NewGuid().ToString("N")[..8].ToUpper(), CreatedBy = createdBy });
        await _uow.SaveChangesAsync();
        return await GetByIdAsync(pl.Id);
    }

    public async Task<PriceListDetailDto> UpdateAsync(int id, UpdatePriceListDto dto, string modifiedBy)
    {
        var pl = await _db.PriceLists.FindAsync(id) ?? throw new KeyNotFoundException();
        pl.Name = dto.Name; pl.Description = dto.Description; pl.Currency = dto.Currency; pl.IsActive = dto.IsActive;
        pl.ModifiedBy = modifiedBy; pl.ModifiedAt = DateTime.UtcNow;
        _db.PriceLists.Update(pl); await _uow.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var pl = await _db.PriceLists.FindAsync(id) ?? throw new KeyNotFoundException();
        pl.IsDeleted = true; pl.DeletedBy = deletedBy; pl.DeletedAt = DateTime.UtcNow;
        _db.PriceLists.Update(pl); await _uow.SaveChangesAsync();
    }

    public async Task UpsertItemAsync(int priceListId, UpsertPriceListItemDto dto, string modifiedBy)
    {
        var item = await _db.PriceListItems.FirstOrDefaultAsync(i => i.PriceListId == priceListId && i.ProductId == dto.ProductId);
        var product = await _db.Products.FindAsync(dto.ProductId) ?? throw new KeyNotFoundException();
        var finalPrice = dto.PricingMode == "percentage"
            ? product.AveragePurchasePrice * (1 + dto.ProfitPercentage / 100)
            : dto.FixedPrice;
        if (item == null)
        {
            _db.PriceListItems.Add(new PriceListItem { PriceListId = priceListId, ProductId = dto.ProductId, PricingMode = dto.PricingMode, ProfitPercentage = dto.ProfitPercentage, FixedPrice = dto.FixedPrice, FinalPrice = finalPrice, Code = Guid.NewGuid().ToString("N")[..8].ToUpper(), CreatedBy = modifiedBy });
        }
        else
        {
            item.PricingMode = dto.PricingMode; item.ProfitPercentage = dto.ProfitPercentage;
            item.FixedPrice = dto.FixedPrice; item.FinalPrice = finalPrice;
            item.ModifiedBy = modifiedBy; item.ModifiedAt = DateTime.UtcNow;
            _db.PriceListItems.Update(item);
        }
        await _uow.SaveChangesAsync();
    }

    public async Task RemoveItemAsync(int priceListId, int productId, string modifiedBy)
    {
        var item = await _db.PriceListItems.FirstOrDefaultAsync(i => i.PriceListId == priceListId && i.ProductId == productId);
        if (item != null) { _db.PriceListItems.Remove(item); await _uow.SaveChangesAsync(); }
    }

    public async Task BulkUpdateAsync(int priceListId, BulkUpdatePriceListDto dto, string modifiedBy)
    {
        var items = await _db.PriceListItems.Include(i => i.Product).Where(i => i.PriceListId == priceListId).ToListAsync();
        foreach (var item in items)
        {
            item.PricingMode = dto.PricingMode;
            item.ProfitPercentage = dto.ProfitPercentage;
            item.FinalPrice = item.Product.AveragePurchasePrice * (1 + dto.ProfitPercentage / 100);
            item.ModifiedBy = modifiedBy; item.ModifiedAt = DateTime.UtcNow;
        }
        await _uow.SaveChangesAsync();
    }

    public async Task RecalculatePricesAsync(int priceListId)
    {
        var items = await _db.PriceListItems.Include(i => i.Product).Where(i => i.PriceListId == priceListId && i.PricingMode == "percentage").ToListAsync();
        foreach (var item in items)
            item.FinalPrice = item.Product.AveragePurchasePrice * (1 + item.ProfitPercentage / 100);
        await _uow.SaveChangesAsync();
    }

    private static PriceListDetailDto MapToDetail(PriceList pl) => new(
        pl.Id, pl.Code, pl.Name, pl.Description, pl.Currency, pl.IsActive, pl.CreatedAt,
        pl.Items.Select(i => new PriceListItemDto(i.Id, i.ProductId, i.Product.Code, i.Product.Name, i.Product.Unit,
            i.Product.LastPurchasePrice, i.PricingMode, i.ProfitPercentage, i.FixedPrice, i.FinalPrice)));
}
