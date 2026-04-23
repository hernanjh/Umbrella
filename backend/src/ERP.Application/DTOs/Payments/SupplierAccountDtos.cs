namespace ERP.Application.DTOs.Payments;

public record SupplierAccountEntryDto(
    DateTime Date,
    string Kind,
    string Description,
    decimal Debit,
    decimal Credit,
    decimal Balance,
    int? InvoiceId,
    int? PaymentId
);

public record SupplierAccountDto(
    int SupplierId,
    string SupplierCode,
    string SupplierName,
    string Cuit,
    decimal CurrentBalance,
    decimal TotalInvoiced,
    decimal TotalPaid,
    IEnumerable<SupplierAccountEntryDto> Entries
);
