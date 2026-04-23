using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Products;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public ProductService(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<PagedResultDto<ProductListDto>> GetAllAsync(QueryParamsDto query)
    {
        var q = _db.Products.Include(p => p.Category).Include(p => p.StockEntries).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pat = $"%{query.Search}%";
            q = q.Where(p => EF.Functions.Like(p.Name, pat) || EF.Functions.Like(p.Code, pat) || (p.Barcode != null && EF.Functions.Like(p.Barcode, pat)));
        }
        if (query.IncludeDeleted) q = q.IgnoreQueryFilters();
        var total = await q.CountAsync();
        var products = await q.OrderBy(p => p.Name).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync();
        var items = products.Select(p => new ProductListDto(p.Id, p.Code, p.Name, p.Barcode, p.Category != null ? p.Category.Name : null,
                p.Unit, p.IsActive, p.TrackStock, p.LastPurchasePrice, p.AveragePurchasePrice,
                p.StockEntries.Sum(s => s.Quantity), p.CreatedAt)).ToList();
        return new PagedResultDto<ProductListDto>(items, total, query.Page, query.PageSize, (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<ProductDetailDto> GetByIdAsync(int id)
    {
        var p = await _db.Products.Include(p => p.Category)
            .Include(p => p.StockEntries).ThenInclude(s => s.StockLocation)
            .FirstOrDefaultAsync(p => p.Id == id) ?? throw new KeyNotFoundException();
        return MapToDetail(p);
    }

    public async Task<IEnumerable<ProductSearchDto>> SearchAsync(string term)
    {
        var pat = $"%{term}%";
        var results = await _db.Products
            .Include(p => p.StockEntries).ThenInclude(s => s.StockLocation)
            .Where(p => EF.Functions.Like(p.Name, pat) || EF.Functions.Like(p.Code, pat) || (p.Barcode != null && EF.Functions.Like(p.Barcode, pat)))
            .Take(20)
            .ToListAsync();
        return results.Select(p => new ProductSearchDto(
            p.Id, p.Code, p.Name, p.Barcode, p.LastPurchasePrice,
            p.StockEntries.Sum(s => s.Quantity),
            p.StockEntries.Select(s => new ProductStockByLocationDto(s.StockLocationId, s.StockLocation.Name, s.Quantity))));
    }

    public async Task<ProductDetailDto> CreateAsync(CreateProductDto dto, string createdBy)
    {
        if (await _db.Products.AnyAsync(p => p.Code == dto.Code)) throw new InvalidOperationException($"Código '{dto.Code}' ya existe.");
        var p = new Product
        {
            Code = dto.Code, Name = dto.Name, Description = dto.Description, Barcode = dto.Barcode,
            Unit = dto.Unit, TrackStock = dto.TrackStock, MinimumStock = dto.MinimumStock,
            CategoryId = dto.CategoryId, CreatedBy = createdBy
        };
        _db.Products.Add(p);
        await _db.SaveChangesAsync();

        // Auto-add to all active price lists. Applies default % if configured in the list.
        var lists = await _db.PriceLists.Where(pl => pl.IsActive).ToListAsync();
        foreach (var pl in lists)
        {
            var configured = pl.DefaultProfitPercentage > 0;
            _db.PriceListItems.Add(new PriceListItem
            {
                PriceListId = pl.Id,
                ProductId = p.Id,
                PricingMode = "percentage",
                ProfitPercentage = pl.DefaultProfitPercentage,
                FinalPrice = configured ? p.AveragePurchasePrice * (1 + pl.DefaultProfitPercentage / 100) : 0,
                HasPriceConfigured = configured,
                Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                CreatedBy = createdBy,
            });
        }

        await _uow.SaveChangesAsync();
        return await GetByIdAsync(p.Id);
    }

    public async Task<ProductDetailDto> UpdateAsync(int id, UpdateProductDto dto, string modifiedBy)
    {
        var p = await _db.Products.FindAsync(id) ?? throw new KeyNotFoundException();
        p.Name = dto.Name; p.Description = dto.Description; p.Barcode = dto.Barcode;
        p.Unit = dto.Unit; p.IsActive = dto.IsActive; p.TrackStock = dto.TrackStock;
        p.MinimumStock = dto.MinimumStock; p.CategoryId = dto.CategoryId;
        p.ModifiedBy = modifiedBy; p.ModifiedAt = DateTime.UtcNow;
        _db.Products.Update(p); await _uow.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var p = await _db.Products.FindAsync(id) ?? throw new KeyNotFoundException();
        var hasStock = await _db.StockEntries.AnyAsync(s => s.ProductId == id && s.Quantity > 0);
        if (hasStock) throw new InvalidOperationException("No se puede eliminar un producto con stock.");
        p.IsDeleted = true; p.DeletedBy = deletedBy; p.DeletedAt = DateTime.UtcNow;
        _db.Products.Update(p); await _uow.SaveChangesAsync();
    }

    public async Task RestoreAsync(int id, string restoredBy)
    {
        var p = await _db.Products.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id) ?? throw new KeyNotFoundException();
        p.IsDeleted = false; p.DeletedBy = null; p.DeletedAt = null;
        p.ModifiedBy = restoredBy; p.ModifiedAt = DateTime.UtcNow;
        _db.Products.Update(p); await _uow.SaveChangesAsync();
    }

    public Task<string> UploadPhotoAsync(int productId, Stream photoStream, string fileName)
        => Task.FromResult($"/uploads/products/{productId}_{fileName}");

    private static ProductDetailDto MapToDetail(Product p) => new(
        p.Id, p.Code, p.Name, p.Description, p.Barcode, p.PhotoUrl, p.Unit, p.IsActive, p.TrackStock,
        p.LastPurchasePrice, p.AveragePurchasePrice, p.PurchaseCount, p.MinimumStock,
        p.CategoryId, p.Category?.Name, p.CreatedAt, p.CreatedBy, p.ModifiedAt, p.ModifiedBy,
        p.StockEntries.Select(s => new ProductStockByLocationDto(s.StockLocationId, s.StockLocation.Name, s.Quantity)));
}
