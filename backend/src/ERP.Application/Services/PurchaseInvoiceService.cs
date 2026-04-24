using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Invoices;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Application.Services;

public class PurchaseInvoiceService : IPurchaseInvoiceService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;

    public PurchaseInvoiceService(AppDbContext db, IUnitOfWork uow)
    {
        _db = db;
        _uow = uow;
    }

    public async Task<PagedResultDto<PurchaseInvoiceListDto>> GetAllAsync(QueryParamsDto query)
    {
        var q = _db.PurchaseInvoices.Include(i => i.Supplier).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var p = $"%{query.Search}%";
            q = q.Where(i => EF.Functions.Like(i.FullNumber, p) || EF.Functions.Like(i.Supplier.BusinessName, p));
        }

        var total = await q.CountAsync();
        q = q.OrderByDescending(i => i.InvoiceDate);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(i => new PurchaseInvoiceListDto(
                i.Id, i.Code, i.FullNumber, i.SupplierInvoiceNumber, i.InvoiceType,
                i.InvoiceDate, i.DueDate, i.Status, i.SupplierId, i.Supplier.BusinessName,
                i.Total, i.BalanceDue, i.CreatedAt))
            .ToListAsync();
        return new PagedResultDto<PurchaseInvoiceListDto>(items, total, query.Page, query.PageSize,
            (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<PurchaseInvoiceDetailDto> GetByIdAsync(int id)
    {
        var inv = await _db.PurchaseInvoices
            .Include(i => i.Supplier)
            .Include(i => i.PaymentCondition)
            .Include(i => i.StockLocation)
            .Include(i => i.Items).ThenInclude(it => it.Product)
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException();
        return MapToDetail(inv);
    }

    public async Task<PurchaseInvoiceDetailDto> CreateAsync(CreatePurchaseInvoiceDto dto, string createdBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var cfg = await _db.SystemConfigs.FirstOrDefaultAsync();
            var number = cfg?.PurchaseCorrelative ?? 1;

            var invoice = new PurchaseInvoice
            {
                Code = $"OC{number:D8}",
                Number = number,
                FullNumber = $"{dto.InvoiceType}-{number:D8}",
                SupplierInvoiceNumber = dto.SupplierInvoiceNumber,
                InvoiceType = dto.InvoiceType,
                InvoiceDate = dto.InvoiceDate,
                SupplierId = dto.SupplierId,
                PaymentConditionId = dto.PaymentConditionId,
                StockLocationId = dto.StockLocationId,
                Notes = dto.Notes,
                Status = "draft",
                CreatedBy = createdBy
            };

            var paymentCond = dto.PaymentConditionId.HasValue
                ? await _db.PaymentConditions.FindAsync(dto.PaymentConditionId) : null;
            invoice.DueDate = dto.InvoiceDate.AddDays(paymentCond?.DueDays ?? 0);

            decimal subtotal = 0, vatTotal = 0, discTotal = 0;
            foreach (var itemDto in dto.Items)
            {
                var product = await _db.Products.FindAsync(itemDto.ProductId)
                    ?? throw new KeyNotFoundException($"Producto {itemDto.ProductId} no encontrado.");

                var discAmt = itemDto.UnitPrice * itemDto.Quantity * (itemDto.DiscountPercentage / 100);
                var lineNet = itemDto.UnitPrice * itemDto.Quantity - discAmt;
                var vatAmt = lineNet * (itemDto.VatRate / 100);

                invoice.Items.Add(new PurchaseInvoiceItem
                {
                    ProductId = itemDto.ProductId,
                    ProductName = product.Name,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    DiscountPercentage = itemDto.DiscountPercentage,
                    DiscountAmount = discAmt,
                    VatRate = itemDto.VatRate,
                    VatAmount = vatAmt,
                    Subtotal = lineNet,
                    Total = lineNet + vatAmt,
                    SortOrder = itemDto.SortOrder,
                    Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                    CreatedBy = createdBy
                });
                subtotal += lineNet; vatTotal += vatAmt; discTotal += discAmt;
            }

            invoice.Subtotal = subtotal + discTotal; invoice.DiscountAmount = discTotal;
            invoice.TaxableBase = subtotal; invoice.VatAmount = vatTotal;
            invoice.Total = subtotal + vatTotal; invoice.BalanceDue = invoice.Total;

            _db.PurchaseInvoices.Add(invoice);
            if (cfg != null) { cfg.PurchaseCorrelative = number + 1; _db.SystemConfigs.Update(cfg); }

            await _uow.CommitTransactionAsync();
            return await GetByIdAsync(invoice.Id);
        }
        catch { await _uow.RollbackTransactionAsync(); throw; }
    }

    public async Task ConfirmAsync(int id, string confirmedBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var inv = await _db.PurchaseInvoices.Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id) ?? throw new KeyNotFoundException();
            if (inv.Status != "draft") throw new InvalidOperationException("Solo se pueden confirmar facturas en borrador.");

            foreach (var item in inv.Items)
            {
                var product = await _db.Products.FindAsync(item.ProductId)!;
                var unitCost = item.UnitPrice * (1 - item.DiscountPercentage / 100);

                // Update last price and recalculate weighted average
                product!.LastPurchasePrice = unitCost;
                var totalPrev = product.AveragePurchasePrice * product.PurchaseCount;
                product.PurchaseCount += (int)item.Quantity;
                product.TotalPurchasedValue += unitCost * item.Quantity;
                product.AveragePurchasePrice = product.TotalPurchasedValue / product.PurchaseCount;
                _db.Products.Update(product);

                var stock = await _db.StockEntries
                    .FirstOrDefaultAsync(s => s.ProductId == item.ProductId && s.StockLocationId == inv.StockLocationId);
                if (stock == null)
                {
                    stock = new StockEntry
                    {
                        ProductId = item.ProductId,
                        StockLocationId = inv.StockLocationId,
                        Quantity = 0,
                        Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                        CreatedBy = confirmedBy
                    };
                    _db.StockEntries.Add(stock);
                    await _db.SaveChangesAsync();
                }

                var before = stock.Quantity;
                stock.Quantity += item.Quantity;
                _db.StockEntries.Update(stock);

                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = item.ProductId,
                    StockLocationId = inv.StockLocationId,
                    Quantity = item.Quantity,
                    MovementType = "Purchase",
                    ReferenceType = "PurchaseInvoice",
                    ReferenceId = inv.Id,
                    StockBefore = before,
                    StockAfter = stock.Quantity,
                    Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                    CreatedBy = confirmedBy
                });
            }

            inv.Status = "confirmed";
            inv.ModifiedBy = confirmedBy;
            inv.ModifiedAt = DateTime.UtcNow;
            _db.PurchaseInvoices.Update(inv);
            await _uow.CommitTransactionAsync();
        }
        catch { await _uow.RollbackTransactionAsync(); throw; }
    }

    public async Task CancelAsync(int id, string cancelledBy)
    {
        var inv = await _db.PurchaseInvoices.FindAsync(id) ?? throw new KeyNotFoundException();
        inv.Status = "cancelled"; inv.ModifiedBy = cancelledBy; inv.ModifiedAt = DateTime.UtcNow;
        _db.PurchaseInvoices.Update(inv);
        await _uow.SaveChangesAsync();
    }

    public async Task<PurchaseInvoiceDetailDto> UpdateAsync(int id, CreatePurchaseInvoiceDto dto, string modifiedBy)
    {
        var inv = await _db.PurchaseInvoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException();
        if (inv.Status != "draft") throw new InvalidOperationException("Solo se puede editar facturas en borrador.");
        _db.PurchaseInvoiceItems.RemoveRange(inv.Items);
        inv.Items.Clear();
        inv.SupplierId = dto.SupplierId; inv.PaymentConditionId = dto.PaymentConditionId;
        inv.StockLocationId = dto.StockLocationId; inv.Notes = dto.Notes;
        inv.ModifiedBy = modifiedBy; inv.ModifiedAt = DateTime.UtcNow;
        decimal subtotal = 0, vatTotal = 0, discTotal = 0;
        foreach (var itemDto in dto.Items)
        {
            var product = await _db.Products.FindAsync(itemDto.ProductId)!;
            var discAmt = itemDto.UnitPrice * itemDto.Quantity * (itemDto.DiscountPercentage / 100);
            var lineNet = itemDto.UnitPrice * itemDto.Quantity - discAmt;
            var vatAmt = lineNet * (itemDto.VatRate / 100);
            inv.Items.Add(new PurchaseInvoiceItem
            {
                ProductId = itemDto.ProductId, ProductName = product!.Name,
                Quantity = itemDto.Quantity, UnitPrice = itemDto.UnitPrice,
                DiscountPercentage = itemDto.DiscountPercentage, DiscountAmount = discAmt,
                VatRate = itemDto.VatRate, VatAmount = vatAmt,
                Subtotal = lineNet, Total = lineNet + vatAmt, SortOrder = itemDto.SortOrder,
                Code = Guid.NewGuid().ToString("N")[..8].ToUpper(), CreatedBy = modifiedBy
            });
            subtotal += lineNet; vatTotal += vatAmt; discTotal += discAmt;
        }
        inv.Subtotal = subtotal + discTotal; inv.DiscountAmount = discTotal;
        inv.TaxableBase = subtotal; inv.VatAmount = vatTotal;
        inv.Total = subtotal + vatTotal; inv.BalanceDue = inv.Total - inv.PaidAmount;
        _db.PurchaseInvoices.Update(inv);
        await _uow.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var inv = await _db.PurchaseInvoices.FindAsync(id) ?? throw new KeyNotFoundException();
        inv.IsDeleted = true; inv.DeletedBy = deletedBy; inv.DeletedAt = DateTime.UtcNow;
        _db.PurchaseInvoices.Update(inv); await _uow.SaveChangesAsync();
    }

    private static PurchaseInvoiceDetailDto MapToDetail(PurchaseInvoice i) => new(
        i.Id, i.Code, i.Number, i.FullNumber, i.SupplierInvoiceNumber, i.InvoiceType,
        i.InvoiceDate, i.DueDate, i.Status, i.Notes,
        i.SupplierId, i.Supplier.BusinessName, i.Supplier.Cuit,
        i.PaymentConditionId, i.PaymentCondition?.Name,
        i.StockLocationId, i.StockLocation.Name,
        i.Subtotal, i.DiscountAmount, i.TaxableBase, i.VatAmount, i.Total, i.PaidAmount, i.BalanceDue,
        i.CreatedAt, i.CreatedBy,
        i.Items.Select(item => new PurchaseInvoiceItemDto(
            item.Id, item.ProductId, item.ProductName, item.Product.Code,
            item.Quantity, item.UnitPrice, item.DiscountPercentage, item.DiscountAmount,
            item.VatRate, item.VatAmount, item.Subtotal, item.Total, item.SortOrder)));
}
