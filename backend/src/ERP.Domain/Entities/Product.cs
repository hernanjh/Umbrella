namespace ERP.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Barcode { get; set; }
    public string? PhotoUrl { get; set; }
    public string Unit { get; set; } = "un";
    public bool IsActive { get; set; } = true;
    public bool TrackStock { get; set; } = true;

    public decimal LastPurchasePrice { get; set; } = 0;
    public decimal AveragePurchasePrice { get; set; } = 0;
    public int PurchaseCount { get; set; } = 0;
    public decimal TotalPurchasedValue { get; set; } = 0;

    public decimal MinimumStock { get; set; } = 0;

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public ICollection<PriceListItem> PriceListItems { get; set; } = new List<PriceListItem>();
    public ICollection<SalesInvoiceItem> SalesInvoiceItems { get; set; } = new List<SalesInvoiceItem>();
    public ICollection<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; } = new List<PurchaseInvoiceItem>();
    public ICollection<StockEntry> StockEntries { get; set; } = new List<StockEntry>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<ProductDocument> Documents { get; set; } = new List<ProductDocument>();
}
