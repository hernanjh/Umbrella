namespace ERP.Application.DTOs.Clients;

public record ClientListDto(
    int Id,
    string Code,
    string BusinessName,
    string? TradeName,
    string? Cuit,
    string? Email,
    string? Phone,
    string? City,
    bool IsActive,
    bool IsDeleted,
    string? ClientTypeName,
    string? ZoneName,
    string? SellerName,
    decimal CurrentBalance,
    DateTime CreatedAt
);

public record ClientDetailDto(
    int Id,
    string Code,
    string BusinessName,
    string? TradeName,
    string? Cuit,
    string? Dni,
    string? Email,
    string? Phone,
    string? Mobile,
    string? Address,
    string? City,
    string? Province,
    string? PostalCode,
    string? Country,
    string? Notes,
    bool IsActive,
    decimal CreditLimit,
    decimal CurrentBalance,
    int? ClientTypeId,
    string? ClientTypeName,
    int? ZoneId,
    string? ZoneName,
    int? VatConditionId,
    string? VatConditionName,
    int? PaymentConditionId,
    string? PaymentConditionName,
    int? DefaultPriceListId,
    string? DefaultPriceListName,
    int? AssignedSellerId,
    string? AssignedSellerName,
    DateTime CreatedAt,
    string CreatedBy,
    DateTime? ModifiedAt,
    string? ModifiedBy,
    IEnumerable<ClientDocumentDto> Documents
);

public record ClientDocumentDto(
    int Id,
    string FileName,
    string FileUrl,
    string FileType,
    long FileSizeBytes,
    string? Description,
    DateTime CreatedAt
);

public record CreateClientDto(
    string Code,
    string BusinessName,
    string? TradeName,
    string? Cuit,
    string? Dni,
    string? Email,
    string? Phone,
    string? Mobile,
    string? Address,
    string? City,
    string? Province,
    string? PostalCode,
    string? Country,
    string? Notes,
    decimal CreditLimit,
    int? ClientTypeId,
    int? ZoneId,
    int? VatConditionId,
    int? PaymentConditionId,
    int? DefaultPriceListId,
    int? AssignedSellerId
);

public record UpdateClientDto(
    string BusinessName,
    string? TradeName,
    string? Cuit,
    string? Dni,
    string? Email,
    string? Phone,
    string? Mobile,
    string? Address,
    string? City,
    string? Province,
    string? PostalCode,
    string? Country,
    string? Notes,
    bool IsActive,
    decimal CreditLimit,
    int? ClientTypeId,
    int? ZoneId,
    int? VatConditionId,
    int? PaymentConditionId,
    int? DefaultPriceListId,
    int? AssignedSellerId
);

public record ClientSearchDto(
    int Id,
    string Code,
    string BusinessName,
    string? Cuit,
    string? City,
    int? DefaultPriceListId,
    string? DefaultPriceListName,
    int? AssignedSellerId,
    string? AssignedSellerName
);
