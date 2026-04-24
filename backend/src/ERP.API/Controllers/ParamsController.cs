using ERP.API.Attributes;
using ERP.Application.DTOs.Params;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.API.Controllers;

[Authorize]
[Route("api/params")]
public class ParamsController : BaseController
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    public ParamsController(AppDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    // ---- CLIENT TYPES ----
    // GETs stay open to any authenticated user — other modules (clients/sales forms) need them
    [HttpGet("client-types")] public async Task<IActionResult> GetClientTypes()
        => Ok(new { success = true, data = await _db.ClientTypes.Select(x => new ClientTypeDto(x.Id, x.Code, x.Name, x.Description, x.IsActive, x.DefaultPriceListId, x.DefaultPriceList != null ? x.DefaultPriceList.Name : null)).ToListAsync() });

    [HttpPost("client-types")] [RequirePermission("params", "write")] public async Task<IActionResult> CreateClientType([FromBody] CreateClientTypeDto dto)
    { var e = new ClientType { Code = dto.Code, Name = dto.Name, Description = dto.Description, DefaultPriceListId = dto.DefaultPriceListId, CreatedBy = CurrentUserEmail }; _db.ClientTypes.Add(e); await _uow.SaveChangesAsync(); return Ok(new { success = true, data = e.Id }); }

    [HttpPut("client-types/{id}")] [RequirePermission("params", "write")] public async Task<IActionResult> UpdateClientType(int id, [FromBody] UpdateClientTypeDto dto)
    { var e = await _db.ClientTypes.FindAsync(id) ?? throw new KeyNotFoundException(); e.Name = dto.Name; e.Description = dto.Description; e.IsActive = dto.IsActive; e.DefaultPriceListId = dto.DefaultPriceListId; e.ModifiedBy = CurrentUserEmail; e.ModifiedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }

    [HttpDelete("client-types/{id}")] [RequirePermission("params", "delete")] public async Task<IActionResult> DeleteClientType(int id)
    { var e = await _db.ClientTypes.FindAsync(id) ?? throw new KeyNotFoundException(); e.IsDeleted = true; e.DeletedBy = CurrentUserEmail; e.DeletedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }

    // ---- ZONES ----
    [HttpGet("zones")] public async Task<IActionResult> GetZones()
        => Ok(new { success = true, data = await _db.Zones.Include(z => z.DefaultSeller)
            .Select(x => new ZoneDto(x.Id, x.Code, x.Name, x.Description, x.IsActive, x.DefaultSellerId,
                x.DefaultSeller != null ? x.DefaultSeller.FirstName + " " + x.DefaultSeller.LastName : null)).ToListAsync() });

    [HttpPost("zones")] [RequirePermission("params", "write")] public async Task<IActionResult> CreateZone([FromBody] CreateZoneDto dto)
    { var e = new Zone { Code = dto.Code, Name = dto.Name, Description = dto.Description, DefaultSellerId = dto.DefaultSellerId, CreatedBy = CurrentUserEmail }; _db.Zones.Add(e); await _uow.SaveChangesAsync(); return Ok(new { success = true, data = e.Id }); }

    [HttpPut("zones/{id}")] [RequirePermission("params", "write")] public async Task<IActionResult> UpdateZone(int id, [FromBody] UpdateZoneDto dto)
    { var e = await _db.Zones.FindAsync(id) ?? throw new KeyNotFoundException(); e.Name = dto.Name; e.Description = dto.Description; e.IsActive = dto.IsActive; e.DefaultSellerId = dto.DefaultSellerId; e.ModifiedBy = CurrentUserEmail; e.ModifiedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }

    [HttpDelete("zones/{id}")] [RequirePermission("params", "delete")] public async Task<IActionResult> DeleteZone(int id)
    { var e = await _db.Zones.FindAsync(id) ?? throw new KeyNotFoundException(); e.IsDeleted = true; e.DeletedBy = CurrentUserEmail; e.DeletedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }

    // ---- INVOICE TYPES ----
    [HttpGet("invoice-types")] public async Task<IActionResult> GetInvoiceTypes()
        => Ok(new { success = true, data = await _db.InvoiceTypes.OrderBy(x => x.Code)
            .Select(x => new InvoiceTypeDto(x.Id, x.Code, x.Name, x.Description, x.Kind, x.IsActive)).ToListAsync() });

    [HttpPost("invoice-types")] [RequirePermission("params", "write")] public async Task<IActionResult> CreateInvoiceType([FromBody] CreateInvoiceTypeDto dto)
    {
        if (await _db.InvoiceTypes.AnyAsync(it => it.Code == dto.Code && it.Kind == dto.Kind))
            throw new InvalidOperationException($"Ya existe un tipo '{dto.Code}' para {dto.Kind}.");
        var e = new InvoiceType { Code = dto.Code, Name = dto.Name, Description = dto.Description, Kind = dto.Kind, CreatedBy = CurrentUserEmail };
        _db.InvoiceTypes.Add(e); await _uow.SaveChangesAsync();
        return Ok(new { success = true, data = e.Id });
    }

    [HttpPut("invoice-types/{id}")] [RequirePermission("params", "write")] public async Task<IActionResult> UpdateInvoiceType(int id, [FromBody] UpdateInvoiceTypeDto dto)
    {
        var e = await _db.InvoiceTypes.FindAsync(id) ?? throw new KeyNotFoundException();
        e.Name = dto.Name; e.Description = dto.Description; e.Kind = dto.Kind; e.IsActive = dto.IsActive;
        e.ModifiedBy = CurrentUserEmail; e.ModifiedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("invoice-types/{id}")] [RequirePermission("params", "delete")] public async Task<IActionResult> DeleteInvoiceType(int id)
    {
        var e = await _db.InvoiceTypes.FindAsync(id) ?? throw new KeyNotFoundException();
        e.IsDeleted = true; e.DeletedBy = CurrentUserEmail; e.DeletedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---- VAT CONDITIONS ----
    [HttpGet("vat-conditions")] public async Task<IActionResult> GetVatConditions()
        => Ok(new { success = true, data = await _db.VatConditions.Select(x => new VatConditionDto(x.Id, x.Code, x.Name, x.AfipCode, x.VatRate, x.IsActive)).ToListAsync() });

    [HttpPost("vat-conditions")] [RequirePermission("params", "write")] public async Task<IActionResult> CreateVatCondition([FromBody] CreateVatConditionDto dto)
    { var e = new VatCondition { Code = dto.Code, Name = dto.Name, AfipCode = dto.AfipCode, VatRate = dto.VatRate, CreatedBy = CurrentUserEmail }; _db.VatConditions.Add(e); await _uow.SaveChangesAsync(); return Ok(new { success = true, data = e.Id }); }

    [HttpPut("vat-conditions/{id}")] [RequirePermission("params", "write")] public async Task<IActionResult> UpdateVatCondition(int id, [FromBody] UpdateVatConditionDto dto)
    { var e = await _db.VatConditions.FindAsync(id) ?? throw new KeyNotFoundException(); e.Name = dto.Name; e.AfipCode = dto.AfipCode; e.VatRate = dto.VatRate; e.IsActive = dto.IsActive; e.ModifiedBy = CurrentUserEmail; e.ModifiedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }

    // ---- PAYMENT CONDITIONS ----
    [HttpGet("payment-conditions")] public async Task<IActionResult> GetPaymentConditions()
        => Ok(new { success = true, data = await _db.PaymentConditions.Select(x => new PaymentConditionDto(x.Id, x.Code, x.Name, x.Description, x.DueDays, x.IsActive)).ToListAsync() });

    [HttpPost("payment-conditions")] [RequirePermission("params", "write")] public async Task<IActionResult> CreatePaymentCondition([FromBody] CreatePaymentConditionDto dto)
    { var e = new PaymentCondition { Code = dto.Code, Name = dto.Name, Description = dto.Description, DueDays = dto.DueDays, CreatedBy = CurrentUserEmail }; _db.PaymentConditions.Add(e); await _uow.SaveChangesAsync(); return Ok(new { success = true, data = e.Id }); }

    [HttpPut("payment-conditions/{id}")] [RequirePermission("params", "write")] public async Task<IActionResult> UpdatePaymentCondition(int id, [FromBody] UpdatePaymentConditionDto dto)
    { var e = await _db.PaymentConditions.FindAsync(id) ?? throw new KeyNotFoundException(); e.Name = dto.Name; e.Description = dto.Description; e.DueDays = dto.DueDays; e.IsActive = dto.IsActive; e.ModifiedBy = CurrentUserEmail; e.ModifiedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }

    // ---- CATEGORIES ----
    [HttpGet("categories")] public async Task<IActionResult> GetCategories()
        => Ok(new { success = true, data = await _db.Categories.Include(c => c.ParentCategory).Select(x => new CategoryDto(x.Id, x.Code, x.Name, x.Description, x.ParentCategoryId, x.ParentCategory != null ? x.ParentCategory.Name : null, x.IsActive)).ToListAsync() });

    [HttpPost("categories")] [RequirePermission("params", "write")] public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    { var e = new Category { Code = dto.Code, Name = dto.Name, Description = dto.Description, ParentCategoryId = dto.ParentCategoryId, CreatedBy = CurrentUserEmail }; _db.Categories.Add(e); await _uow.SaveChangesAsync(); return Ok(new { success = true, data = e.Id }); }

    [HttpPut("categories/{id}")] [RequirePermission("params", "write")] public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    { var e = await _db.Categories.FindAsync(id) ?? throw new KeyNotFoundException(); e.Name = dto.Name; e.Description = dto.Description; e.ParentCategoryId = dto.ParentCategoryId; e.IsActive = dto.IsActive; e.ModifiedBy = CurrentUserEmail; e.ModifiedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }

    // ---- SYSTEM CONFIG ----
    [HttpGet("system-config")] public async Task<IActionResult> GetSystemConfig()
    { var cfg = await _db.SystemConfigs.FirstOrDefaultAsync() ?? throw new KeyNotFoundException(); return Ok(new { success = true, data = new SystemConfigDto(cfg.Id, cfg.CompanyName, cfg.CompanyAddress, cfg.CompanyPhone, cfg.CompanyEmail, cfg.CompanyCuit, cfg.LogoUrl, cfg.Website, cfg.Currency, cfg.CurrencySymbol, cfg.AllowNegativeStock, cfg.Timezone) }); }

    [HttpPut("system-config")] [RequirePermission("params", "write")] public async Task<IActionResult> UpdateSystemConfig([FromBody] UpdateSystemConfigDto dto)
    { var cfg = await _db.SystemConfigs.FirstOrDefaultAsync() ?? throw new KeyNotFoundException(); cfg.CompanyName = dto.CompanyName; cfg.CompanyAddress = dto.CompanyAddress; cfg.CompanyPhone = dto.CompanyPhone; cfg.CompanyEmail = dto.CompanyEmail; cfg.CompanyCuit = dto.CompanyCuit; cfg.Website = dto.Website; cfg.Currency = dto.Currency; cfg.CurrencySymbol = dto.CurrencySymbol; cfg.AllowNegativeStock = dto.AllowNegativeStock; cfg.Timezone = dto.Timezone; cfg.ModifiedBy = CurrentUserEmail; cfg.ModifiedAt = DateTime.UtcNow; await _uow.SaveChangesAsync(); return Ok(new { success = true }); }
}
