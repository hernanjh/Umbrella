namespace ERP.Domain.Entities;

public class StockLocation : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "warehouse";
    public bool IsActive { get; set; } = true;
    public int? ResponsibleUserId { get; set; }
    public User? ResponsibleUser { get; set; }

    public ICollection<StockEntry> StockEntries { get; set; } = new List<StockEntry>();
}
