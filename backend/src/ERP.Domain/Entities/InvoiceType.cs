namespace ERP.Domain.Entities;

public class InvoiceType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Kind { get; set; } = "sales";
    public bool IsActive { get; set; } = true;
}
