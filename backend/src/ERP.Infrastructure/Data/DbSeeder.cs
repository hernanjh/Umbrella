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

        if (!await context.Roles.AnyAsync())
        {
            context.Roles.AddRange(
                new Role { Code = "ADM", Name = "Administrador", IsSeller = false, CreatedBy = "system" },
                new Role { Code = "VND", Name = "Vendedor", IsSeller = true, CreatedBy = "system" },
                new Role { Code = "FIN", Name = "Finanzas", IsSeller = false, CreatedBy = "system" }
            );
            await context.SaveChangesAsync();
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

        logger.LogInformation("Database seeding completed.");
    }
}
