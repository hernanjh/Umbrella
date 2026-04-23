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
    public async Task<IActionResult> Create([FromBody] CreatePaymentMethodDto dto)
        => Ok(new { success = true, data = await _service.CreateAsync(dto, CurrentUserEmail) });

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePaymentMethodDto dto)
        => Ok(new { success = true, data = await _service.UpdateAsync(id, dto, CurrentUserEmail) });

    [HttpDelete("{id}")]
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
    public async Task<IActionResult> GetByInvoice(int invoiceId)
        => Ok(new { success = true, data = await _service.GetByInvoiceAsync(invoiceId) });

    [HttpPost]
    public async Task<IActionResult> Create(int invoiceId, [FromBody] CreateSalesPaymentDto dto)
        => Ok(new { success = true, data = await _service.CreateAsync(invoiceId, dto, CurrentUserEmail) });

    [HttpDelete("{paymentId}")]
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
    public async Task<IActionResult> GetByInvoice(int invoiceId)
        => Ok(new { success = true, data = await _service.GetByInvoiceAsync(invoiceId) });

    [HttpPost]
    public async Task<IActionResult> Create(int invoiceId, [FromBody] CreatePurchasePaymentDto dto)
        => Ok(new { success = true, data = await _service.CreateAsync(invoiceId, dto, CurrentUserEmail) });

    [HttpDelete("{paymentId}")]
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
    public async Task<IActionResult> GetAccount(int clientId)
        => Ok(new { success = true, data = await _service.GetAsync(clientId) });
}

[Authorize]
[Route("api/suppliers/{supplierId}/account")]
public class SupplierAccountController : BaseController
{
    private readonly ISupplierAccountService _service;
    public SupplierAccountController(ISupplierAccountService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAccount(int supplierId)
        => Ok(new { success = true, data = await _service.GetAsync(supplierId) });
}
