namespace ERP.Application.DTOs.Products;

public record ProductListDto(
    int Id,
    string Code,
    string Name,
    string? Barcode,
    string? Brand,
    string? Model,
    string? PhotoUrl,
    string? CategoryName,
    string Unit,
    bool IsActive,
    bool IsDeleted,
    bool TrackStock,
    decimal LastPurchasePrice,
    decimal AveragePurchasePrice,
    decimal TotalStock,
    int PhotoCount,
    DateTime CreatedAt
);

public record ProductDetailDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    string? Barcode,
    string? Brand,
    string? Model,
    string? PhotoUrl,
    string Unit,
    bool IsActive,
    bool TrackStock,
    decimal LastPurchasePrice,
    decimal AveragePurchasePrice,
    int PurchaseCount,
    decimal MinimumStock,
    int? CategoryId,
    string? CategoryName,
    DateTime CreatedAt,
    string CreatedBy,
    DateTime? ModifiedAt,
    string? ModifiedBy,
    IEnumerable<ProductStockByLocationDto> StockByLocation
);

public record ProductStockByLocationDto(
    int StockLocationId,
    string StockLocationName,
    decimal Quantity
);

public record CreateProductDto(
    string Code,
    string Name,
    string? Description,
    string? Barcode,
    string? Brand,
    string? Model,
    string Unit,
    bool TrackStock,
    decimal MinimumStock,
    int? CategoryId
);

public record UpdateProductDto(
    string Name,
    string? Description,
    string? Barcode,
    string? Brand,
    string? Model,
    string Unit,
    bool IsActive,
    bool TrackStock,
    decimal MinimumStock,
    int? CategoryId
);

public record ProductSearchDto(int Id, string Code, string Name, string? Barcode, decimal LastPurchasePrice, decimal TotalStock, IEnumerable<ProductStockByLocationDto> StockByLocation);
