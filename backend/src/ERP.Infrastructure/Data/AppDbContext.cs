using ERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();
    public DbSet<ClientType> ClientTypes => Set<ClientType>();
    public DbSet<Zone> Zones => Set<Zone>();
    public DbSet<VatCondition> VatConditions => Set<VatCondition>();
    public DbSet<PaymentCondition> PaymentConditions => Set<PaymentCondition>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientDocument> ClientDocuments => Set<ClientDocument>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PriceList> PriceLists => Set<PriceList>();
    public DbSet<PriceListItem> PriceListItems => Set<PriceListItem>();
    public DbSet<StockLocation> StockLocations => Set<StockLocation>();
    public DbSet<StockEntry> StockEntries => Set<StockEntry>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
    public DbSet<StockAdjustmentItem> StockAdjustmentItems => Set<StockAdjustmentItem>();
    public DbSet<SalesInvoice> SalesInvoices => Set<SalesInvoice>();
    public DbSet<SalesInvoiceItem> SalesInvoiceItems => Set<SalesInvoiceItem>();
    public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();
    public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems => Set<PurchaseInvoiceItem>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<SalesPayment> SalesPayments => Set<SalesPayment>();
    public DbSet<PurchasePayment> PurchasePayments => Set<PurchasePayment>();
    public DbSet<CashSession> CashSessions => Set<CashSession>();
    public DbSet<CashMovement> CashMovements => Set<CashMovement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Composite PKs
        modelBuilder.Entity<UserRole>().HasKey(ur => new { ur.UserId, ur.RoleId });
        modelBuilder.Entity<RolePermission>().HasKey(rp => new { rp.RoleId, rp.PermissionId });

        // Unique indexes
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Product>().HasIndex(p => p.Barcode).IsUnique().HasFilter("Barcode IS NOT NULL");
        modelBuilder.Entity<StockEntry>().HasIndex(s => new { s.ProductId, s.StockLocationId }).IsUnique();

        // Decimal precision
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetColumnType("decimal(18,4)");
        }

        // Prevent cascade delete loops
        foreach (var relationship in modelBuilder.Model.GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }

        // Global query filter for soft deletes (applied per entity that extends BaseEntity)
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Role>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Client>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Supplier>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Product>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Category>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PriceList>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PriceListItem>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<StockLocation>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SalesInvoice>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PurchaseInvoice>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ClientType>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Zone>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<VatCondition>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PaymentCondition>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PaymentMethod>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SalesPayment>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PurchasePayment>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<CashSession>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<CashMovement>().HasQueryFilter(e => !e.IsDeleted);
    }
}
