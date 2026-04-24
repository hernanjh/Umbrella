namespace ERP.Domain.Entities;

public class StockMovement : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int StockLocationId { get; set; }
    public StockLocation StockLocation { get; set; } = null!;

    public decimal Quantity { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public string? Reason { get; set; }
    public decimal StockBefore { get; set; }
    public decimal StockAfter { get; set; }
}
