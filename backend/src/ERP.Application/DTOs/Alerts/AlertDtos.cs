namespace ERP.Application.DTOs.Alerts;

public record AlertDto(
    string Key,
    string Module,
    string Severity,  // info | warning | error
    string Title,
    string Description,
    string? Link,
    DateTime CreatedAt,
    bool IsRead
);

public record AlertListDto(
    int Total,
    int UnreadCount,
    IEnumerable<AlertDto> Items
);

public record MarkReadDto(IEnumerable<string> Keys);
