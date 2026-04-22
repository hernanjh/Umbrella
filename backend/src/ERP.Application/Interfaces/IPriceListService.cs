using ERP.Application.DTOs.PriceLists;
using ERP.Application.DTOs.Common;

namespace ERP.Application.Interfaces;

public interface IPriceListService
{
    Task<PagedResultDto<PriceListListDto>> GetAllAsync(QueryParamsDto query);
    Task<PriceListDetailDto> GetByIdAsync(int id);
    Task<PriceListDetailDto> CreateAsync(CreatePriceListDto dto, string createdBy);
    Task<PriceListDetailDto> UpdateAsync(int id, UpdatePriceListDto dto, string modifiedBy);
    Task SoftDeleteAsync(int id, string deletedBy);
    Task UpsertItemAsync(int priceListId, UpsertPriceListItemDto dto, string modifiedBy);
    Task RemoveItemAsync(int priceListId, int productId, string modifiedBy);
    Task BulkUpdateAsync(int priceListId, BulkUpdatePriceListDto dto, string modifiedBy);
    Task RecalculatePricesAsync(int priceListId);
}
