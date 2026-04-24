namespace ERP.Domain.Entities;

public class PriceList : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string Currency { get; set; } = "ARS";
    public decimal DefaultProfitPercentage { get; set; } = 0;

    public ICollection<PriceListItem> Items { get; set; } = new List<PriceListItem>();
    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<ClientType> ClientTypes { get; set; } = new List<ClientType>();
}
