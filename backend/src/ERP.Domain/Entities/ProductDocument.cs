namespace ERP.Domain.Entities;

public class ProductDocument : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Description { get; set; }
}
