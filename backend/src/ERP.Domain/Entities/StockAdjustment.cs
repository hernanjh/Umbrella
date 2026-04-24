namespace ERP.Domain.Entities;

public class StockAdjustment : BaseEntity
{
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string Status { get; set; } = "draft";
    public DateTime AdjustmentDate { get; set; } = DateTime.UtcNow;
    public string ApprovedBy { get; set; } = string.Empty;

    public ICollection<StockAdjustmentItem> Items { get; set; } = new List<StockAdjustmentItem>();
}
