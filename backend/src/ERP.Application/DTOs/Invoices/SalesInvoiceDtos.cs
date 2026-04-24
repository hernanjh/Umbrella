namespace ERP.Application.DTOs.Invoices;

public record SalesInvoiceListDto(
    int Id,
    string Code,
    string FullNumber,
    string InvoiceType,
    DateTime InvoiceDate,
    DateTime DueDate,
    string Status,
    int ClientId,
    string ClientName,
    string? SellerName,
    decimal Total,
    decimal BalanceDue,
    DateTime CreatedAt
);

public record SalesInvoiceDetailDto(
    int Id,
    string Code,
    int Number,
    string FullNumber,
    string InvoiceType,
    DateTime InvoiceDate,
    DateTime DueDate,
    string Status,
    string? Notes,
    int ClientId,
    string ClientName,
    string? ClientCuit,
    int? SellerId,
    string? SellerName,
    int? PriceListId,
    string? PriceListName,
    int? PaymentConditionId,
    string? PaymentConditionName,
    int StockLocationId,
    string StockLocationName,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxableBase,
    decimal VatAmount,
    decimal Total,
    decimal PaidAmount,
    decimal BalanceDue,
    DateTime CreatedAt,
    string CreatedBy,
    IEnumerable<SalesInvoiceItemDto> Items
);

public record SalesInvoiceItemDto(
    int Id,
    int ProductId,
    string ProductName,
    string ProductCode,
    int StockLocationId,
    string? StockLocationName,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountPercentage,
    decimal DiscountAmount,
    decimal VatRate,
    decimal VatAmount,
    decimal Subtotal,
    decimal Total,
    int SortOrder
);

public record CreateSalesInvoiceDto(
    string InvoiceType,
    DateTime InvoiceDate,
    int ClientId,
    int? SellerId,
    int? PriceListId,
    int? PaymentConditionId,
    int? StockLocationId,
    string? Notes,
    IEnumerable<CreateSalesInvoiceItemDto> Items
);

public record CreateSalesInvoiceItemDto(
    int ProductId,
    int StockLocationId,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountPercentage,
    decimal VatRate,
    int SortOrder
);

public record ConfirmInvoiceDto(string ConfirmedBy);
