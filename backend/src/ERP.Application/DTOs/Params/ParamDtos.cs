namespace ERP.Application.DTOs.Params;

public record ClientTypeDto(int Id, string Code, string Name, string? Description, bool IsActive, int? DefaultPriceListId, string? DefaultPriceListName);
public record CreateClientTypeDto(string Code, string Name, string? Description, int? DefaultPriceListId);
public record UpdateClientTypeDto(string Name, string? Description, bool IsActive, int? DefaultPriceListId);

public record ZoneDto(int Id, string Code, string Name, string? Description, bool IsActive, int? DefaultSellerId, string? DefaultSellerName);
public record CreateZoneDto(string Code, string Name, string? Description, int? DefaultSellerId);
public record UpdateZoneDto(string Name, string? Description, bool IsActive, int? DefaultSellerId);

public record InvoiceTypeDto(int Id, string Code, string Name, string? Description, string Kind, bool IsActive);
public record CreateInvoiceTypeDto(string Code, string Name, string? Description, string Kind);
public record UpdateInvoiceTypeDto(string Name, string? Description, string Kind, bool IsActive);

public record VatConditionDto(int Id, string Code, string Name, string AfipCode, decimal VatRate, bool IsActive);
public record CreateVatConditionDto(string Code, string Name, string AfipCode, decimal VatRate);
public record UpdateVatConditionDto(string Name, string AfipCode, decimal VatRate, bool IsActive);

public record PaymentConditionDto(int Id, string Code, string Name, string? Description, int DueDays, bool IsActive);
public record CreatePaymentConditionDto(string Code, string Name, string? Description, int DueDays);
public record UpdatePaymentConditionDto(string Name, string? Description, int DueDays, bool IsActive);

public record CategoryDto(int Id, string Code, string Name, string? Description, int? ParentCategoryId, string? ParentCategoryName, bool IsActive);
public record CreateCategoryDto(string Code, string Name, string? Description, int? ParentCategoryId);
public record UpdateCategoryDto(string Name, string? Description, int? ParentCategoryId, bool IsActive);

public record SystemConfigDto(
    int Id,
    string CompanyName,
    string? CompanyAddress,
    string? CompanyPhone,
    string? CompanyEmail,
    string? CompanyCuit,
    string? LogoUrl,
    string? Website,
    string Currency,
    string CurrencySymbol,
    bool AllowNegativeStock,
    string Timezone
);

public record UpdateSystemConfigDto(
    string CompanyName,
    string? CompanyAddress,
    string? CompanyPhone,
    string? CompanyEmail,
    string? CompanyCuit,
    string? Website,
    string Currency,
    string CurrencySymbol,
    bool AllowNegativeStock,
    string Timezone
);
