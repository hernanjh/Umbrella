using ERP.API.Attributes;
using ERP.Application.DTOs.Payments;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/payment-methods")]
public class PaymentMethodsController : BaseController
{
    private readonly IPaymentMethodService _service;
    public PaymentMethodsController(IPaymentMethodService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
        => Ok(new { success = true, data = await _service.GetAllAsync(includeInactive) });

    [HttpPost]
    [RequirePermission("params", "write")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentMethodDto dto)
        => Ok(new { success = true, data = await _service.CreateAsync(dto, CurrentUserEmail) });

    [HttpPut("{id}")]
    [RequirePermission("params", "write")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePaymentMethodDto dto)
        => Ok(new { success = true, data = await _service.UpdateAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("{id}")]
    [RequirePermission("params", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, CurrentUserEmail);
        return Ok(new { success = true, message = "Eliminado." });
    }
}

[Authorize]
[Route("api/sales-invoices/{invoiceId}/payments")]
public class SalesPaymentsController : BaseController
{
    private readonly ISalesPaymentService _service;
    public SalesPaymentsController(ISalesPaymentService service) { _service = service; }

    [HttpGet]
    [RequirePermission("sales", "read")]
    public async Task<IActionResult> GetByInvoice(int invoiceId)
        => Ok(new { success = true, data = await _service.GetByInvoiceAsync(invoiceId) });

    [HttpPost]
    [RequirePermission("sales", "write")]
    public async Task<IActionResult> Create(int invoiceId, [FromBody] CreateSalesPaymentDto dto)
        => Ok(new { success = true, data = await _service.CreateAsync(invoiceId, dto, CurrentUserEmail) });

    [HttpDelete("{paymentId}")]
    [RequirePermission("sales", "delete")]
    public async Task<IActionResult> Delete(int invoiceId, int paymentId)
    {
        await _service.DeleteAsync(paymentId, CurrentUserEmail);
        return Ok(new { success = true, message = "Pago anulado." });
    }
}

[Authorize]
[Route("api/purchase-invoices/{invoiceId}/payments")]
public class PurchasePaymentsController : BaseController
{
    private readonly IPurchasePaymentService _service;
    public PurchasePaymentsController(IPurchasePaymentService service) { _service = service; }

    [HttpGet]
    [RequirePermission("purchases", "read")]
    public async Task<IActionResult> GetByInvoice(int invoiceId)
        => Ok(new { success = true, data = await _service.GetByInvoiceAsync(invoiceId) });

    [HttpPost]
    [RequirePermission("purchases", "write")]
    public async Task<IActionResult> Create(int invoiceId, [FromBody] CreatePurchasePaymentDto dto)
        => Ok(new { success = true, data = await _service.CreateAsync(invoiceId, dto, CurrentUserEmail) });

    [HttpDelete("{paymentId}")]
    [RequirePermission("purchases", "delete")]
    public async Task<IActionResult> Delete(int invoiceId, int paymentId)
    {
        await _service.DeleteAsync(paymentId, CurrentUserEmail);
        return Ok(new { success = true, message = "Pago anulado." });
    }
}

[Authorize]
[Route("api/clients/{clientId}/account")]
public class ClientAccountController : BaseController
{
    private readonly IClientAccountService _service;
    public ClientAccountController(IClientAccountService service) { _service = service; }

    [HttpGet]
    [RequirePermission("clients", "read")]
    public async Task<IActionResult> GetAccount(int clientId)
        => Ok(new { success = true, data = await _service.GetAsync(clientId) });

    [HttpGet("excel")]
    [RequirePermission("clients", "read")]
    public async Task<IActionResult> ExportExcel(int clientId)
    {
        var bytes = await _service.ExportExcelAsync(clientId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"cuenta-cliente-{clientId}.xlsx");
    }

    [HttpGet("pdf")]
    [RequirePermission("clients", "read")]
    public async Task<IActionResult> ExportPdf(int clientId)
    {
        var bytes = await _service.ExportPdfAsync(clientId);
        return File(bytes, "application/pdf", $"cuenta-cliente-{clientId}.pdf");
    }
}

[Authorize]
[Route("api/suppliers/{supplierId}/account")]
public class SupplierAccountController : BaseController
{
    private readonly ISupplierAccountService _service;
    public SupplierAccountController(ISupplierAccountService service) { _service = service; }

    [HttpGet]
    [RequirePermission("suppliers", "read")]
    public async Task<IActionResult> GetAccount(int supplierId)
        => Ok(new { success = true, data = await _service.GetAsync(supplierId) });

    [HttpGet("excel")]
    [RequirePermission("suppliers", "read")]
    public async Task<IActionResult> ExportExcel(int supplierId)
    {
        var bytes = await _service.ExportExcelAsync(supplierId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"cuenta-proveedor-{supplierId}.xlsx");
    }

    [HttpGet("pdf")]
    [RequirePermission("suppliers", "read")]
    public async Task<IActionResult> ExportPdf(int supplierId)
    {
        var bytes = await _service.ExportPdfAsync(supplierId);
        return File(bytes, "application/pdf", $"cuenta-proveedor-{supplierId}.pdf");
    }
}
