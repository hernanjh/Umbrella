namespace ERP.Application.DTOs.Suppliers;

public record SupplierListDto(
    int Id,
    string Code,
    string BusinessName,
    string? TradeName,
    string Cuit,
    string? Email,
    string? Phone,
    string? City,
    bool IsActive,
    string? VatConditionName,
    DateTime CreatedAt
);

public record SupplierDetailDto(
    int Id,
    string Code,
    string BusinessName,
    string? TradeName,
    string Cuit,
    string? Email,
    string? Phone,
    string? Mobile,
    string? Address,
    string? City,
    string? Province,
    string? PostalCode,
    string? Country,
    string? ContactPerson,
    string? Website,
    string? BankAccount,
    string? Notes,
    bool IsActive,
    int? VatConditionId,
    string? VatConditionName,
    int? PaymentConditionId,
    string? PaymentConditionName,
    DateTime CreatedAt,
    string CreatedBy,
    DateTime? ModifiedAt,
    string? ModifiedBy
);

public record CreateSupplierDto(
    string Code,
    string BusinessName,
    string? TradeName,
    string Cuit,
    string? Email,
    string? Phone,
    string? Mobile,
    string? Address,
    string? City,
    string? Province,
    string? PostalCode,
    string? Country,
    string? ContactPerson,
    string? Website,
    string? BankAccount,
    string? Notes,
    int? VatConditionId,
    int? PaymentConditionId
);

public record UpdateSupplierDto(
    string BusinessName,
    string? TradeName,
    string Cuit,
    string? Email,
    string? Phone,
    string? Mobile,
    string? Address,
    string? City,
    string? Province,
    string? PostalCode,
    string? Country,
    string? ContactPerson,
    string? Website,
    string? BankAccount,
    string? Notes,
    bool IsActive,
    int? VatConditionId,
    int? PaymentConditionId
);

public record SupplierSearchDto(int Id, string Code, string BusinessName, string Cuit);
