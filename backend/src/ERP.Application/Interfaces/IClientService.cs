using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Clients;

namespace ERP.Application.Interfaces;

public interface IClientService
{
    Task<PagedResultDto<ClientListDto>> GetAllAsync(QueryParamsDto query, int? requestingUserId = null);
    Task<ClientDetailDto> GetByIdAsync(int id);
    Task<IEnumerable<ClientSearchDto>> SearchAsync(string term);
    Task<ClientDetailDto> CreateAsync(CreateClientDto dto, string createdBy);
    Task<ClientDetailDto> UpdateAsync(int id, UpdateClientDto dto, string modifiedBy);
    Task SoftDeleteAsync(int id, string deletedBy);
    Task RestoreAsync(int id, string restoredBy);
    Task<ClientDocumentDto> AddDocumentAsync(int clientId, Stream fileStream, string fileName, string fileType, string? description, string createdBy);
    Task RemoveDocumentAsync(int documentId, string deletedBy);
}
