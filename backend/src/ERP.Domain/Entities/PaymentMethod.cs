namespace ERP.Domain.Entities;

public class PaymentMethod : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "cash";
    public bool AffectsCash { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}
