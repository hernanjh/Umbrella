namespace ERP.Application.DTOs.PriceLists;

public record PriceListListDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    string Currency,
    bool IsActive,
    int ItemCount,
    DateTime CreatedAt
);

public record PriceListDetailDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    string Currency,
    bool IsActive,
    decimal DefaultProfitPercentage,
    DateTime CreatedAt,
    IEnumerable<PriceListItemDto> Items
);

public record PriceListItemDto(
    int Id,
    int ProductId,
    string ProductCode,
    string ProductName,
    string Unit,
    decimal LastPurchasePrice,
    string PricingMode,
    decimal ProfitPercentage,
    decimal FixedPrice,
    decimal FinalPrice,
    bool HasPriceConfigured
);

public record CreatePriceListDto(
    string Code,
    string Name,
    string? Description,
    string Currency,
    decimal DefaultProfitPercentage
);

public record UpdatePriceListDto(
    string Name,
    string? Description,
    string Currency,
    bool IsActive,
    decimal DefaultProfitPercentage
);

public record UpsertPriceListItemDto(
    int ProductId,
    string PricingMode,
    decimal ProfitPercentage,
    decimal FixedPrice
);

public record BulkUpdatePriceListDto(
    string PricingMode,
    decimal ProfitPercentage
);
