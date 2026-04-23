using ERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ERP.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        // EnsureCreated creates all tables from the model without needing migration files.
        // To switch to migrations later: run `dotnet ef migrations add Initial` and change this to MigrateAsync().
        await context.Database.EnsureCreatedAsync();

        await EnsureSchemaAsync(context);

        if (!await context.Roles.AnyAsync())
        {
            context.Roles.AddRange(
                new Role { Code = "ADM", Name = "Administrador", IsSeller = false, CreatedBy = "system" },
                new Role { Code = "VND", Name = "Vendedor", IsSeller = true, CreatedBy = "system" },
                new Role { Code = "FIN", Name = "Finanzas", IsSeller = false, CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Permissions.AnyAsync())
        {
            var modules = new (string Key, string Label)[]
            {
                ("dashboard", "Dashboard"),
                ("clients", "Clientes"),
                ("suppliers", "Proveedores"),
                ("products", "Productos"),
                ("pricelists", "Listas de Precios"),
                ("sales", "Facturas de Venta"),
                ("purchases", "Facturas de Compra"),
                ("stock", "Stock"),
                ("cash", "Caja"),
                ("receivables", "Cuentas por Cobrar"),
                ("payables", "Cuentas por Pagar"),
                ("reports", "Reportes"),
                ("params", "Parametrización"),
                ("security", "Seguridad"),
            };
            foreach (var (key, label) in modules)
            {
                context.Permissions.Add(new Permission
                {
                    Code = $"PERM_{key.ToUpper()}",
                    Module = key,
                    Action = "access",
                    Description = label,
                    CreatedBy = "system",
                });
            }
            await context.SaveChangesAsync();

            // Give admin role full access
            var admin = await context.Roles.FirstOrDefaultAsync(r => r.Code == "ADM");
            if (admin != null)
            {
                var perms = await context.Permissions.ToListAsync();
                foreach (var p in perms)
                    context.RolePermissions.Add(new RolePermission { RoleId = admin.Id, PermissionId = p.Id, CanRead = true, CanWrite = true, CanDelete = true, ViewAll = true });
                await context.SaveChangesAsync();
            }
        }

        if (!await context.Users.AnyAsync())
        {
            var adminRole = await context.Roles.FirstAsync(r => r.Code == "ADM");
            var admin = new User
            {
                Code = "USR001",
                FirstName = "Admin",
                LastName = "Sistema",
                Email = "admin@erp.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Theme = "light",
                IsActive = true,
                CreatedBy = "system"
            };
            context.Users.Add(admin);
            await context.SaveChangesAsync();
            context.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id, AssignedBy = "system" });
            await context.SaveChangesAsync();
        }

        if (!await context.VatConditions.AnyAsync())
        {
            context.VatConditions.AddRange(
                new VatCondition { Code = "RI", Name = "Responsable Inscripto", AfipCode = "01", VatRate = 21, CreatedBy = "system" },
                new VatCondition { Code = "MO", Name = "Monotributista", AfipCode = "06", VatRate = 0, CreatedBy = "system" },
                new VatCondition { Code = "EX", Name = "Exento", AfipCode = "04", VatRate = 0, CreatedBy = "system" },
                new VatCondition { Code = "CF", Name = "Consumidor Final", AfipCode = "05", VatRate = 21, CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.PaymentConditions.AnyAsync())
        {
            context.PaymentConditions.AddRange(
                new PaymentCondition { Code = "CONT", Name = "Contado", DueDays = 0, CreatedBy = "system" },
                new PaymentCondition { Code = "30D", Name = "30 días", DueDays = 30, CreatedBy = "system" },
                new PaymentCondition { Code = "60D", Name = "60 días", DueDays = 60, CreatedBy = "system" },
                new PaymentCondition { Code = "90D", Name = "90 días", DueDays = 90, CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.StockLocations.AnyAsync())
        {
            context.StockLocations.Add(new StockLocation
            {
                Code = "DEP01", Name = "Depósito Central", Type = "warehouse", CreatedBy = "system"
            });
            await context.SaveChangesAsync();
        }

        if (!await context.SystemConfigs.AnyAsync())
        {
            context.SystemConfigs.Add(new SystemConfig
            {
                Code = "CFG001", CompanyName = "Mi Empresa S.A.",
                Currency = "ARS", CurrencySymbol = "$",
                AllowNegativeStock = false, CreatedBy = "system"
            });
            await context.SaveChangesAsync();
        }

        if (!await context.Categories.AnyAsync())
        {
            context.Categories.AddRange(
                new Category { Code = "CAT01", Name = "General", CreatedBy = "system" },
                new Category { Code = "CAT02", Name = "Electrónica", CreatedBy = "system" },
                new Category { Code = "CAT03", Name = "Ropa", CreatedBy = "system" },
                new Category { Code = "CAT04", Name = "Alimentos", CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.PriceLists.AnyAsync())
        {
            context.PriceLists.AddRange(
                new PriceList { Code = "LP01", Name = "Lista General", CreatedBy = "system" },
                new PriceList { Code = "LP02", Name = "Lista Mayorista", CreatedBy = "system" },
                new PriceList { Code = "LP03", Name = "Lista Minorista", CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.ClientTypes.AnyAsync())
        {
            context.ClientTypes.AddRange(
                new ClientType { Code = "EMP", Name = "Empresa", CreatedBy = "system" },
                new ClientType { Code = "CF", Name = "Consumidor Final", CreatedBy = "system" },
                new ClientType { Code = "MAY", Name = "Mayorista", CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.InvoiceTypes.AnyAsync())
        {
            context.InvoiceTypes.AddRange(
                new InvoiceType { Code = "A", Name = "Factura A", Kind = "sales", CreatedBy = "system" },
                new InvoiceType { Code = "B", Name = "Factura B", Kind = "sales", CreatedBy = "system" },
                new InvoiceType { Code = "C", Name = "Factura C", Kind = "sales", CreatedBy = "system" },
                new InvoiceType { Code = "X", Name = "Comprobante X", Description = "Documento interno sin valor fiscal", Kind = "sales", CreatedBy = "system" },
                new InvoiceType { Code = "NC-A", Name = "Nota de Crédito A", Kind = "sales", CreatedBy = "system" },
                new InvoiceType { Code = "NC-B", Name = "Nota de Crédito B", Kind = "sales", CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.PaymentMethods.AnyAsync())
        {
            context.PaymentMethods.AddRange(
                new PaymentMethod { Code = "EFE", Name = "Efectivo", Type = "cash", AffectsCash = true, CreatedBy = "system" },
                new PaymentMethod { Code = "TRF", Name = "Transferencia", Type = "transfer", AffectsCash = false, CreatedBy = "system" },
                new PaymentMethod { Code = "TDB", Name = "Tarjeta de Débito", Type = "card", AffectsCash = false, CreatedBy = "system" },
                new PaymentMethod { Code = "TCR", Name = "Tarjeta de Crédito", Type = "card", AffectsCash = false, CreatedBy = "system" },
                new PaymentMethod { Code = "CHQ", Name = "Cheque", Type = "check", AffectsCash = false, CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
        }

        logger.LogInformation("Database seeding completed.");
    }

    private static async Task EnsureSchemaAsync(AppDbContext context)
    {
        if (!await ColumnExistsAsync(context, "SalesInvoiceItems", "StockLocationId"))
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE SalesInvoiceItems ADD COLUMN StockLocationId INTEGER NOT NULL DEFAULT 0");
            // Backfill from parent invoice so existing items point to the invoice's location.
            await context.Database.ExecuteSqlRawAsync(@"
                UPDATE SalesInvoiceItems
                SET StockLocationId = (SELECT StockLocationId FROM SalesInvoices WHERE SalesInvoices.Id = SalesInvoiceItems.SalesInvoiceId)
                WHERE StockLocationId = 0");
        }

        if (!await TableExistsAsync(context, "PaymentMethods"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE PaymentMethods (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    Name TEXT NOT NULL DEFAULT '',
                    Type TEXT NOT NULL DEFAULT 'cash',
                    AffectsCash INTEGER NOT NULL DEFAULT 1,
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    Notes TEXT NULL,
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL
                )");
        }

        if (!await TableExistsAsync(context, "SalesPayments"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE SalesPayments (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    SalesInvoiceId INTEGER NOT NULL,
                    PaymentMethodId INTEGER NOT NULL,
                    PaymentDate TEXT NOT NULL,
                    Amount decimal(18,4) NOT NULL DEFAULT 0,
                    Reference TEXT NULL,
                    Notes TEXT NULL,
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL,
                    FOREIGN KEY (SalesInvoiceId) REFERENCES SalesInvoices(Id),
                    FOREIGN KEY (PaymentMethodId) REFERENCES PaymentMethods(Id)
                )");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_SalesPayments_SalesInvoiceId ON SalesPayments(SalesInvoiceId)");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_SalesPayments_PaymentMethodId ON SalesPayments(PaymentMethodId)");
        }

        if (!await ColumnExistsAsync(context, "Zones", "DefaultSellerId"))
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE Zones ADD COLUMN DefaultSellerId INTEGER NULL");
        }

        if (!await ColumnExistsAsync(context, "PriceLists", "DefaultProfitPercentage"))
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE PriceLists ADD COLUMN DefaultProfitPercentage decimal(18,4) NOT NULL DEFAULT 0");
        }

        if (!await ColumnExistsAsync(context, "Products", "Brand"))
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE Products ADD COLUMN Brand TEXT NULL");
        }

        if (!await ColumnExistsAsync(context, "Products", "Model"))
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE Products ADD COLUMN Model TEXT NULL");
        }

        if (!await TableExistsAsync(context, "ProductPhotos"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE ProductPhotos (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    ProductId INTEGER NOT NULL,
                    FileName TEXT NOT NULL DEFAULT '',
                    Url TEXT NOT NULL DEFAULT '',
                    FileSizeBytes INTEGER NOT NULL DEFAULT 0,
                    IsDefault INTEGER NOT NULL DEFAULT 0,
                    SortOrder INTEGER NOT NULL DEFAULT 0,
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL,
                    FOREIGN KEY (ProductId) REFERENCES Products(Id)
                )");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_ProductPhotos_ProductId ON ProductPhotos(ProductId)");
        }

        if (!await TableExistsAsync(context, "ProductDocuments"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE ProductDocuments (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    ProductId INTEGER NOT NULL,
                    FileName TEXT NOT NULL DEFAULT '',
                    FileUrl TEXT NOT NULL DEFAULT '',
                    FileType TEXT NOT NULL DEFAULT '',
                    FileSizeBytes INTEGER NOT NULL DEFAULT 0,
                    Description TEXT NULL,
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL,
                    FOREIGN KEY (ProductId) REFERENCES Products(Id)
                )");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_ProductDocuments_ProductId ON ProductDocuments(ProductId)");
        }

        if (!await ColumnExistsAsync(context, "PriceListItems", "HasPriceConfigured"))
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE PriceListItems ADD COLUMN HasPriceConfigured INTEGER NOT NULL DEFAULT 0");
            // Existing items with non-zero % or fixed price are considered configured
            await context.Database.ExecuteSqlRawAsync(@"
                UPDATE PriceListItems
                SET HasPriceConfigured = 1
                WHERE ProfitPercentage <> 0 OR FixedPrice <> 0");
        }

        if (!await TableExistsAsync(context, "InvoiceTypes"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE InvoiceTypes (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    Name TEXT NOT NULL DEFAULT '',
                    Description TEXT NULL,
                    Kind TEXT NOT NULL DEFAULT 'sales',
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL
                )");
        }

        if (!await TableExistsAsync(context, "CashSessions"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE CashSessions (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    OpeningDate TEXT NOT NULL,
                    OpeningBalance decimal(18,4) NOT NULL DEFAULT 0,
                    ClosingDate TEXT NULL,
                    CountedBalance decimal(18,4) NULL,
                    ExpectedBalance decimal(18,4) NULL,
                    DifferenceAmount decimal(18,4) NULL,
                    Status TEXT NOT NULL DEFAULT 'open',
                    ClosedBy TEXT NULL,
                    Notes TEXT NULL,
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL
                )");
        }

        if (!await TableExistsAsync(context, "CashMovements"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE CashMovements (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    CashSessionId INTEGER NOT NULL,
                    MovementDate TEXT NOT NULL,
                    Type TEXT NOT NULL DEFAULT 'income',
                    Amount decimal(18,4) NOT NULL DEFAULT 0,
                    PaymentMethodId INTEGER NULL,
                    ReferenceType TEXT NULL,
                    ReferenceId INTEGER NULL,
                    Description TEXT NOT NULL DEFAULT '',
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL,
                    FOREIGN KEY (CashSessionId) REFERENCES CashSessions(Id),
                    FOREIGN KEY (PaymentMethodId) REFERENCES PaymentMethods(Id)
                )");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_CashMovements_CashSessionId ON CashMovements(CashSessionId)");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_CashMovements_PaymentMethodId ON CashMovements(PaymentMethodId)");
        }

        if (!await TableExistsAsync(context, "PurchasePayments"))
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE PurchasePayments (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Code TEXT NOT NULL DEFAULT '',
                    PurchaseInvoiceId INTEGER NOT NULL,
                    PaymentMethodId INTEGER NOT NULL,
                    PaymentDate TEXT NOT NULL,
                    Amount decimal(18,4) NOT NULL DEFAULT 0,
                    Reference TEXT NULL,
                    Notes TEXT NULL,
                    IsDeleted INTEGER NOT NULL DEFAULT 0,
                    CreatedBy TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    ModifiedBy TEXT NULL,
                    ModifiedAt TEXT NULL,
                    DeletedBy TEXT NULL,
                    DeletedAt TEXT NULL,
                    FOREIGN KEY (PurchaseInvoiceId) REFERENCES PurchaseInvoices(Id),
                    FOREIGN KEY (PaymentMethodId) REFERENCES PaymentMethods(Id)
                )");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_PurchasePayments_PurchaseInvoiceId ON PurchasePayments(PurchaseInvoiceId)");
            await context.Database.ExecuteSqlRawAsync("CREATE INDEX IX_PurchasePayments_PaymentMethodId ON PurchasePayments(PaymentMethodId)");
        }
    }

    private static async Task<bool> TableExistsAsync(AppDbContext context, string table)
    {
        var conn = context.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT 1 FROM sqlite_master WHERE type='table' AND name=$name";
        var param = cmd.CreateParameter();
        param.ParameterName = "$name";
        param.Value = table;
        cmd.Parameters.Add(param);
        var result = await cmd.ExecuteScalarAsync();
        return result != null;
    }

    private static async Task<bool> ColumnExistsAsync(AppDbContext context, string table, string column)
    {
        var conn = context.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"PRAGMA table_info({table})";
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            if (string.Equals(reader.GetString(1), column, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
