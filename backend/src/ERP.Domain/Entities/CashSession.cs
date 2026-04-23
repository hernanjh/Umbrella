namespace ERP.Domain.Entities;

public class CashSession : BaseEntity
{
    public DateTime OpeningDate { get; set; } = DateTime.UtcNow;
    public decimal OpeningBalance { get; set; }
    public DateTime? ClosingDate { get; set; }
    public decimal? CountedBalance { get; set; }
    public decimal? ExpectedBalance { get; set; }
    public decimal? DifferenceAmount { get; set; }
    public string Status { get; set; } = "open";
    public string? ClosedBy { get; set; }
    public string? Notes { get; set; }

    public ICollection<CashMovement> Movements { get; set; } = new List<CashMovement>();
}
