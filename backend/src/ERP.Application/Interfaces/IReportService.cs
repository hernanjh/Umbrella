using ERP.Application.DTOs.Reports;

namespace ERP.Application.Interfaces;

public interface IReportService
{
    Task<SalesByPeriodReportDto> GetSalesByPeriodAsync(ReportQueryDto query);
    Task<SalesBySellerReportDto> GetSalesBySellerAsync(ReportQueryDto query);
    Task<SalesByClientReportDto> GetSalesByClientAsync(ReportQueryDto query);
    Task<StockReportDto> GetStockReportAsync(ReportQueryDto query);
    Task<PaymentsReportDto> GetPaymentsReportAsync(ReportQueryDto query);
    Task<ReceivablesReportDto> GetReceivablesReportAsync();
    Task<PayablesReportDto> GetPayablesReportAsync();
    Task<CashReportDto> GetCashReportAsync(ReportQueryDto query);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
    Task<byte[]> ExportToExcelAsync(string reportType, ReportQueryDto query);
    Task<byte[]> ExportToPdfAsync(string reportType, ReportQueryDto query);
}
