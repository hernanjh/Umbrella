namespace ERP.Domain.Entities;

/// <summary>
/// A VAT percentage used on invoice line items (e.g. 21%, 10.5%, 0%).
/// Distinct from VatCondition, which describes the taxpayer status (RI, MO, CF).
/// </summary>
public class VatRate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public bool IsDefault { get; set; } = false;
    public bool IsActive { get; set; } = true;
}
