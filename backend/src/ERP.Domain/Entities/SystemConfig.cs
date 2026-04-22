namespace ERP.Domain.Entities;

public class SystemConfig : BaseEntity
{
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyEmail { get; set; }
    public string? CompanyCuit { get; set; }
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string Currency { get; set; } = "ARS";
    public string CurrencySymbol { get; set; } = "$";
    public int InvoiceCorrelative { get; set; } = 1;
    public int PurchaseCorrelative { get; set; } = 1;
    public bool AllowNegativeStock { get; set; } = false;
    public string Timezone { get; set; } = "America/Argentina/Buenos_Aires";
}
