using ERP.Application.DTOs.Payments;

namespace ERP.Application.Interfaces;

public interface IPaymentMethodService
{
    Task<IEnumerable<PaymentMethodDto>> GetAllAsync(bool includeInactive = false);
    Task<PaymentMethodDto> CreateAsync(CreatePaymentMethodDto dto, string createdBy);
    Task<PaymentMethodDto> UpdateAsync(int id, UpdatePaymentMethodDto dto, string modifiedBy);
    Task DeleteAsync(int id, string deletedBy);
}

public interface ISalesPaymentService
{
    Task<IEnumerable<SalesPaymentDto>> GetByInvoiceAsync(int invoiceId);
    Task<SalesPaymentDto> CreateAsync(int invoiceId, CreateSalesPaymentDto dto, string createdBy);
    Task DeleteAsync(int paymentId, string deletedBy);
}

public interface IPurchasePaymentService
{
    Task<IEnumerable<PurchasePaymentDto>> GetByInvoiceAsync(int invoiceId);
    Task<PurchasePaymentDto> CreateAsync(int invoiceId, CreatePurchasePaymentDto dto, string createdBy);
    Task DeleteAsync(int paymentId, string deletedBy);
}

public interface IClientAccountService
{
    Task<ClientAccountDto> GetAsync(int clientId);
    Task<byte[]> ExportExcelAsync(int clientId);
    Task<byte[]> ExportPdfAsync(int clientId);
}

public interface ISupplierAccountService
{
    Task<SupplierAccountDto> GetAsync(int supplierId);
    Task<byte[]> ExportExcelAsync(int supplierId);
    Task<byte[]> ExportPdfAsync(int supplierId);
}
