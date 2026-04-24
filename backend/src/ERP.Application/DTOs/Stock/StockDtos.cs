namespace ERP.Application.DTOs.Stock;

public record StockLocationListDto(
    int Id,
    string Code,
    string Name,
    string Type,
    bool IsActive,
    string? ResponsibleUserName,
    DateTime CreatedAt
);

public record StockStatusDto(
    int ProductId,
    string ProductCode,
    string ProductName,
    decimal TotalStock,
    decimal MinimumStock,
    bool BelowMinimum,
    IEnumerable<StockByLocationDto> ByLocation
);

public record StockByLocationDto(
    int LocationId,
    string LocationName,
    string LocationType,
    decimal Quantity
);

public record CreateStockLocationDto(
    string Code,
    string Name,
    string? Description,
    string Type,
    int? ResponsibleUserId
);

public record UpdateStockLocationDto(
    string Name,
    string? Description,
    string Type,
    bool IsActive,
    int? ResponsibleUserId
);

public record StockAdjustmentListDto(
    int Id,
    string Code,
    string Reason,
    string Status,
    DateTime AdjustmentDate,
    string ApprovedBy,
    int ItemCount,
    DateTime CreatedAt,
    string CreatedBy
);

public record CreateStockAdjustmentDto(
    string Reason,
    string? Notes,
    DateTime AdjustmentDate,
    IEnumerable<CreateStockAdjustmentItemDto> Items
);

public record CreateStockAdjustmentItemDto(
    int ProductId,
    int StockLocationId,
    decimal NewQuantity
);

public record StockMovementListDto(
    int Id,
    string ProductName,
    string LocationName,
    decimal Quantity,
    string MovementType,
    string? ReferenceType,
    int? ReferenceId,
    string? Reason,
    decimal StockBefore,
    decimal StockAfter,
    DateTime CreatedAt,
    string CreatedBy
);
