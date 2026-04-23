using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.API.Controllers;

[Authorize]
public class UploadsController : BaseController
{
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    private readonly IWebHostEnvironment _env;

    private static readonly string[] AllowedImage = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private static readonly string[] AllowedDoc = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".xls", ".xlsx"];
    private const long MaxSize = 10 * 1024 * 1024; // 10 MB

    public UploadsController(AppDbContext db, IUnitOfWork uow, IWebHostEnvironment env) { _db = db; _uow = uow; _env = env; }

    // ---------- Products ----------

    [HttpPost("api/products/{id}/photo")]
    public async Task<IActionResult> UploadProductPhoto(int id, IFormFile file)
    {
        var product = await _db.Products.FindAsync(id) ?? throw new KeyNotFoundException();
        Validate(file, AllowedImage);
        var url = await SaveFileAsync(file, $"products/{id}");
        product.PhotoUrl = url;
        product.ModifiedBy = CurrentUserEmail;
        product.ModifiedAt = DateTime.UtcNow;
        _db.Products.Update(product);
        await _uow.SaveChangesAsync();
        return Ok(new { success = true, data = new { photoUrl = url } });
    }

    [HttpGet("api/products/{id}/documents")]
    public async Task<IActionResult> GetProductDocuments(int id)
        => Ok(new { success = true, data = await _db.ProductDocuments
            .Where(d => d.ProductId == id)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new { d.Id, d.FileName, d.FileUrl, d.FileType, d.FileSizeBytes, d.Description, d.CreatedAt, d.CreatedBy })
            .ToListAsync() });

    [HttpPost("api/products/{id}/documents")]
    public async Task<IActionResult> UploadProductDocument(int id, IFormFile file, [FromForm] string? description)
    {
        var product = await _db.Products.FindAsync(id) ?? throw new KeyNotFoundException();
        Validate(file, AllowedDoc);
        var url = await SaveFileAsync(file, $"products/{id}/docs");
        var doc = new ProductDocument
        {
            ProductId = product.Id,
            FileName = file.FileName,
            FileUrl = url,
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToLower(),
            FileSizeBytes = file.Length,
            Description = description,
            Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
            CreatedBy = CurrentUserEmail,
        };
        _db.ProductDocuments.Add(doc);
        await _uow.SaveChangesAsync();
        return Ok(new { success = true, data = new { doc.Id, doc.FileName, doc.FileUrl, doc.FileType, doc.FileSizeBytes } });
    }

    [HttpDelete("api/products/{id}/documents/{docId}")]
    public async Task<IActionResult> DeleteProductDocument(int id, int docId)
    {
        var doc = await _db.ProductDocuments.FirstOrDefaultAsync(d => d.Id == docId && d.ProductId == id) ?? throw new KeyNotFoundException();
        doc.IsDeleted = true;
        doc.DeletedBy = CurrentUserEmail;
        doc.DeletedAt = DateTime.UtcNow;
        _db.ProductDocuments.Update(doc);
        await _uow.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---------- Clients ----------

    [HttpGet("api/clients/{id}/documents")]
    public async Task<IActionResult> GetClientDocuments(int id)
        => Ok(new { success = true, data = await _db.ClientDocuments
            .Where(d => d.ClientId == id)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new { d.Id, d.FileName, d.FileUrl, d.FileType, d.FileSizeBytes, d.Description, d.CreatedAt, d.CreatedBy })
            .ToListAsync() });

    [HttpPost("api/clients/{id}/documents")]
    public async Task<IActionResult> UploadClientDocument(int id, IFormFile file, [FromForm] string? description)
    {
        var client = await _db.Clients.FindAsync(id) ?? throw new KeyNotFoundException();
        Validate(file, AllowedDoc);
        var url = await SaveFileAsync(file, $"clients/{id}/docs");
        var doc = new ClientDocument
        {
            ClientId = client.Id,
            FileName = file.FileName,
            FileUrl = url,
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToLower(),
            FileSizeBytes = file.Length,
            Description = description,
            Code = Guid.NewGuid().ToString("N")[..8].ToUpper(),
            CreatedBy = CurrentUserEmail,
        };
        _db.ClientDocuments.Add(doc);
        await _uow.SaveChangesAsync();
        return Ok(new { success = true, data = new { doc.Id, doc.FileName, doc.FileUrl, doc.FileType, doc.FileSizeBytes } });
    }

    [HttpDelete("api/clients/{id}/documents/{docId}")]
    public async Task<IActionResult> DeleteClientDocument(int id, int docId)
    {
        var doc = await _db.ClientDocuments.FirstOrDefaultAsync(d => d.Id == docId && d.ClientId == id) ?? throw new KeyNotFoundException();
        doc.IsDeleted = true;
        doc.DeletedBy = CurrentUserEmail;
        doc.DeletedAt = DateTime.UtcNow;
        _db.ClientDocuments.Update(doc);
        await _uow.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---------- Helpers ----------

    private static void Validate(IFormFile? file, string[] allowed)
    {
        if (file == null || file.Length == 0) throw new InvalidOperationException("Archivo vacío.");
        if (file.Length > MaxSize) throw new InvalidOperationException("Archivo demasiado grande (máx 10 MB).");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext)) throw new InvalidOperationException($"Extensión '{ext}' no permitida.");
    }

    private async Task<string> SaveFileAsync(IFormFile file, string relativeDir)
    {
        var root = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadsRoot = Path.Combine(root, "uploads", relativeDir);
        Directory.CreateDirectory(uploadsRoot);
        var safeName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString("N")[..8]}{Path.GetExtension(file.FileName)}";
        var fullPath = Path.Combine(uploadsRoot, safeName);
        using (var fs = System.IO.File.Create(fullPath)) await file.CopyToAsync(fs);
        return $"/uploads/{relativeDir.Replace('\\', '/')}/{safeName}";
    }
}
