namespace ERP.Domain.Entities;

/// <summary>
/// Per-user dismissal of a live alert, keyed by a stable string like "stock-min:42".
/// We only ever mark reads; the alert itself is recomputed from current state on each request.
/// </summary>
public class NotificationRead
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string AlertKey { get; set; } = string.Empty;
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;
}
