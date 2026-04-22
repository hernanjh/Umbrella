namespace ERP.Domain.Entities;

public class ClientType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int? DefaultPriceListId { get; set; }
    public PriceList? DefaultPriceList { get; set; }

    public ICollection<Client> Clients { get; set; } = new List<Client>();
}
