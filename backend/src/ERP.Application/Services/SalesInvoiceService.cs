using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Invoices;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using ERP.Infrastructure.Data;

namespace ERP.Application.Services;

public class SalesInvoiceService : ISalesInvoiceService
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    private readonly IRepository<SystemConfig> _config;
    private readonly ICurrentUserContext _user;

    public SalesInvoiceService(AppDbContext db, IUnitOfWork uow, IRepository<SystemConfig> config, ICurrentUserContext user)
    {
        _db = db;
        _uow = uow;
        _config = config;
        _user = user;
    }

    public async Task<PagedResultDto<SalesInvoiceListDto>> GetAllAsync(QueryParamsDto query, int? sellerId = null)
    {
        var q = _db.SalesInvoices
            .Include(i => i.Client)
            .Include(i => i.Seller)
            .AsQueryable();

        if (sellerId.HasValue) q = q.Where(i => i.SellerId == sellerId);
        // Seller zone scoping: only invoices for clients of the user's zone
        if (_user.IsZoneScoped) q = q.Where(i => i.Client.ZoneId == _user.ZoneId);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var p = $"%{query.Search}%";
            q = q.Where(i => EF.Functions.Like(i.FullNumber, p) || EF.Functions.Like(i.Client.BusinessName, p));
        }

        var total = await q.CountAsync();
        q = query.SortBy switch
        {
            "date" => query.SortDir == "desc" ? q.OrderByDescending(i => i.InvoiceDate) : q.OrderBy(i => i.InvoiceDate),
            "total" => query.SortDir == "desc" ? q.OrderByDescending(i => i.Total) : q.OrderBy(i => i.Total),
            _ => q.OrderByDescending(i => i.InvoiceDate)
        };

        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(i => new SalesInvoiceListDto(
                i.Id, i.Code, i.FullNumber, i.InvoiceType, i.InvoiceDate, i.DueDate, i.Status,
                i.ClientId, i.Client.BusinessName,
                i.Seller != null ? i.Seller.FirstName + " " + i.Seller.LastName : null,
                i.Total, i.BalanceDue, i.CreatedAt))
            .ToListAsync();

        return new PagedResultDto<SalesInvoiceListDto>(items, total, query.Page, query.PageSize,
            (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public async Task<SalesInvoiceDetailDto> GetByIdAsync(int id)
    {
        var inv = await _db.SalesInvoices
            .Include(i => i.Client)
            .Include(i => i.Seller)
            .Include(i => i.PriceList)
            .Include(i => i.PaymentCondition)
            .Include(i => i.StockLocation)
            .Include(i => i.Items).ThenInclude(item => item.Product)
            .Include(i => i.Items).ThenInclude(item => item.StockLocation)
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException($"Factura {id} no encontrada.");

        if (_user.IsZoneScoped && inv.Client.ZoneId != _user.ZoneId)
            throw new UnauthorizedAccessException("No tiene acceso a esta factura (cliente fuera de su zona).");

        return MapToDetail(inv);
    }

    public async Task<SalesInvoiceDetailDto> CreateAsync(CreateSalesInvoiceDto dto, string createdBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var cfg = (await _config.GetAllAsync()).FirstOrDefault();
            var number = (cfg?.InvoiceCorrelative ?? 1);

            var firstItemLocation = dto.Items.Select(i => i.StockLocationId).FirstOrDefault();
            var invoiceLocation = dto.StockLocationId ?? (firstItemLocation > 0 ? firstItemLocation : 0);
            if (invoiceLocation == 0) throw new InvalidOperationException("Debe indicar locación de stock en al menos un item.");

            var invoice = new SalesInvoice
            {
                Code = $"FC{number:D8}",
                Number = number,
                FullNumber = $"{dto.InvoiceType}-{number:D8}",
                InvoiceType = dto.InvoiceType,
                InvoiceDate = dto.InvoiceDate,
                ClientId = dto.ClientId,
                SellerId = dto.SellerId,
                PriceListId = dto.PriceListId,
                PaymentConditionId = dto.PaymentConditionId,
                StockLocationId = invoiceLocation,
                Notes = dto.Notes,
                Status = "draft",
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
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

                var item = new SalesInvoiceItem
                {
                    ProductId = itemDto.ProductId,
                    StockLocationId = itemDto.StockLocationId > 0 ? itemDto.StockLocationId : invoiceLocation,
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
                };
                invoice.Items.Add(item);
                subtotal += lineNet;
                vatTotal += vatAmt;
                discTotal += discAmt;
            }

            invoice.Subtotal = subtotal + discTotal;
            invoice.DiscountAmount = discTotal;
            invoice.TaxableBase = subtotal;
            invoice.VatAmount = vatTotal;
            invoice.Total = subtotal + vatTotal;
            invoice.BalanceDue = invoice.Total;

            _db.SalesInvoices.Add(invoice);

            if (cfg != null)
            {
                cfg.InvoiceCorrelative = number + 1;
                _db.SystemConfigs.Update(cfg);
            }

            await _uow.CommitTransactionAsync();
            return await GetByIdAsync(invoice.Id);
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task ConfirmAsync(int id, string confirmedBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var inv = await _db.SalesInvoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id)
                ?? throw new KeyNotFoundException();

            if (inv.Status != "draft") throw new InvalidOperationException("Solo se pueden confirmar facturas en borrador.");

            var cfg = (await _db.SystemConfigs.FirstOrDefaultAsync());
            var allowNegative = cfg?.AllowNegativeStock ?? false;

            foreach (var item in inv.Items)
            {
                var locationId = item.StockLocationId > 0 ? item.StockLocationId : inv.StockLocationId;
                var stock = await _db.StockEntries
                    .FirstOrDefaultAsync(s => s.ProductId == item.ProductId && s.StockLocationId == locationId);

                var currentQty = stock?.Quantity ?? 0;
                if (!allowNegative && currentQty < item.Quantity)
                    throw new InvalidOperationException(
                        $"Stock insuficiente para '{item.ProductName}'. Disponible: {currentQty}, requerido: {item.Quantity}.");

                if (stock == null)
                {
                    stock = new StockEntry
                    {
                        ProductId = item.ProductId,
                        StockLocationId = locationId,
                        Quantity = 0,
                        Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                        CreatedBy = confirmedBy
                    };
                    _db.StockEntries.Add(stock);
                    await _db.SaveChangesAsync();
                }

                var before = stock.Quantity;
                stock.Quantity -= item.Quantity;
                _db.StockEntries.Update(stock);

                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = item.ProductId,
                    StockLocationId = locationId,
                    Quantity = -item.Quantity,
                    MovementType = "Sale",
                    ReferenceType = "SalesInvoice",
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
            _db.SalesInvoices.Update(inv);

            await _uow.CommitTransactionAsync();
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task CancelAsync(int id, string cancelledBy)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var inv = await _db.SalesInvoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id)
                ?? throw new KeyNotFoundException();
            if (inv.Status == "cancelled") throw new InvalidOperationException("Ya está cancelada.");

            var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == inv.ClientId);
            var payments = await _db.SalesPayments.Where(p => p.SalesInvoiceId == id && !p.IsDeleted).ToListAsync();
            foreach (var p in payments)
            {
                p.IsDeleted = true;
                p.DeletedBy = cancelledBy;
                p.DeletedAt = DateTime.UtcNow;
                _db.SalesPayments.Update(p);

                if (client != null) client.CurrentBalance += p.Amount;

                var cashMoves = await _db.CashMovements
                    .Where(m => m.ReferenceType == "SalesPayment" && m.ReferenceId == p.Id && !m.IsDeleted)
                    .ToListAsync();
                foreach (var m in cashMoves)
                {
                    var session = await _db.CashSessions.FindAsync(m.CashSessionId);
                    if (session?.Status == "open")
                    {
                        m.IsDeleted = true;
                        m.DeletedBy = cancelledBy;
                        m.DeletedAt = DateTime.UtcNow;
                        _db.CashMovements.Update(m);
                    }
                }
            }
            if (client != null) _db.Clients.Update(client);

            if (inv.Status == "confirmed" || inv.Status == "partially_paid" || inv.Status == "paid")
            {
                foreach (var item in inv.Items)
                {
                    var locationId = item.StockLocationId > 0 ? item.StockLocationId : inv.StockLocationId;
                    var stock = await _db.StockEntries.FirstOrDefaultAsync(s => s.ProductId == item.ProductId && s.StockLocationId == locationId);
                    if (stock == null)
                    {
                        stock = new StockEntry { Code = Guid.NewGuid().ToString("N")[..8].ToUpper(), ProductId = item.ProductId, StockLocationId = locationId, Quantity = 0, CreatedBy = cancelledBy };
                        _db.StockEntries.Add(stock);
                        await _db.SaveChangesAsync();
                    }
                    var before = stock.Quantity;
                    stock.Quantity += item.Quantity;
                    _db.StockEntries.Update(stock);

                    _db.StockMovements.Add(new StockMovement
                    {
                        Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
                        ProductId = item.ProductId,
                        StockLocationId = locationId,
                        Quantity = item.Quantity,
                        MovementType = "SaleCancelled",
                        ReferenceType = "SalesInvoice",
                        ReferenceId = inv.Id,
                        Reason = "Anulación de factura",
                        StockBefore = before,
                        StockAfter = stock.Quantity,
                        CreatedBy = cancelledBy,
                    });
                }
            }

            inv.PaidAmount = 0;
            inv.BalanceDue = 0;
            inv.Status = "cancelled";
            inv.ModifiedBy = cancelledBy;
            inv.ModifiedAt = DateTime.UtcNow;
            _db.SalesInvoices.Update(inv);

            await _uow.CommitTransactionAsync();
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<SalesInvoiceDetailDto> UpdateAsync(int id, CreateSalesInvoiceDto dto, string modifiedBy)
    {
        var inv = await _db.SalesInvoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException();
        if (inv.Status != "draft") throw new InvalidOperationException("Solo se puede editar facturas en borrador.");

        var firstItemLocation = dto.Items.Select(i => i.StockLocationId).FirstOrDefault();
        var invoiceLocation = dto.StockLocationId ?? (firstItemLocation > 0 ? firstItemLocation : 0);
        if (invoiceLocation == 0) throw new InvalidOperationException("Debe indicar locación de stock en al menos un item.");

        _db.SalesInvoiceItems.RemoveRange(inv.Items);
        inv.Items.Clear();
        inv.ClientId = dto.ClientId;
        inv.SellerId = dto.SellerId;
        inv.PriceListId = dto.PriceListId;
        inv.PaymentConditionId = dto.PaymentConditionId;
        inv.StockLocationId = invoiceLocation;
        inv.Notes = dto.Notes;
        inv.ModifiedBy = modifiedBy;
        inv.ModifiedAt = DateTime.UtcNow;

        decimal subtotal = 0, vatTotal = 0, discTotal = 0;
        foreach (var itemDto in dto.Items)
        {
            var product = await _db.Products.FindAsync(itemDto.ProductId)!;
            var discAmt = itemDto.UnitPrice * itemDto.Quantity * (itemDto.DiscountPercentage / 100);
            var lineNet = itemDto.UnitPrice * itemDto.Quantity - discAmt;
            var vatAmt = lineNet * (itemDto.VatRate / 100);
            inv.Items.Add(new SalesInvoiceItem
            {
                ProductId = itemDto.ProductId,
                StockLocationId = itemDto.StockLocationId > 0 ? itemDto.StockLocationId : invoiceLocation,
                ProductName = product!.Name,
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
                CreatedBy = modifiedBy
            });
            subtotal += lineNet; vatTotal += vatAmt; discTotal += discAmt;
        }
        inv.Subtotal = subtotal + discTotal; inv.DiscountAmount = discTotal;
        inv.TaxableBase = subtotal; inv.VatAmount = vatTotal;
        inv.Total = subtotal + vatTotal; inv.BalanceDue = inv.Total - inv.PaidAmount;
        _db.SalesInvoices.Update(inv);
        await _uow.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var inv = await _db.SalesInvoices.FindAsync(id) ?? throw new KeyNotFoundException();
        inv.IsDeleted = true; inv.DeletedBy = deletedBy; inv.DeletedAt = DateTime.UtcNow;
        _db.SalesInvoices.Update(inv);
        await _uow.SaveChangesAsync();
    }

    private static SalesInvoiceDetailDto MapToDetail(SalesInvoice i) => new(
        i.Id, i.Code, i.Number, i.FullNumber, i.InvoiceType, i.InvoiceDate, i.DueDate, i.Status, i.Notes,
        i.ClientId, i.Client.BusinessName, i.Client.Cuit,
        i.SellerId, i.Seller != null ? $"{i.Seller.FirstName} {i.Seller.LastName}" : null,
        i.PriceListId, i.PriceList?.Name, i.PaymentConditionId, i.PaymentCondition?.Name,
        i.StockLocationId, i.StockLocation.Name,
        i.Subtotal, i.DiscountAmount, i.TaxableBase, i.VatAmount, i.Total, i.PaidAmount, i.BalanceDue,
        i.CreatedAt, i.CreatedBy,
        i.Items.Select(item => new SalesInvoiceItemDto(
            item.Id, item.ProductId, item.ProductName, item.Product.Code,
            item.StockLocationId, item.StockLocation != null ? item.StockLocation.Name : null,
            item.Quantity, item.UnitPrice, item.DiscountPercentage, item.DiscountAmount,
            item.VatRate, item.VatAmount, item.Subtotal, item.Total, item.SortOrder)));
}
