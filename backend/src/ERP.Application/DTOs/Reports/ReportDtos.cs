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
    int? PaymentMethodId = null,
    string Format = "json"
);

public record PaymentsReportItemDto(
    int PaymentId,
    string Kind,
    DateTime PaymentDate,
    string PartyName,
    string InvoiceFullNumber,
    string PaymentMethodName,
    bool AffectsCash,
    decimal Amount,
    string? Reference,
    string CreatedBy
);

public record PaymentsReportDto(
    DateTime DateFrom,
    DateTime DateTo,
    int Count,
    decimal TotalReceived,
    decimal TotalPaid,
    decimal NetFlow,
    IEnumerable<PaymentsReportItemDto> Items
);

public record ReceivableItemDto(
    int ClientId,
    string ClientCode,
    string ClientName,
    string? Cuit,
    string? Phone,
    int OverdueInvoices,
    decimal OverdueAmount,
    int PendingInvoices,
    decimal PendingAmount,
    decimal TotalDue,
    DateTime? OldestInvoiceDate
);

public record ReceivablesReportDto(
    int ClientCount,
    decimal TotalDue,
    decimal TotalOverdue,
    IEnumerable<ReceivableItemDto> Items
);

public record PayableItemDto(
    int SupplierId,
    string SupplierCode,
    string SupplierName,
    string Cuit,
    int OverdueInvoices,
    decimal OverdueAmount,
    int PendingInvoices,
    decimal PendingAmount,
    decimal TotalDue,
    DateTime? OldestInvoiceDate
);

public record PayablesReportDto(
    int SupplierCount,
    decimal TotalDue,
    decimal TotalOverdue,
    IEnumerable<PayableItemDto> Items
);

public record CashReportDayDto(DateTime Date, decimal Income, decimal Expense, decimal Net);

public record CashReportDto(
    DateTime DateFrom,
    DateTime DateTo,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetFlow,
    IEnumerable<CashReportDayDto> ByDay,
    IEnumerable<PaymentMethodSummaryDto> ByPaymentMethod
);

public record PaymentMethodSummaryDto(string PaymentMethodName, decimal Income, decimal Expense);

public record DashboardSummaryDto(
    decimal TotalReceivables,
    decimal TotalPayables,
    decimal CurrentCashBalance,
    int OverdueReceivableCount,
    decimal OverdueReceivableAmount,
    int OpenCashSessionId,
    string? OpenCashSessionCode,
    DateTime? OpenCashSessionOpenedAt,
    int OverdueInstallmentCount,
    decimal OverdueInstallmentAmount
);

public record DailyCollectionInstallmentLineDto(
    int InstallmentId,
    int PlanId,
    string PlanCode,
    int InvoiceId,
    string InvoiceFullNumber,
    int SequenceNumber,
    DateTime DueDate,
    decimal Amount,
    decimal PaidAmount,
    decimal BalanceDue,
    int DaysOverdue
);

public record DailyCollectionInvoiceLineDto(
    int InvoiceId,
    string FullNumber,
    DateTime InvoiceDate,
    DateTime DueDate,
    decimal Total,
    decimal BalanceDue,
    int DaysOverdue
);

public record DailyCollectionClientDto(
    int ClientId,
    string ClientCode,
    string BusinessName,
    string? Phone,
    string? Mobile,
    string? Address,
    string? City,
    string? Cuit,
    int? ZoneId,
    string? ZoneName,
    string? AssignedSellerName,
    decimal CurrentBalance,
    IEnumerable<DailyCollectionInstallmentLineDto> OverdueInstallments,
    IEnumerable<DailyCollectionInstallmentLineDto> UpcomingInstallments,
    IEnumerable<DailyCollectionInvoiceLineDto> UnpaidInvoices,
    decimal TotalToCollect,
    decimal OverdueAmount,
    decimal UpcomingAmount
);

public record DailyCollectionsReportDto(
    DateTime Date,
    int? ZoneId,
    string? ZoneName,
    int ClientCount,
    decimal TotalToCollect,
    decimal TotalOverdue,
    decimal TotalUpcoming,
    IEnumerable<DailyCollectionClientDto> Clients
);

public record DetailedSalesItemDto(
    DateTime InvoiceDate,
    string InvoiceFullNumber,
    string InvoiceType,
    string Status,
    int ClientId,
    string ClientCode,
    string ClientName,
    string? ClientCuit,
    string? ZoneName,
    string? SellerName,
    string? PaymentConditionName,
    string ProductCode,
    string ProductName,
    string? CategoryName,
    string? Brand,
    decimal Quantity,
    string Unit,
    decimal UnitPrice,
    decimal DiscountAmount,
    decimal LineSubtotal,
    decimal LineVat,
    decimal LineTotal,
    decimal InvoiceTotal,
    decimal InvoiceBalanceDue,
    bool HasInstallmentPlan,
    int? NumberOfInstallments,
    string? InstallmentFrequency,
    int? OverdueInstallmentCount,
    decimal? OverdueInstallmentAmount
);

public record DetailedSalesReportDto(
    DateTime DateFrom,
    DateTime DateTo,
    int ItemCount,
    int InvoiceCount,
    decimal TotalAmount,
    decimal TotalBalanceDue,
    IEnumerable<DetailedSalesItemDto> Items
);
