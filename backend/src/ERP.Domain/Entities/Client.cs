namespace ERP.Domain.Entities;

public class Client : BaseEntity
{
    public string BusinessName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string? Cuit { get; set; }
    public string? Dni { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; } = "Argentina";
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal CreditLimit { get; set; } = 0;
    public decimal CurrentBalance { get; set; } = 0;

    public int? ClientTypeId { get; set; }
    public ClientType? ClientType { get; set; }

    public int? ZoneId { get; set; }
    public Zone? Zone { get; set; }

    public int? VatConditionId { get; set; }
    public VatCondition? VatCondition { get; set; }

    public int? PaymentConditionId { get; set; }
    public PaymentCondition? PaymentCondition { get; set; }

    public int? DefaultPriceListId { get; set; }
    public PriceList? DefaultPriceList { get; set; }

    public int? AssignedSellerId { get; set; }
    public User? AssignedSeller { get; set; }

    public ICollection<ClientDocument> Documents { get; set; } = new List<ClientDocument>();
    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();
}
