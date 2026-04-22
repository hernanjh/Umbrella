namespace ERP.Application.DTOs.Invoices;

public record PurchaseInvoiceListDto(
    int Id,
    string Code,
    string FullNumber,
    string SupplierInvoiceNumber,
    string InvoiceType,
    DateTime InvoiceDate,
    DateTime DueDate,
    string Status,
    int SupplierId,
    string SupplierName,
    decimal Total,
    decimal BalanceDue,
    DateTime CreatedAt
);

public record PurchaseInvoiceDetailDto(
    int Id,
    string Code,
    int Number,
    string FullNumber,
    string SupplierInvoiceNumber,
    string InvoiceType,
    DateTime InvoiceDate,
    DateTime DueDate,
    string Status,
    string? Notes,
    int SupplierId,
    string SupplierName,
    string SupplierCuit,
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
    IEnumerable<PurchaseInvoiceItemDto> Items
);

public record PurchaseInvoiceItemDto(
    int Id,
    int ProductId,
    string ProductName,
    string ProductCode,
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

public record CreatePurchaseInvoiceDto(
    string SupplierInvoiceNumber,
    string InvoiceType,
    DateTime InvoiceDate,
    int SupplierId,
    int? PaymentConditionId,
    int StockLocationId,
    string? Notes,
    IEnumerable<CreatePurchaseInvoiceItemDto> Items
);

public record CreatePurchaseInvoiceItemDto(
    int ProductId,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountPercentage,
    decimal VatRate,
    int SortOrder
);
