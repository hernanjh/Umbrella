namespace ERP.Domain.Entities;

public class Zone : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public int? DefaultSellerId { get; set; }
    public User? DefaultSeller { get; set; }

    public ICollection<Client> Clients { get; set; } = new List<Client>();
}
