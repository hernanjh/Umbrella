namespace ERP.Application.DTOs.Cash;

public record CashMovementDto(
    int Id,
    int CashSessionId,
    DateTime MovementDate,
    string Type,
    decimal Amount,
    int? PaymentMethodId,
    string? PaymentMethodName,
    string? ReferenceType,
    int? ReferenceId,
    string Description,
    string CreatedBy,
    DateTime CreatedAt
);

public record CashSessionListDto(
    int Id,
    string Code,
    DateTime OpeningDate,
    decimal OpeningBalance,
    DateTime? ClosingDate,
    decimal? CountedBalance,
    decimal? ExpectedBalance,
    decimal? DifferenceAmount,
    string Status,
    string CreatedBy,
    string? ClosedBy,
    int MovementCount
);

public record CashSessionDetailDto(
    int Id,
    string Code,
    DateTime OpeningDate,
    decimal OpeningBalance,
    DateTime? ClosingDate,
    decimal? CountedBalance,
    decimal? ExpectedBalance,
    decimal? DifferenceAmount,
    string Status,
    string CreatedBy,
    string? ClosedBy,
    string? Notes,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal CurrentBalance,
    IEnumerable<CashMovementDto> Movements
);

public record OpenCashSessionDto(decimal OpeningBalance, string? Notes);
public record CloseCashSessionDto(decimal CountedBalance, string? Notes);
public record AddCashMovementDto(string Type, decimal Amount, int? PaymentMethodId, string Description);
