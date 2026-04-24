namespace ERP.Domain.Entities;

public class PaymentCondition : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DueDays { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();
    public ICollection<PurchaseInvoice> PurchaseInvoices { get; set; } = new List<PurchaseInvoice>();
}
