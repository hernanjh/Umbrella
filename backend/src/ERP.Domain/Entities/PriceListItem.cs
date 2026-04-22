namespace ERP.Domain.Entities;

public class PriceListItem : BaseEntity
{
    public int PriceListId { get; set; }
    public PriceList PriceList { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string PricingMode { get; set; } = "percentage";
    public decimal ProfitPercentage { get; set; } = 0;
    public decimal FixedPrice { get; set; } = 0;
    public decimal FinalPrice { get; set; } = 0;
}
