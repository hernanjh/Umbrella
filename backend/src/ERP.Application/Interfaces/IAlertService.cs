using ERP.Application.DTOs.Alerts;

namespace ERP.Application.Interfaces;

public interface IAlertService
{
    Task<AlertListDto> GetForCurrentUserAsync();
    Task MarkReadAsync(IEnumerable<string> keys);
    Task MarkAllReadAsync();
}
