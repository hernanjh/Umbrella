namespace ERP.Domain.Entities;

public class ClientDocument : BaseEntity
{
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Description { get; set; }
}
