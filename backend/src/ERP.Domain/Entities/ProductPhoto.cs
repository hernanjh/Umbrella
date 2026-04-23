namespace ERP.Domain.Entities;

public class ProductPhoto : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public bool IsDefault { get; set; } = false;
    public int SortOrder { get; set; } = 0;
}
