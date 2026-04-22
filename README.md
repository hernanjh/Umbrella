# Umbrella ERP - Sistema de Gestión de Compra y Venta

## Stack Tecnológico
- **Backend:** .NET 8 Web API (C#) — Clean Architecture
- **Frontend:** React 18 + TypeScript + Zustand + TailwindCSS
- **Base de Datos:** EF Core Code-First (SQLite por defecto, SQL Server listo con cambio de cadena)

## Estructura del Proyecto

```
/backend         → API REST .NET 8
  /src
    ERP.Domain       → Entidades, enums, interfaces base
    ERP.Application  → DTOs, servicios, validadores
    ERP.Infrastructure → DbContext, repositorios, migraciones
    ERP.API          → Controllers, middleware, configuración DI
/frontend        → React 18 SPA
```

## Arranque Rápido

### Backend
```bash
cd backend
dotnet restore
dotnet ef database update --project src/ERP.Infrastructure --startup-project src/ERP.API
dotnet run --project src/ERP.API
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Cambiar a SQL Server
Solo modificar `appsettings.json`:
```json
{
  "DatabaseProvider": "SqlServer",
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=ErpDb;..."
  }
}
```

## Credenciales por defecto
- Usuario: `admin@erp.com`
- Contraseña: `Admin123!`
