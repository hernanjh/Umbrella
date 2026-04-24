namespace ERP.Application.DTOs.Payments;

public record PaymentMethodDto(int Id, string Code, string Name, string Type, bool AffectsCash, bool IsActive, string? Notes);
public record CreatePaymentMethodDto(string Code, string Name, string Type, bool AffectsCash, string? Notes);
public record UpdatePaymentMethodDto(string Name, string Type, bool AffectsCash, bool IsActive, string? Notes);

public record SalesPaymentDto(
    int Id,
    int SalesInvoiceId,
    string InvoiceFullNumber,
    int PaymentMethodId,
    string PaymentMethodName,
    bool PaymentMethodAffectsCash,
    DateTime PaymentDate,
    decimal Amount,
    string? Reference,
    string? Notes,
    DateTime CreatedAt,
    string CreatedBy
);

public record CreateSalesPaymentDto(
    int PaymentMethodId,
    DateTime PaymentDate,
    decimal Amount,
    string? Reference,
    string? Notes
);

public record PurchasePaymentDto(
    int Id,
    int PurchaseInvoiceId,
    string InvoiceFullNumber,
    int PaymentMethodId,
    string PaymentMethodName,
    bool PaymentMethodAffectsCash,
    DateTime PaymentDate,
    decimal Amount,
    string? Reference,
    string? Notes,
    DateTime CreatedAt,
    string CreatedBy
);

public record CreatePurchasePaymentDto(
    int PaymentMethodId,
    DateTime PaymentDate,
    decimal Amount,
    string? Reference,
    string? Notes
);

public record ClientAccountEntryDto(
    DateTime Date,
    string Kind,
    string Description,
    decimal Debit,
    decimal Credit,
    decimal Balance,
    int? InvoiceId,
    int? PaymentId
);

public record ClientAccountDto(
    int ClientId,
    string ClientCode,
    string ClientName,
    string? ClientCuit,
    decimal CurrentBalance,
    decimal TotalInvoiced,
    decimal TotalPaid,
    IEnumerable<ClientAccountEntryDto> Entries
);
