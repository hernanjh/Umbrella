namespace ERP.Domain.Entities;

public class Supplier : BaseEntity
{
    public string BusinessName { get; set; } = string.Empty;
    public string? TradeName { get; set; }
    public string Cuit { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; } = "Argentina";
    public string? ContactPerson { get; set; }
    public string? Website { get; set; }
    public string? BankAccount { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    public int? VatConditionId { get; set; }
    public VatCondition? VatCondition { get; set; }

    public int? PaymentConditionId { get; set; }
    public PaymentCondition? PaymentCondition { get; set; }

    public ICollection<PurchaseInvoice> PurchaseInvoices { get; set; } = new List<PurchaseInvoice>();
}
