namespace ERP.Application.DTOs.Reports;

public record SalesByPeriodReportDto(
    DateTime DateFrom,
    DateTime DateTo,
    int TotalInvoices,
    decimal TotalAmount,
    decimal TotalVat,
    decimal NetAmount,
    IEnumerable<SalesByPeriodItemDto> Items
);

public record SalesByPeriodItemDto(
    DateTime Date,
    int InvoiceCount,
    decimal Amount
);

public record SalesBySellerReportDto(
    DateTime DateFrom,
    DateTime DateTo,
    IEnumerable<SellerSalesDto> Sellers
);

public record SellerSalesDto(
    int SellerId,
    string SellerName,
    int InvoiceCount,
    decimal TotalAmount,
    int ClientCount
);

public record SalesByClientReportDto(
    DateTime DateFrom,
    DateTime DateTo,
    IEnumerable<ClientSalesDto> Clients
);

public record ClientSalesDto(
    int ClientId,
    string ClientName,
    string? Cuit,
    int InvoiceCount,
    decimal TotalAmount,
    decimal BalanceDue
);

public record StockReportDto(
    IEnumerable<StockReportItemDto> Items,
    decimal TotalValue
);

public record StockReportItemDto(
    int ProductId,
    string ProductCode,
    string ProductName,
    string? CategoryName,
    decimal TotalStock,
    decimal MinimumStock,
    bool BelowMinimum,
    decimal AveragePurchasePrice,
    decimal TotalValue,
    IEnumerable<StockLocationValueDto> ByLocation
);

public record StockLocationValueDto(
    string LocationName,
    decimal Quantity,
    decimal Value
);

public record ReportQueryDto(
    DateTime DateFrom,
    DateTime DateTo,
    int? SellerId = null,
    int? ClientId = null,
    int? SupplierId = null,
    int? LocationId = null,
    string Format = "json"
);
