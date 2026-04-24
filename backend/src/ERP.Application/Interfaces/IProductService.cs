using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Products;

namespace ERP.Application.Interfaces;

public interface IProductService
{
    Task<PagedResultDto<ProductListDto>> GetAllAsync(QueryParamsDto query);
    Task<ProductDetailDto> GetByIdAsync(int id);
    Task<IEnumerable<ProductSearchDto>> SearchAsync(string term);
    Task<ProductDetailDto> CreateAsync(CreateProductDto dto, string createdBy);
    Task<ProductDetailDto> UpdateAsync(int id, UpdateProductDto dto, string modifiedBy);
    Task SoftDeleteAsync(int id, string deletedBy);
    Task RestoreAsync(int id, string restoredBy);
    Task<string> UploadPhotoAsync(int productId, Stream photoStream, string fileName);
}
