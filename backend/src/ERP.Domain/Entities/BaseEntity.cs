namespace ERP.Domain.Entities;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public bool IsDeleted { get; set; } = false;

    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public string? DeletedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
}
