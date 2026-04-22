using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Suppliers;

namespace ERP.Application.Interfaces;

public interface ISupplierService
{
    Task<PagedResultDto<SupplierListDto>> GetAllAsync(QueryParamsDto query);
    Task<SupplierDetailDto> GetByIdAsync(int id);
    Task<IEnumerable<SupplierSearchDto>> SearchAsync(string term);
    Task<SupplierDetailDto> CreateAsync(CreateSupplierDto dto, string createdBy);
    Task<SupplierDetailDto> UpdateAsync(int id, UpdateSupplierDto dto, string modifiedBy);
    Task SoftDeleteAsync(int id, string deletedBy);
    Task RestoreAsync(int id, string restoredBy);
}
