namespace ERP.Domain.Entities;

public class SalesInvoiceItem : BaseEntity
{
    public int SalesInvoiceId { get; set; }
    public SalesInvoice SalesInvoice { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int StockLocationId { get; set; }
    public StockLocation StockLocation { get; set; } = null!;

    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercentage { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public decimal VatRate { get; set; } = 21;
    public decimal VatAmount { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }
    public int SortOrder { get; set; } = 0;
}
