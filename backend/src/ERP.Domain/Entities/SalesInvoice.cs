namespace ERP.Domain.Entities;

public class SalesInvoice : BaseEntity
{
    public int Number { get; set; }
    public string FullNumber { get; set; } = string.Empty;
    public string InvoiceType { get; set; } = "A";
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "draft";
    public string? Notes { get; set; }

    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public int? SellerId { get; set; }
    public User? Seller { get; set; }

    public int? PriceListId { get; set; }
    public PriceList? PriceList { get; set; }

    public int? PaymentConditionId { get; set; }
    public PaymentCondition? PaymentCondition { get; set; }

    public int StockLocationId { get; set; }
    public StockLocation StockLocation { get; set; } = null!;

    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxableBase { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; } = 0;
    public decimal BalanceDue { get; set; }

    public ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();
}
