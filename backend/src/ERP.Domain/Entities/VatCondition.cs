namespace ERP.Domain.Entities;

public class VatCondition : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string AfipCode { get; set; } = string.Empty;
    public decimal VatRate { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
}
