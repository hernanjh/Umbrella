using ERP.Application.DTOs.Common;
using ERP.Application.DTOs.Invoices;

namespace ERP.Application.Interfaces;

public interface ISalesInvoiceService
{
    Task<PagedResultDto<SalesInvoiceListDto>> GetAllAsync(QueryParamsDto query, int? sellerId = null);
    Task<SalesInvoiceDetailDto> GetByIdAsync(int id);
    Task<SalesInvoiceDetailDto> CreateAsync(CreateSalesInvoiceDto dto, string createdBy);
    Task<SalesInvoiceDetailDto> UpdateAsync(int id, CreateSalesInvoiceDto dto, string modifiedBy);
    Task ConfirmAsync(int id, string confirmedBy);
    Task CancelAsync(int id, string cancelledBy);
    Task SoftDeleteAsync(int id, string deletedBy);
}

public interface IPurchaseInvoiceService
{
    Task<PagedResultDto<PurchaseInvoiceListDto>> GetAllAsync(QueryParamsDto query);
    Task<PurchaseInvoiceDetailDto> GetByIdAsync(int id);
    Task<PurchaseInvoiceDetailDto> CreateAsync(CreatePurchaseInvoiceDto dto, string createdBy);
    Task<PurchaseInvoiceDetailDto> UpdateAsync(int id, CreatePurchaseInvoiceDto dto, string modifiedBy);
    Task ConfirmAsync(int id, string confirmedBy);
    Task CancelAsync(int id, string cancelledBy);
    Task SoftDeleteAsync(int id, string deletedBy);
}
