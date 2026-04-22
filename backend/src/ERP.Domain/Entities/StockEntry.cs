namespace ERP.Domain.Entities;

public class StockEntry : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int StockLocationId { get; set; }
    public StockLocation StockLocation { get; set; } = null!;

    public decimal Quantity { get; set; } = 0;
}
