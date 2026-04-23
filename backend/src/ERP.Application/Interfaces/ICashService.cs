using ERP.Application.DTOs.Cash;

namespace ERP.Application.Interfaces;

public interface ICashService
{
    Task<CashSessionDetailDto?> GetCurrentAsync();
    Task<IEnumerable<CashSessionListDto>> GetSessionsAsync(DateTime? from = null, DateTime? to = null);
    Task<CashSessionDetailDto> GetSessionAsync(int id);
    Task<CashSessionDetailDto> OpenAsync(OpenCashSessionDto dto, string createdBy);
    Task<CashSessionDetailDto> CloseAsync(int id, CloseCashSessionDto dto, string closedBy);
    Task<CashMovementDto> AddMovementAsync(int sessionId, AddCashMovementDto dto, string createdBy);
    Task DeleteMovementAsync(int movementId, string deletedBy);
}
