namespace ERP.Domain.Entities;

public class StockAdjustmentItem : BaseEntity
{
    public int StockAdjustmentId { get; set; }
    public StockAdjustment StockAdjustment { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int StockLocationId { get; set; }
    public StockLocation StockLocation { get; set; } = null!;

    public decimal QuantityBefore { get; set; }
    public decimal QuantityAfter { get; set; }
    public decimal QuantityDifference { get; set; }
}
