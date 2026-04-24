namespace ERP.Application.DTOs.Installments;

public record CreateInstallmentPlanDto(
    string Frequency,
    int NumberOfInstallments,
    DateTime? StartDate
);

public record UpdateInstallmentDto(
    DateTime DueDate,
    decimal Amount,
    bool Cascade
);

public record InstallmentDto(
    int Id,
    int SequenceNumber,
    DateTime DueDate,
    decimal Amount,
    decimal PaidAmount,
    decimal BalanceDue,
    string Status,
    bool IsOverdue
);

public record InstallmentPlanDto(
    int Id,
    string Code,
    int SalesInvoiceId,
    string InvoiceFullNumber,
    int ClientId,
    string ClientName,
    string Frequency,
    int NumberOfInstallments,
    DateTime StartDate,
    decimal TotalAmount,
    decimal TotalPaid,
    decimal BalanceDue,
    int PendingCount,
    int OverdueCount,
    string Status,
    IEnumerable<InstallmentDto> Installments
);

public record InstallmentPlanListItemDto(
    int Id,
    string Code,
    int SalesInvoiceId,
    string InvoiceFullNumber,
    int ClientId,
    string ClientName,
    string Frequency,
    int NumberOfInstallments,
    DateTime StartDate,
    decimal TotalAmount,
    decimal TotalPaid,
    decimal BalanceDue,
    int PendingCount,
    int OverdueCount,
    decimal OverdueAmount,
    DateTime? NextDueDate,
    string Status
);

public record PayInstallmentDto(
    int PaymentMethodId,
    DateTime PaymentDate,
    decimal Amount,
    string? Reference,
    string? Notes
);

public record OverdueInstallmentReportItemDto(
    int InstallmentId,
    int PlanId,
    int SalesInvoiceId,
    string InvoiceFullNumber,
    int ClientId,
    string ClientName,
    string? ClientPhone,
    int SequenceNumber,
    int NumberOfInstallments,
    DateTime DueDate,
    int DaysOverdue,
    decimal Amount,
    decimal PaidAmount,
    decimal BalanceDue
);

public record OverdueInstallmentReportDto(
    int Count,
    decimal TotalOverdueAmount,
    IEnumerable<OverdueInstallmentReportItemDto> Items
);
