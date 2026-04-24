using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Stock;

namespace ERP.Application.Interfaces;

public interface IStockService
{
    Task<IEnumerable<StockStatusDto>> GetStockStatusAsync(int? locationId = null, int? categoryId = null);
    Task<StockStatusDto> GetProductStockAsync(int productId);
    Task<PagedResultDto<StockMovementListDto>> GetMovementsAsync(QueryParamsDto query, int? productId = null, int? locationId = null);
    Task<PagedResultDto<StockAdjustmentListDto>> GetAdjustmentsAsync(QueryParamsDto query);
    Task<int> CreateAdjustmentAsync(CreateStockAdjustmentDto dto, string createdBy);
    Task ConfirmAdjustmentAsync(int adjustmentId, string confirmedBy);
    Task<IEnumerable<StockLocationListDto>> GetLocationsAsync();
    Task<StockLocationListDto> CreateLocationAsync(CreateStockLocationDto dto, string createdBy);
    Task<StockLocationListDto> UpdateLocationAsync(int id, UpdateStockLocationDto dto, string modifiedBy);
    Task DeleteLocationAsync(int id, string deletedBy);
}
