namespace ERP.Domain.Entities;

public class CashMovement : BaseEntity
{
    public int CashSessionId { get; set; }
    public CashSession CashSession { get; set; } = null!;

    public DateTime MovementDate { get; set; } = DateTime.UtcNow;
    public string Type { get; set; } = "income";
    public decimal Amount { get; set; }

    public int? PaymentMethodId { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }

    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }

    public string Description { get; set; } = string.Empty;
}
