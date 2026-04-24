namespace ERP.Application.Interfaces;

public interface ICurrentUserContext
{
    int UserId { get; }
    string Email { get; }
    bool IsAuthenticated { get; }
    bool IsAdministrator { get; }
    bool IsSeller { get; }
    int? ZoneId { get; }
    IReadOnlyCollection<string> Roles { get; }
    IReadOnlyCollection<string> Permissions { get; }

    bool HasPermission(string module, string level);

    /// <summary>
    /// True when the current user should only see rows scoped to their own zone
    /// (i.e. they are a seller, have a zone assigned, and are not admin).
    /// </summary>
    bool IsZoneScoped { get; }
}
