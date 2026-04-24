using ERP.Application.DTOs.Installments;

namespace ERP.Application.Interfaces;

public interface IInstallmentPlanService
{
    Task<InstallmentPlanDto?> GetByInvoiceAsync(int invoiceId);
    Task<InstallmentPlanDto> CreateAsync(int invoiceId, CreateInstallmentPlanDto dto, string createdBy);
    Task<InstallmentPlanDto> UpdateInstallmentAsync(int invoiceId, int installmentId, UpdateInstallmentDto dto, string modifiedBy);
    Task DeleteAsync(int invoiceId, string deletedBy);
    Task PayInstallmentAsync(int invoiceId, int installmentId, PayInstallmentDto dto, string createdBy);
    Task<IEnumerable<InstallmentPlanListItemDto>> GetAllAsync(string? status = null);
    Task<OverdueInstallmentReportDto> GetOverdueReportAsync();
}
