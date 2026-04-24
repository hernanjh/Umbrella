// Build Manual Técnico - API Umbrella ERP
process.env.NODE_PATH = "C:\\Users\\hhegykozi\\AppData\\Roaming\\npm\\node_modules";
require("module").Module._initPaths();

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, TableOfContents,
} = require("docx");
const H = require("./_helpers.js");

const children = [];

// =================== PORTADA ===================
children.push(new Paragraph({ children: [new TextRun("")], spacing: { before: 2400 } }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "MANUAL TÉCNICO", bold: true, size: 72, color: H.BLUE })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 360 },
  children: [new TextRun({ text: "API REST Umbrella ERP", bold: true, size: 56, color: H.BLUE })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 1800 },
  children: [new TextRun({ text: "Guía de integración para sistemas externos", italics: true, size: 30, color: H.DARK_GRAY })],
}));
children.push(H.callout("info", "Dirigido a",
  "Desarrolladores, arquitectos de software e integradores que necesiten conectar sistemas externos (e-commerce, plataformas de contabilidad, apps móviles, integraciones B2B) con Umbrella ERP a través de su API REST."));
children.push(new Paragraph({ children: [new TextRun("")], spacing: { before: 1200 } }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Versión de la API: 1.0", size: 28, color: H.DARK_GRAY })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Abril 2026", size: 24, color: H.DARK_GRAY })],
}));
children.push(H.pageBreak());

// =================== ÍNDICE ===================
children.push(H.heading("Índice", HeadingLevel.HEADING_1));
children.push(new Paragraph({
  children: [new TableOfContents("Tabla de Contenidos", { hyperlink: true, headingStyleRange: "1-3" })],
}));
children.push(H.pageBreak());

// =================== 1. INTRODUCCIÓN ===================
children.push(H.heading("1. Introducción", HeadingLevel.HEADING_1));
children.push(H.p("Este manual describe la arquitectura técnica de Umbrella ERP y el uso completo de su API REST para permitir la integración con sistemas de terceros (tiendas en línea, pasarelas de pago, sistemas de contabilidad, reportería externa, aplicaciones móviles corporativas, etc.)."));
children.push(H.p("El sistema está construido con:"));
children.push(H.simpleTable(
  ["Componente", "Tecnología"],
  [
    ["Backend / API", ".NET 8 Web API (C#), Clean Architecture"],
    ["ORM", "Entity Framework Core (Code-First)"],
    ["Base de datos", "SQLite (por defecto) o SQL Server"],
    ["Autenticación", "JWT Bearer Tokens con refresh token"],
    ["Frontend", "React 18 + TypeScript + Vite"],
    ["Estado global frontend", "Zustand"],
    ["Estilos", "TailwindCSS"],
    ["Documentación interactiva", "Swagger / OpenAPI 3"],
    ["Contenerización", "Docker + Docker Compose"],
  ],
  [2800, 6560]
));

children.push(H.heading("1.1 Arquitectura general", HeadingLevel.HEADING_2));
children.push(H.p("El backend sigue una arquitectura por capas (Clean Architecture) que separa responsabilidades:"));
children.push(H.codeBlock(`backend/src/
├── ERP.Domain          → Entidades, enums, interfaces base (núcleo del negocio)
├── ERP.Application     → DTOs, servicios de aplicación, validadores, interfaces
├── ERP.Infrastructure  → DbContext, repositorios, migraciones EF, seeders
└── ERP.API             → Controllers, middleware, configuración DI, JWT`));
children.push(H.spacer());
children.push(H.p("Principales ventajas del diseño:"));
children.push(H.bullet("Dominio independiente de la infraestructura: la lógica de negocio no depende del motor de base de datos."));
children.push(H.bullet("Testabilidad: los servicios pueden probarse de forma aislada mediante mocks."));
children.push(H.bullet("Extensibilidad: nuevos adaptadores (MongoDB, PostgreSQL, colas de mensajería) pueden agregarse sin modificar el dominio."));
children.push(H.bullet("Seguridad centralizada: JWT validado por middleware ASP.NET Core; permisos evaluados en un atributo reutilizable."));

children.push(H.pageBreak());

// =================== 2. INSTALACIÓN Y CONFIGURACIÓN ===================
children.push(H.heading("2. Instalación y configuración", HeadingLevel.HEADING_1));

children.push(H.heading("2.1 Requisitos", HeadingLevel.HEADING_2));
children.push(H.bullet(".NET 8 SDK (para compilar y ejecutar el backend)"));
children.push(H.bullet("Node.js 18 o superior y npm (para el frontend)"));
children.push(H.bullet("Opcionalmente: Docker 24+ y Docker Compose para despliegue en contenedores"));
children.push(H.bullet("Base de datos: SQLite (archivo local, sin instalación) o SQL Server 2019+ para producción"));

children.push(H.heading("2.2 Estructura del repositorio", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`Umbrella/
├── backend/
│   ├── src/
│   │   ├── ERP.API/
│   │   ├── ERP.Application/
│   │   ├── ERP.Domain/
│   │   └── ERP.Infrastructure/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md`));

children.push(H.heading("2.3 Configuración del backend", HeadingLevel.HEADING_2));
children.push(H.p("El archivo backend/src/ERP.API/appsettings.json contiene los principales parámetros:"));
children.push(H.codeBlock(`{
  "DatabaseProvider": "Sqlite",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=erp.db"
  },
  "Jwt": {
    "Secret": "ERP_SECRET_KEY_CHANGE_IN_PRODUCTION_32CHARS!!",
    "Issuer": "UmbrellaERP",
    "Audience": "UmbrellaERP"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}`));
children.push(H.spacer());
children.push(H.callout("danger", "Clave JWT",
  "El valor de Jwt:Secret debe ser modificado en producción por una cadena aleatoria de al menos 32 caracteres. Nunca comparta ni reutilice esta clave entre entornos."));

children.push(H.heading("Cambiar a SQL Server", HeadingLevel.HEADING_3));
children.push(H.codeBlock(`{
  "DatabaseProvider": "SqlServer",
  "ConnectionStrings": {
    "DefaultConnection": "Server=MI-SERVIDOR;Database=ErpDb;User Id=sa;Password=***;TrustServerCertificate=True;"
  }
}`));

children.push(H.heading("Variables de entorno (alternativa)", HeadingLevel.HEADING_3));
children.push(H.p("En producción se recomienda sobreescribir la configuración mediante variables de entorno, por ejemplo:"));
children.push(H.codeBlock(`ASPNETCORE_ENVIRONMENT=Production
DatabaseProvider=SqlServer
ConnectionStrings__DefaultConnection=Server=...
Jwt__Secret=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`));

children.push(H.heading("2.4 Arranque del backend", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`cd backend
dotnet restore
dotnet ef database update --project src/ERP.Infrastructure --startup-project src/ERP.API
dotnet run --project src/ERP.API`));
children.push(H.p("Por defecto el API queda disponible en:"));
children.push(H.bullet("HTTP: http://localhost:5000"));
children.push(H.bullet("Swagger UI: http://localhost:5000/swagger"));

children.push(H.heading("2.5 Arranque del frontend", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`cd frontend
npm install
npm run dev`));
children.push(H.p("El frontend se sirve en http://localhost:5173 (Vite dev server) y hace proxy hacia /api."));

children.push(H.heading("2.6 Despliegue con Docker", HeadingLevel.HEADING_2));
children.push(H.p("El archivo docker-compose.yml en la raíz orquesta ambos servicios:"));
children.push(H.codeBlock(`version: '3.8'
services:
  api:
    build:
      context: ./backend
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - DatabaseProvider=Sqlite
      - ConnectionStrings__DefaultConnection=Data Source=/data/erp.db
    volumes:
      - erp-data:/data
  frontend:
    build:
      context: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api
volumes:
  erp-data:`));
children.push(H.spacer());
children.push(H.codeBlock(`docker compose up -d --build`));

children.push(H.pageBreak());

// =================== 3. AUTENTICACIÓN ===================
children.push(H.heading("3. Autenticación y Autorización", HeadingLevel.HEADING_1));
children.push(H.p("Todos los endpoints de la API (excepto POST /api/auth/login) requieren autenticación mediante JWT Bearer Token. Los tokens se obtienen con las credenciales del usuario y luego deben incluirse en el header Authorization de cada solicitud."));

children.push(H.heading("3.1 Flujo de autenticación", HeadingLevel.HEADING_2));
children.push(H.p("El flujo estándar es el siguiente:"));
children.push(H.numbered("El cliente envía email y contraseña a POST /api/auth/login."));
children.push(H.numbered("El servidor valida las credenciales contra la base de datos (contraseñas hasheadas con BCrypt)."));
children.push(H.numbered("Si son correctas, responde con accessToken (JWT), refreshToken, expiresAt y el perfil del usuario."));
children.push(H.numbered("El cliente almacena ambos tokens en memoria o almacenamiento seguro."));
children.push(H.numbered("Cada request subsiguiente debe enviar el accessToken en el header Authorization: Bearer <token>."));
children.push(H.numbered("Cuando el token expira (401 Unauthorized) el cliente llama a POST /api/auth/refresh con el refreshToken para obtener uno nuevo."));
children.push(H.numbered("POST /api/auth/logout invalida la sesión en el servidor."));

children.push(H.heading("3.2 POST /api/auth/login", HeadingLevel.HEADING_2));
children.push(H.p("Solicita un nuevo par de tokens."));
children.push(H.p([{ text: "Request body:", bold: true }]));
children.push(H.codeBlock(`{
  "email": "admin@erp.com",
  "password": "Admin123!"
}`));
children.push(H.p([{ text: "Response 200 OK:", bold: true }]));
children.push(H.codeBlock(`{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresAt": "2026-04-24T14:30:00Z",
  "user": {
    "id": 1,
    "email": "admin@erp.com",
    "firstName": "Administrador",
    "lastName": "Sistema",
    "code": "ADM-001",
    "roles": ["Administrador"],
    "permissions": ["dashboard:read", "sales:read", "sales:write", ...],
    "isSeller": false,
    "zoneId": null,
    "theme": "light"
  }
}`));
children.push(H.p([{ text: "Response 401 Unauthorized:", bold: true }, { text: " credenciales inválidas." }]));

children.push(H.heading("3.3 POST /api/auth/refresh", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}`));
children.push(H.p("Responde con el mismo payload que login. El refresh token anterior queda invalidado (rotación de tokens)."));

children.push(H.heading("3.4 Estructura del JWT", HeadingLevel.HEADING_2));
children.push(H.p("El access token es un JWT firmado con HS256 que contiene los siguientes claims:"));
children.push(H.simpleTable(
  ["Claim", "Descripción"],
  [
    ["sub", "ID del usuario"],
    ["email", "Email del usuario"],
    ["role", "Uno o varios claims de rol (p. ej. Administrador, Vendedor)"],
    ["perm", "Uno o varios claims con permisos en formato 'modulo:accion'"],
    ["isSeller", "Booleano: indica si el usuario es vendedor"],
    ["zoneId", "ID de la zona asignada (opcional, aplica a vendedores)"],
    ["iss", "UmbrellaERP (issuer)"],
    ["aud", "UmbrellaERP (audience)"],
    ["exp", "Timestamp de expiración (por defecto 8 horas desde la emisión)"],
  ],
  [1800, 7560]
));

children.push(H.heading("3.5 Uso del token en requests", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`GET /api/products HTTP/1.1
Host: erp.miempresa.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json`));

children.push(H.heading("3.6 Modelo de permisos", HeadingLevel.HEADING_2));
children.push(H.p("La autorización es doble: autenticación por JWT (el usuario es válido) y autorización por permiso (el usuario puede ejecutar la acción en el módulo)."));
children.push(H.p("Cada endpoint marcado con [RequirePermission(\"modulo\", \"accion\")] exige que el token incluya el claim perm=\"modulo:accion\"."));
children.push(H.p("Los módulos disponibles son:"));
children.push(H.simpleTable(
  ["Módulo", "Acciones", "Descripción"],
  [
    ["dashboard", "read", "Dashboard principal"],
    ["clients", "read, write, delete", "Gestión de clientes"],
    ["suppliers", "read, write, delete", "Gestión de proveedores"],
    ["products", "read, write, delete", "Catálogo de productos"],
    ["pricelists", "read, write, delete", "Listas de precios"],
    ["sales", "read, write, delete", "Facturas de venta"],
    ["purchases", "read, write, delete", "Facturas de compra"],
    ["stock", "read, write, delete", "Inventario y ajustes"],
    ["cash", "read, write, delete", "Sesiones de caja"],
    ["receivables", "read, write, delete", "Cuentas por cobrar"],
    ["payables", "read, write, delete", "Cuentas por pagar"],
    ["reports", "read", "Reportes gerenciales"],
    ["params", "read, write, delete", "Parametrización"],
    ["security", "read, write, delete", "Usuarios y roles"],
  ],
  [1800, 2400, 5160]
));
children.push(H.spacer());
children.push(H.callout("info", "Usuario Administrador",
  "Los usuarios con rol Administrador obtienen automáticamente todos los permisos del sistema. No es necesario asignarlos manualmente."));

children.push(H.pageBreak());

// =================== 4. CONVENCIONES DE LA API ===================
children.push(H.heading("4. Convenciones generales de la API", HeadingLevel.HEADING_1));

children.push(H.heading("4.1 URL base", HeadingLevel.HEADING_2));
children.push(H.p("Todas las rutas descritas en este manual tienen como prefijo la URL base del servidor:"));
children.push(H.codeBlock(`Desarrollo: http://localhost:5000/api
Producción: https://erp.miempresa.com/api`));

children.push(H.heading("4.2 Content-Type y formato", HeadingLevel.HEADING_2));
children.push(H.p("La API acepta y retorna siempre JSON (application/json) salvo en endpoints explícitos de descarga (PDF, Excel) o subida de archivos (multipart/form-data)."));
children.push(H.bullet("Request: Content-Type: application/json para operaciones de lectura/escritura normales."));
children.push(H.bullet("Request: multipart/form-data para uploads de archivos (fotos, documentos)."));
children.push(H.bullet("Response: application/json en casi todos los endpoints."));
children.push(H.bullet("Response: application/pdf para descargas de comprobantes en PDF."));
children.push(H.bullet("Response: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet para descargas Excel."));

children.push(H.heading("4.3 Formato de fechas", HeadingLevel.HEADING_2));
children.push(H.p("Todas las fechas se manejan en formato ISO 8601 UTC:"));
children.push(H.codeBlock(`"2026-04-24T14:30:00Z"           (fecha-hora)
"2026-04-24"                     (fecha simple sin hora)`));

children.push(H.heading("4.4 Paginación", HeadingLevel.HEADING_2));
children.push(H.p("Los endpoints de listado admiten parámetros de consulta estándar:"));
children.push(H.simpleTable(
  ["Parámetro", "Tipo", "Descripción"],
  [
    ["page", "int", "Número de página (empieza en 1). Por defecto 1"],
    ["pageSize", "int", "Registros por página. Por defecto 20, máximo 200"],
    ["search", "string", "Búsqueda libre (nombre, código, email, etc.)"],
    ["sortBy", "string", "Campo por el cual ordenar"],
    ["sortOrder", "string", "asc o desc"],
  ],
  [1800, 1200, 6360]
));
children.push(H.spacer());
children.push(H.p("La respuesta de un listado paginado sigue la estructura:"));
children.push(H.codeBlock(`{
  "items": [ /* array de objetos */ ],
  "totalCount": 345,
  "page": 1,
  "pageSize": 20,
  "totalPages": 18
}`));

children.push(H.heading("4.5 Códigos de estado HTTP", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Código", "Significado"],
  [
    ["200 OK", "Solicitud exitosa con cuerpo de respuesta"],
    ["201 Created", "Recurso creado exitosamente; incluye Location header"],
    ["204 No Content", "Solicitud exitosa sin cuerpo (típico en DELETE y PUT)"],
    ["400 Bad Request", "Error de validación o datos incorrectos"],
    ["401 Unauthorized", "Falta o es inválido el token de autenticación"],
    ["403 Forbidden", "El usuario está autenticado pero no tiene el permiso requerido"],
    ["404 Not Found", "Recurso no encontrado"],
    ["409 Conflict", "Conflicto de estado (duplicado, lock, intento de anular factura ya anulada)"],
    ["422 Unprocessable Entity", "Regla de negocio violada (stock negativo no permitido, etc.)"],
    ["500 Internal Server Error", "Error interno del servidor"],
  ],
  [1800, 7560]
));

children.push(H.heading("4.6 Formato de errores", HeadingLevel.HEADING_2));
children.push(H.p("Los errores se devuelven con la siguiente estructura:"));
children.push(H.codeBlock(`{
  "type": "ValidationError",
  "title": "Uno o más campos contienen errores",
  "status": 400,
  "errors": {
    "Email": ["El formato de email no es válido"],
    "Password": ["La contraseña debe tener al menos 8 caracteres"]
  },
  "traceId": "00-abc123-def456-00"
}`));
children.push(H.spacer());
children.push(H.callout("info", "Trace ID",
  "El campo traceId identifica la solicitud en los logs del servidor. Al reportar un error, incluya este valor para facilitar el diagnóstico."));

children.push(H.pageBreak());

// =================== 5. REFERENCIA DE ENDPOINTS ===================
children.push(H.heading("5. Referencia de endpoints", HeadingLevel.HEADING_1));
children.push(H.p("A continuación se listan todos los endpoints públicos de la API agrupados por módulo. Los campos DTO indicados son los principales; para el esquema completo consulte /swagger."));

// 5.1 AUTH
children.push(H.heading("5.1 Autenticación (/api/auth)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Descripción"],
  [
    ["POST", "/api/auth/login", "Inicio de sesión, devuelve tokens"],
    ["POST", "/api/auth/refresh", "Renovación de access token"],
    ["POST", "/api/auth/logout", "Cerrar sesión (requiere autenticación)"],
    ["GET", "/api/auth/profile", "Perfil del usuario autenticado"],
    ["PUT", "/api/auth/profile", "Actualizar datos del perfil propio"],
    ["POST", "/api/auth/change-password", "Cambio de contraseña del usuario"],
  ],
  [1200, 3000, 5160]
));

// 5.2 PRODUCTS
children.push(H.heading("5.2 Productos (/api/products)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/products", "products:read"],
    ["GET", "/api/products/search?term=", "products:read"],
    ["GET", "/api/products/{id}", "products:read"],
    ["POST", "/api/products", "products:write"],
    ["PUT", "/api/products/{id}", "products:write"],
    ["DELETE", "/api/products/{id}", "products:delete"],
    ["POST", "/api/products/{id}/restore", "products:write"],
    ["GET", "/api/products/{id}/photos", "products:read"],
    ["POST", "/api/products/{id}/photos", "products:write"],
    ["DELETE", "/api/products/{id}/photos/{photoId}", "products:write"],
    ["POST", "/api/products/{id}/photos/{photoId}/default", "products:write"],
    ["GET", "/api/products/{id}/documents", "products:read"],
    ["POST", "/api/products/{id}/documents", "products:write"],
    ["DELETE", "/api/products/{id}/documents/{docId}", "products:write"],
  ],
  [1200, 5400, 2760]
));
children.push(H.spacer());
children.push(H.p([{ text: "CreateProductDto:", bold: true }]));
children.push(H.codeBlock(`{
  "code": "P-0001",
  "name": "Taladro percutor 800W",
  "description": "Taladro eléctrico con percusión",
  "barcode": "7790000123456",
  "brand": "Bosch",
  "model": "GSB-20-RE",
  "unit": "UN",
  "trackStock": true,
  "minimumStock": 5,
  "categoryId": 2
}`));

// 5.3 SUPPLIERS
children.push(H.heading("5.3 Proveedores (/api/suppliers)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/suppliers", "suppliers:read"],
    ["GET", "/api/suppliers/search?term=", "suppliers:read"],
    ["GET", "/api/suppliers/{id}", "suppliers:read"],
    ["POST", "/api/suppliers", "suppliers:write"],
    ["PUT", "/api/suppliers/{id}", "suppliers:write"],
    ["DELETE", "/api/suppliers/{id}", "suppliers:delete"],
    ["POST", "/api/suppliers/{id}/restore", "suppliers:write"],
    ["GET", "/api/suppliers/{id}/account", "suppliers:read"],
    ["GET", "/api/suppliers/{id}/account/excel", "suppliers:read"],
    ["GET", "/api/suppliers/{id}/account/pdf", "suppliers:read"],
  ],
  [1200, 5400, 2760]
));

// 5.4 CLIENTS
children.push(H.heading("5.4 Clientes (/api/clients)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/clients", "clients:read"],
    ["GET", "/api/clients/search?term=", "clients:read"],
    ["GET", "/api/clients/{id}", "clients:read"],
    ["POST", "/api/clients", "clients:write"],
    ["PUT", "/api/clients/{id}", "clients:write"],
    ["DELETE", "/api/clients/{id}", "clients:delete"],
    ["POST", "/api/clients/{id}/restore", "clients:write"],
    ["GET", "/api/clients/{id}/account", "clients:read"],
    ["GET", "/api/clients/{id}/account/excel", "clients:read"],
    ["GET", "/api/clients/{id}/account/pdf", "clients:read"],
    ["GET", "/api/clients/{id}/documents", "clients:read"],
    ["POST", "/api/clients/{id}/documents", "clients:write"],
    ["DELETE", "/api/clients/{id}/documents/{docId}", "clients:write"],
  ],
  [1200, 5400, 2760]
));
children.push(H.spacer());
children.push(H.p([{ text: "CreateClientDto (principales campos):", bold: true }]));
children.push(H.codeBlock(`{
  "code": "C-0001",
  "name": "Acme S.A.",
  "documentType": "CUIT",
  "documentNumber": "30-12345678-9",
  "email": "contacto@acme.com",
  "phone": "+54 11 4000-0000",
  "address": "Av. Siempreviva 742",
  "city": "Buenos Aires",
  "clientTypeId": 1,
  "zoneId": 2,
  "defaultPriceListId": 1,
  "vatConditionId": 1,
  "isActive": true
}`));

// 5.5 SALES INVOICES
children.push(H.heading("5.5 Facturas de Venta (/api/sales-invoices)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/sales-invoices", "sales:read"],
    ["GET", "/api/sales-invoices/{id}", "sales:read"],
    ["GET", "/api/sales-invoices/{id}/pdf", "sales:read"],
    ["POST", "/api/sales-invoices", "sales:write"],
    ["PUT", "/api/sales-invoices/{id}", "sales:write"],
    ["POST", "/api/sales-invoices/{id}/confirm", "sales:write"],
    ["POST", "/api/sales-invoices/{id}/cancel", "sales:delete"],
    ["DELETE", "/api/sales-invoices/{id}", "sales:delete"],
    ["GET", "/api/sales-invoices/{id}/payments", "sales:read"],
    ["POST", "/api/sales-invoices/{id}/payments", "sales:write"],
    ["DELETE", "/api/sales-invoices/{id}/payments/{pid}", "sales:delete"],
    ["GET", "/api/sales-invoices/{id}/installment-plan", "sales:read"],
    ["POST", "/api/sales-invoices/{id}/installment-plan", "sales:write"],
    ["DELETE", "/api/sales-invoices/{id}/installment-plan", "sales:delete"],
    ["POST", ".../installments/{iid}/pay", "sales:write"],
  ],
  [1000, 5600, 2760]
));
children.push(H.spacer());
children.push(H.p([{ text: "CreateSalesInvoiceDto:", bold: true }]));
children.push(H.codeBlock(`{
  "invoiceTypeId": 2,
  "invoiceDate": "2026-04-24",
  "clientId": 15,
  "sellerId": 3,
  "priceListId": 1,
  "paymentConditionId": 1,
  "stockLocationId": 1,
  "notes": "Entrega en recepción",
  "items": [
    {
      "productId": 101,
      "stockLocationId": 1,
      "quantity": 2,
      "unitPrice": 12500.00,
      "discountPercentage": 10,
      "vatRate": 21,
      "sortOrder": 1
    }
  ]
}`));
children.push(H.p([{ text: "SalesInvoiceDetailDto (respuesta):", bold: true }]));
children.push(H.codeBlock(`{
  "id": 501,
  "number": "B-0001-00000123",
  "status": "Draft",
  "invoiceDate": "2026-04-24",
  "client": { "id": 15, "name": "Acme S.A." },
  "seller": { "id": 3, "firstName": "Juan", "lastName": "Perez" },
  "subtotal": 25000.00,
  "discountAmount": 2500.00,
  "taxableBase": 22500.00,
  "vatAmount": 4725.00,
  "total": 27225.00,
  "paidAmount": 0,
  "balanceDue": 27225.00,
  "items": [ /* ... */ ],
  "payments": [],
  "installmentPlan": null
}`));

children.push(H.heading("Flujo de estados", HeadingLevel.HEADING_3));
children.push(H.codeBlock(`Draft
  └─ POST /confirm ─▶ Confirmed
                        └─ POST /cancel ─▶ Cancelled`));

// 5.6 PURCHASE INVOICES
children.push(H.heading("5.6 Facturas de Compra (/api/purchase-invoices)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/purchase-invoices", "purchases:read"],
    ["GET", "/api/purchase-invoices/{id}", "purchases:read"],
    ["GET", "/api/purchase-invoices/{id}/pdf", "purchases:read"],
    ["POST", "/api/purchase-invoices", "purchases:write"],
    ["PUT", "/api/purchase-invoices/{id}", "purchases:write"],
    ["POST", "/api/purchase-invoices/{id}/confirm", "purchases:write"],
    ["POST", "/api/purchase-invoices/{id}/cancel", "purchases:delete"],
    ["DELETE", "/api/purchase-invoices/{id}", "purchases:delete"],
    ["GET", "/api/purchase-invoices/{id}/payments", "purchases:read"],
    ["POST", "/api/purchase-invoices/{id}/payments", "purchases:write"],
    ["DELETE", "/api/purchase-invoices/{id}/payments/{pid}", "purchases:delete"],
  ],
  [1000, 5600, 2760]
));

// 5.7 STOCK
children.push(H.heading("5.7 Stock (/api/stock)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/stock?locationId=&categoryId=", "stock:read"],
    ["GET", "/api/stock/products/{productId}", "stock:read"],
    ["GET", "/api/stock/movements", "stock:read"],
    ["GET", "/api/stock/adjustments", "stock:read"],
    ["POST", "/api/stock/adjustments", "stock:write"],
    ["POST", "/api/stock/adjustments/{id}/confirm", "stock:write"],
    ["GET", "/api/stock/locations", "autenticado"],
    ["POST", "/api/stock/locations", "params:write"],
    ["PUT", "/api/stock/locations/{id}", "params:write"],
    ["DELETE", "/api/stock/locations/{id}", "params:delete"],
  ],
  [1000, 5600, 2760]
));

// 5.8 CASH
children.push(H.heading("5.8 Caja (/api/cash)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/cash/current", "cash:read"],
    ["GET", "/api/cash/sessions?from=&to=", "cash:read"],
    ["GET", "/api/cash/sessions/{id}", "cash:read"],
    ["POST", "/api/cash/sessions/open", "cash:write"],
    ["POST", "/api/cash/sessions/{id}/close", "cash:write"],
    ["POST", "/api/cash/sessions/{id}/movements", "cash:write"],
    ["DELETE", "/api/cash/movements/{id}", "cash:delete"],
  ],
  [1000, 5600, 2760]
));

// 5.9 PRICE LISTS
children.push(H.heading("5.9 Listas de precios (/api/price-lists)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/price-lists", "pricelists:read"],
    ["GET", "/api/price-lists/{id}", "pricelists:read"],
    ["POST", "/api/price-lists", "pricelists:write"],
    ["PUT", "/api/price-lists/{id}", "pricelists:write"],
    ["DELETE", "/api/price-lists/{id}", "pricelists:delete"],
    ["PUT", "/api/price-lists/{id}/items", "pricelists:write"],
    ["DELETE", "/api/price-lists/{id}/items/{productId}", "pricelists:delete"],
    ["POST", "/api/price-lists/{id}/bulk-update", "pricelists:write"],
    ["POST", "/api/price-lists/{id}/recalculate", "pricelists:write"],
  ],
  [1000, 5600, 2760]
));
children.push(H.spacer());
children.push(H.p([{ text: "BulkUpdate request:", bold: true }]));
children.push(H.codeBlock(`{
  "operation": "Increase",            // Increase | Decrease | Set
  "valueType": "Percentage",          // Percentage | Amount
  "value": 12.5,
  "categoryIds": [2, 5],              // opcional
  "roundTo": 0.10                     // opcional
}`));

// 5.10 REPORTS
children.push(H.heading("5.10 Reportes (/api/reports)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/reports/dashboard-summary", "autenticado"],
    ["GET", "/api/reports/sales-by-period", "reports:read"],
    ["GET", "/api/reports/sales-by-seller", "reports:read"],
    ["GET", "/api/reports/sales-by-client", "reports:read"],
    ["GET", "/api/reports/detailed-sales?zoneId=", "reports:read"],
    ["GET", "/api/reports/stock", "reports:read"],
    ["GET", "/api/reports/payments", "reports:read"],
    ["GET", "/api/reports/cash", "reports:read"],
    ["GET", "/api/reports/receivables", "receivables:read"],
    ["GET", "/api/reports/payables", "payables:read"],
    ["GET", "/api/reports/overdue-installments", "receivables:read"],
    ["GET", "/api/reports/daily-collections?zoneId=&date=", "receivables:read"],
    ["GET", "/api/reports/{reportType}/excel", "reports:read"],
    ["GET", "/api/reports/{reportType}/pdf", "reports:read"],
  ],
  [1000, 5600, 2760]
));

// 5.11 USERS / ROLES
children.push(H.heading("5.11 Seguridad (/api/users, /api/roles)", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Método", "Ruta", "Permiso"],
  [
    ["GET", "/api/users", "security:read"],
    ["GET", "/api/users/{id}", "security:read"],
    ["POST", "/api/users", "security:write"],
    ["PUT", "/api/users/{id}", "security:write"],
    ["POST", "/api/users/{id}/reset-password", "security:write"],
    ["DELETE", "/api/users/{id}", "security:delete"],
    ["POST", "/api/users/{id}/restore", "security:write"],
    ["GET", "/api/users/sellers?term=", "autenticado"],
    ["GET", "/api/roles", "security:read"],
    ["GET", "/api/roles/permissions", "security:read"],
    ["GET", "/api/roles/{id}", "security:read"],
    ["POST", "/api/roles", "security:write"],
    ["PUT", "/api/roles/{id}", "security:write"],
    ["DELETE", "/api/roles/{id}", "security:delete"],
  ],
  [1000, 5600, 2760]
));

// 5.12 PARAMS
children.push(H.heading("5.12 Parametrización (/api/params)", HeadingLevel.HEADING_2));
children.push(H.p("Agrupa la administración de catálogos maestros. Todos los GET requieren sólo autenticación; los POST/PUT/DELETE requieren params:write o params:delete."));
children.push(H.simpleTable(
  ["Ruta base", "Gestiona"],
  [
    ["/api/params/client-types", "Tipos de cliente"],
    ["/api/params/zones", "Zonas comerciales"],
    ["/api/params/invoice-types", "Tipos de comprobante"],
    ["/api/params/vat-conditions", "Condiciones de IVA"],
    ["/api/params/payment-conditions", "Condiciones de pago"],
    ["/api/params/categories", "Categorías de productos"],
    ["/api/params/system-config", "Configuración global (GET y PUT únicamente)"],
    ["/api/payment-methods", "Métodos de pago"],
  ],
  [3200, 6160]
));

children.push(H.pageBreak());

// =================== 6. EJEMPLOS DE INTEGRACIÓN ===================
children.push(H.heading("6. Ejemplos de integración", HeadingLevel.HEADING_1));
children.push(H.p("Esta sección presenta ejemplos completos en varios lenguajes para realizar las operaciones más comunes."));

children.push(H.heading("6.1 cURL", HeadingLevel.HEADING_2));
children.push(H.p([{ text: "Login:", bold: true }]));
children.push(H.codeBlock(`curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@erp.com","password":"Admin123!"}'`));
children.push(H.spacer());
children.push(H.p([{ text: "Listar productos usando el token:", bold: true }]));
children.push(H.codeBlock(`TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl http://localhost:5000/api/products?page=1&pageSize=50 \\
  -H "Authorization: Bearer $TOKEN"`));
children.push(H.spacer());
children.push(H.p([{ text: "Crear un cliente:", bold: true }]));
children.push(H.codeBlock(`curl -X POST http://localhost:5000/api/clients \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code":"C-0100",
    "name":"Nuevo Cliente SRL",
    "documentType":"CUIT",
    "documentNumber":"30-99999999-9",
    "email":"info@cliente.com",
    "clientTypeId":1,
    "vatConditionId":1,
    "isActive":true
  }'`));

children.push(H.heading("6.2 JavaScript / TypeScript (fetch)", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`const BASE_URL = "http://localhost:5000/api";

// 1. Login
async function login(email, password) {
  const res = await fetch(\`\${BASE_URL}/auth/login\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return res.json();
}

// 2. Wrapper con token
async function apiCall(path, options = {}, token) {
  const res = await fetch(\`\${BASE_URL}\${path}\`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${token}\`,
      ...options.headers,
    },
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// 3. Uso
(async () => {
  const { accessToken } = await login("admin@erp.com", "Admin123!");
  const products = await apiCall("/products?pageSize=10", {}, accessToken);
  console.log(\`Total: \${products.totalCount}\`);
})();`));

children.push(H.heading("6.3 Cliente Axios con refresh automático", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api" });
let accessToken = null;
let refreshToken = null;

api.interceptors.request.use(cfg => {
  if (accessToken) cfg.headers.Authorization = \`Bearer \${accessToken}\`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async error => {
    if (error.response?.status === 401 && refreshToken) {
      const { data } = await axios.post(
        "http://localhost:5000/api/auth/refresh",
        { refreshToken }
      );
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      error.config.headers.Authorization = \`Bearer \${accessToken}\`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

export async function signIn(email, password) {
  const { data } = await axios.post(
    "http://localhost:5000/api/auth/login",
    { email, password }
  );
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  return data.user;
}

export default api;`));

children.push(H.heading("6.4 C# (HttpClient)", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`using System.Net.Http.Headers;
using System.Net.Http.Json;

var http = new HttpClient { BaseAddress = new Uri("http://localhost:5000/api/") };

// Login
var loginResp = await http.PostAsJsonAsync("auth/login", new {
    email = "admin@erp.com",
    password = "Admin123!"
});
loginResp.EnsureSuccessStatusCode();
var login = await loginResp.Content.ReadFromJsonAsync<LoginResponse>();

http.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", login.AccessToken);

// Listar productos
var products = await http.GetFromJsonAsync<PagedResult<ProductDto>>("products?pageSize=50");
Console.WriteLine($"Productos: {products.TotalCount}");

// Crear una factura
var invoice = new {
    invoiceTypeId = 2,
    invoiceDate = DateTime.UtcNow.Date,
    clientId = 15,
    sellerId = 3,
    priceListId = 1,
    paymentConditionId = 1,
    stockLocationId = 1,
    items = new[] {
        new { productId = 101, stockLocationId = 1,
              quantity = 2, unitPrice = 12500m,
              discountPercentage = 0m, vatRate = 21m, sortOrder = 1 }
    }
};
var invResp = await http.PostAsJsonAsync("sales-invoices", invoice);
var created = await invResp.Content.ReadFromJsonAsync<SalesInvoiceDetailDto>();

// Confirmar
await http.PostAsync($"sales-invoices/{created.Id}/confirm", null);`));

children.push(H.heading("6.5 Python (requests)", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`import requests

BASE = "http://localhost:5000/api"

# Login
login = requests.post(f"{BASE}/auth/login", json={
    "email": "admin@erp.com",
    "password": "Admin123!"
}).json()

headers = {"Authorization": f"Bearer {login['accessToken']}"}

# Listar clientes
clients = requests.get(f"{BASE}/clients", params={
    "page": 1, "pageSize": 100, "search": "acme"
}, headers=headers).json()
print(f"Clientes encontrados: {clients['totalCount']}")

# Registrar pago en factura 501
requests.post(f"{BASE}/sales-invoices/501/payments", json={
    "paymentMethodId": 1,
    "amount": 27225.00,
    "paymentDate": "2026-04-24",
    "reference": "TRF-0012345",
    "notes": "Pago total"
}, headers=headers).raise_for_status()`));

children.push(H.heading("6.6 Subida de archivos (multipart)", HeadingLevel.HEADING_2));
children.push(H.p("Los endpoints de uploads esperan multipart/form-data con el archivo en el campo file:"));
children.push(H.codeBlock(`# cURL
curl -X POST http://localhost:5000/api/products/101/photos \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@./taladro-001.jpg" \\
  -F "isDefault=true"`));
children.push(H.codeBlock(`// JavaScript (browser)
const form = new FormData();
form.append("file", fileInput.files[0]);
form.append("description", "Foto principal");

await fetch(\`\${BASE_URL}/products/\${productId}/photos\`, {
  method: "POST",
  headers: { "Authorization": \`Bearer \${token}\` },  // NO Content-Type
  body: form
});`));
children.push(H.callout("warning", "Restricciones de archivos",
  "Fotos de producto: JPG, PNG, WEBP, GIF hasta 10 MB. Documentos: PDF, Office (DOC, DOCX, XLS, XLSX), imágenes hasta 10 MB."));

children.push(H.heading("6.7 Descarga de PDF o Excel", HeadingLevel.HEADING_2));
children.push(H.codeBlock(`// JavaScript: descargar factura en PDF
const res = await fetch(\`\${BASE_URL}/sales-invoices/\${id}/pdf\`, {
  headers: { "Authorization": \`Bearer \${token}\` }
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = \`factura-\${id}.pdf\`;
a.click();`));

children.push(H.pageBreak());

// =================== 7. CASOS DE USO ===================
children.push(H.heading("7. Casos de uso típicos", HeadingLevel.HEADING_1));

children.push(H.heading("7.1 Sincronización de productos desde un e-commerce", HeadingLevel.HEADING_2));
children.push(H.p("Ejemplo: integrar Umbrella ERP con una tienda en línea. El e-commerce expone un catálogo; Umbrella necesita mantener actualizado el stock y recibir los pedidos como facturas."));
children.push(H.numbered("Al iniciar la sincronización, autenticar en la API (login) y guardar el token."));
children.push(H.numbered("Listar productos modificados desde la última sincronización usando GET /api/products."));
children.push(H.numbered("Por cada pedido del e-commerce, crear un cliente si no existe (GET /api/clients/search, fallback a POST /api/clients)."));
children.push(H.numbered("Crear la factura de venta con los productos del pedido (POST /api/sales-invoices)."));
children.push(H.numbered("Confirmar la factura (POST /{id}/confirm) para descontar stock."));
children.push(H.numbered("Si el pago se capturó en el e-commerce, registrar el cobro (POST /{id}/payments)."));
children.push(H.numbered("Descargar el PDF (GET /{id}/pdf) y enviar por email al comprador."));

children.push(H.heading("7.2 Integración con sistema contable", HeadingLevel.HEADING_2));
children.push(H.p("Exportar los movimientos a un sistema externo de contabilidad (ej. Tango, Bejerman, Xubio)."));
children.push(H.numbered("Llamar GET /api/reports/sales-by-period filtrando por el período contable."));
children.push(H.numbered("Para cada factura, obtener su detalle con GET /api/sales-invoices/{id}."));
children.push(H.numbered("Mapear los campos a la estructura contable (asiento de ingreso, IVA débito, cuentas a cobrar)."));
children.push(H.numbered("Repetir para /api/reports/payments y /api/reports/cash."));

children.push(H.heading("7.3 App móvil para vendedores", HeadingLevel.HEADING_2));
children.push(H.p("Desarrollar una aplicación móvil para que los vendedores en campo consulten stock, generen facturas y registren cobros."));
children.push(H.numbered("Login inicial contra /api/auth/login. Guardar refresh token de forma segura (Keychain/Keystore)."));
children.push(H.numbered("Al navegar, usar el accessToken; renovar con /auth/refresh cuando sea 401."));
children.push(H.numbered("Cargar el listado de clientes propios con GET /api/clients (el servidor filtra automáticamente por zoneId del vendedor)."));
children.push(H.numbered("Al crear pedidos offline, encolar localmente y sincronizar al recuperar conexión."));
children.push(H.numbered("Usar GET /api/reports/daily-collections para que el vendedor rinda caja al final del día."));

children.push(H.heading("7.4 Webhook de notificaciones (patrón polling)", HeadingLevel.HEADING_2));
children.push(H.callout("info", "Versión actual sin webhooks nativos",
  "La versión 1.0 de la API no expone webhooks salientes. Para integraciones que requieran notificaciones en tiempo real, se recomienda el patrón polling: consultar periódicamente los endpoints relevantes filtrando por fecha de modificación."));
children.push(H.p("Estrategia recomendada:"));
children.push(H.bullet("Mantener un timestamp lastSyncAt persistido en el integrador."));
children.push(H.bullet("Ejecutar cada N minutos (ej. cada 5) un GET con filtro modifiedSince=lastSyncAt."));
children.push(H.bullet("Procesar los cambios y actualizar lastSyncAt al máximo timestamp recibido."));

children.push(H.pageBreak());

// =================== 8. SEGURIDAD ===================
children.push(H.heading("8. Seguridad y buenas prácticas", HeadingLevel.HEADING_1));

children.push(H.heading("8.1 Transporte seguro (HTTPS)", HeadingLevel.HEADING_2));
children.push(H.p("En producción, exponga la API detrás de un proxy inverso (Nginx, Traefik, IIS, Azure Front Door) con certificado TLS válido. Nunca envíe JWT sobre HTTP plano."));

children.push(H.heading("8.2 Almacenamiento seguro de tokens", HeadingLevel.HEADING_2));
children.push(H.bullet("Navegadores: almacenar tokens en memoria (Zustand, Redux) o en cookies HttpOnly+Secure. Evitar localStorage por vulnerabilidad a XSS."));
children.push(H.bullet("Aplicaciones móviles: Android Keystore, iOS Keychain."));
children.push(H.bullet("Servicios backend: bóvedas de secretos (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault) o variables de entorno protegidas."));

children.push(H.heading("8.3 Gestión de credenciales de integración", HeadingLevel.HEADING_2));
children.push(H.p("Para sistemas automatizados (integraciones) cree un usuario dedicado con rol específico que tenga sólo los permisos necesarios. Evite reutilizar el usuario administrador."));
children.push(H.callout("tip", "Principio del mínimo privilegio",
  "Otorgue a cada integración únicamente los permisos imprescindibles. Por ejemplo, un integrador de e-commerce sólo necesita products:read, stock:read, clients:read+write, sales:read+write."));

children.push(H.heading("8.4 Rate limiting y throttling", HeadingLevel.HEADING_2));
children.push(H.p("Si su caso de uso puede generar ráfagas de solicitudes, se recomienda implementar rate limiting a nivel de proxy inverso. La API incorpora logging estructurado para identificar patrones anómalos."));

children.push(H.heading("8.5 CORS", HeadingLevel.HEADING_2));
children.push(H.p("En desarrollo la API acepta cualquier origen. En producción debe restringir el CORS desde Program.cs especificando los dominios permitidos:"));
children.push(H.codeBlock(`builder.Services.AddCors(o => o.AddPolicy("prod", p => p
    .WithOrigins("https://app.miempresa.com",
                 "https://admin.miempresa.com")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));`));

children.push(H.heading("8.6 Auditoría", HeadingLevel.HEADING_2));
children.push(H.p("Todas las entidades principales incluyen campos de auditoría automáticos: CreatedAt, CreatedBy, ModifiedAt, ModifiedBy, DeletedAt, DeletedBy e IsDeleted. El borrado es lógico por defecto."));
children.push(H.p("Los logs del servidor se escriben en logs/erp-.log con rotación diaria. Cada request incluye el traceId para correlación."));

children.push(H.pageBreak());

// =================== 9. BASE DE DATOS ===================
children.push(H.heading("9. Modelo de base de datos", HeadingLevel.HEADING_1));
children.push(H.p("Umbrella ERP usa EF Core Code-First. Las migraciones se encuentran en backend/src/ERP.Infrastructure/Migrations/. Para aplicar cambios de esquema:"));
children.push(H.codeBlock(`cd backend
dotnet ef migrations add NombreDeLaMigracion \\
  --project src/ERP.Infrastructure \\
  --startup-project src/ERP.API

dotnet ef database update \\
  --project src/ERP.Infrastructure \\
  --startup-project src/ERP.API`));

children.push(H.heading("9.1 Principales entidades", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Entidad", "Descripción"],
  [
    ["User", "Usuarios del sistema (email, hash de contraseña, perfil)"],
    ["Role / Permission / RolePermission", "Sistema RBAC de roles y permisos"],
    ["Product / Category / ProductPhoto / ProductDocument", "Catálogo y archivos"],
    ["Supplier / SupplierDocument", "Proveedores"],
    ["Client / ClientDocument / ClientType / Zone", "Clientes y segmentación"],
    ["PriceList / PriceListItem", "Listas de precios"],
    ["SalesInvoice / SalesInvoiceItem / SalesPayment", "Ciclo de ventas"],
    ["SalesInstallmentPlan / SalesInstallment", "Planes de pago en cuotas"],
    ["PurchaseInvoice / PurchaseInvoiceItem / PurchasePayment", "Ciclo de compras"],
    ["StockLocation / StockEntry / StockMovement", "Inventario multi-depósito"],
    ["StockAdjustment / StockAdjustmentItem", "Ajustes de inventario"],
    ["CashSession / CashMovement", "Gestión de caja"],
    ["InvoiceType / VatCondition / PaymentCondition / PaymentMethod", "Parámetros tributarios y comerciales"],
    ["SystemConfig", "Configuración global de la empresa"],
  ],
  [3600, 5760]
));

children.push(H.heading("9.2 Borrado lógico", HeadingLevel.HEADING_2));
children.push(H.p("Las entidades principales implementan la interfaz de soft delete. Al eliminar, se setean los campos IsDeleted=true, DeletedAt y DeletedBy. Los filtros globales de EF excluyen automáticamente los registros borrados."));

children.push(H.heading("9.3 Respaldo y restauración", HeadingLevel.HEADING_2));
children.push(H.p([{ text: "SQLite: ", bold: true }, { text: "simplemente copiar el archivo erp.db (por defecto). Se recomienda detener la API durante el copiado o usar el comando .backup de sqlite3." }]));
children.push(H.codeBlock(`sqlite3 erp.db ".backup erp-backup-2026-04-24.db"`));
children.push(H.p([{ text: "SQL Server: ", bold: true }, { text: "usar BACKUP DATABASE desde SSMS o mediante un job de SQL Agent." }]));

children.push(H.pageBreak());

// =================== 10. SWAGGER ===================
children.push(H.heading("10. Documentación interactiva (Swagger)", HeadingLevel.HEADING_1));
children.push(H.p("La API expone la especificación OpenAPI 3.0 y una interfaz Swagger UI navegable:"));
children.push(H.bullet("Swagger UI: http://localhost:5000/swagger"));
children.push(H.bullet("Especificación JSON: http://localhost:5000/swagger/v1/swagger.json"));
children.push(H.spacer());
children.push(H.p("Desde Swagger UI puede:"));
children.push(H.bullet("Consultar todos los endpoints con sus esquemas de request y response completos."));
children.push(H.bullet("Probar llamadas en vivo con el botón Try it out."));
children.push(H.bullet("Autenticarse una sola vez con Authorize e incluir el token Bearer en todas las pruebas."));
children.push(H.bullet("Generar clientes automáticos en C#, TypeScript, Java, Python y otros lenguajes usando generadores OpenAPI."));
children.push(H.spacer());
children.push(H.callout("tip", "Generar SDK cliente",
  "Con la especificación swagger.json puede generar un SDK tipado en el lenguaje de su preferencia usando herramientas como openapi-generator-cli, NSwag o Swagger Codegen."));

children.push(H.pageBreak());

// =================== 11. TROUBLESHOOTING ===================
children.push(H.heading("11. Troubleshooting", HeadingLevel.HEADING_1));

children.push(H.heading("11.1 Problemas frecuentes", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Síntoma", "Causa probable", "Solución"],
  [
    ["401 Unauthorized", "Token expirado o inválido", "Usar /api/auth/refresh o volver a /login"],
    ["403 Forbidden", "Falta permiso en el rol del usuario", "Asignar permiso correspondiente al rol"],
    ["400 ValidationError en POST/PUT", "Campos requeridos faltantes o tipos inválidos", "Revisar la propiedad errors del response"],
    ["422 stock negativo", "La configuración no permite stock negativo", "Ajustar stock previamente o modificar allowNegativeStock"],
    ["409 Conflict al confirmar", "Factura ya confirmada o anulada", "Recargar el detalle y validar estado actual"],
    ["CORS error en navegador", "Origen no permitido en prod", "Agregar dominio en policy de CORS"],
    ["500 Internal Server Error", "Excepción no controlada", "Revisar logs/erp-<fecha>.log y reportar el traceId"],
    ["EF Core migration conflict", "Modelos no alineados con BD", "Aplicar migraciones pendientes con dotnet ef database update"],
  ],
  [2000, 3500, 3860]
));

children.push(H.heading("11.2 Logs del servidor", HeadingLevel.HEADING_2));
children.push(H.p("Los logs se escriben en la carpeta logs/ del backend con rotación diaria. El nivel por defecto es Information. Para aumentar el detalle temporalmente modifique appsettings.json:"));
children.push(H.codeBlock(`{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}`));

children.push(H.heading("11.3 Validación de tokens manualmente", HeadingLevel.HEADING_2));
children.push(H.p("Puede decodificar un JWT en jwt.io para inspeccionar sus claims, o con línea de comando:"));
children.push(H.codeBlock(`# Decodificar payload (segunda parte del token)
echo "eyJ..." | cut -d '.' -f2 | base64 -d | jq .`));

children.push(H.pageBreak());

// =================== 12. VERSIONADO ===================
children.push(H.heading("12. Versionado y compatibilidad", HeadingLevel.HEADING_1));
children.push(H.p("La versión actual de la API es 1.0. Las siguientes políticas aplican a futuras versiones:"));
children.push(H.bullet("Los cambios compatibles hacia atrás (adición de endpoints, nuevos campos opcionales) no modifican el número de versión."));
children.push(H.bullet("Los cambios incompatibles (eliminación de campos, cambios de significado, renombrados) incrementan la versión mayor."));
children.push(H.bullet("Cuando se publique la versión 2.0, la versión 1.0 se mantendrá operativa por un período de migración de al menos 6 meses."));
children.push(H.bullet("El versionado se expone en la ruta: /api/v1/..., /api/v2/... (a partir de la v2)."));

children.push(H.pageBreak());

// =================== 13. GLOSARIO TÉCNICO ===================
children.push(H.heading("13. Glosario técnico", HeadingLevel.HEADING_1));
children.push(H.simpleTable(
  ["Término", "Definición"],
  [
    ["API REST", "Estilo arquitectónico de comunicación basado en recursos HTTP (GET, POST, PUT, DELETE)"],
    ["JWT", "JSON Web Token - formato compacto y autocontenido para transmitir información firmada"],
    ["Bearer Token", "Esquema de autenticación donde el poseedor del token es autorizado"],
    ["CORS", "Cross-Origin Resource Sharing - mecanismo del navegador para permitir peticiones entre dominios"],
    ["OpenAPI / Swagger", "Especificación estándar para describir APIs REST"],
    ["CRUD", "Create, Read, Update, Delete - operaciones básicas sobre recursos"],
    ["DTO", "Data Transfer Object - objeto diseñado para transmitir datos entre capas"],
    ["RBAC", "Role-Based Access Control - control de acceso basado en roles"],
    ["EF Core", "Entity Framework Core - ORM de .NET"],
    ["Code-First", "Enfoque de EF donde el modelo se define en código y la BD se genera"],
    ["Soft Delete", "Borrado lógico - marca como eliminado sin borrar físicamente"],
    ["HTTP Idempotente", "Una operación cuyo resultado es el mismo independientemente del número de ejecuciones"],
    ["Paginación", "División de un conjunto grande de datos en páginas manejables"],
    ["Rate limiting", "Restricción del número de requests por unidad de tiempo"],
  ],
  [2400, 6960]
));

children.push(H.pageBreak());

// =================== 14. APÉNDICE ===================
children.push(H.heading("14. Apéndice: Datos semilla (seed)", HeadingLevel.HEADING_1));
children.push(H.p("Al iniciarse por primera vez, el sistema carga un conjunto de datos mínimos:"));

children.push(H.heading("Usuarios", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Email", "Contraseña", "Rol"],
  [["admin@erp.com", "Admin123!", "Administrador"]],
  [3600, 2400, 3360]
));

children.push(H.heading("Roles", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Código", "Nombre", "Es vendedor"],
  [
    ["ADM", "Administrador", "No"],
    ["VND", "Vendedor", "Sí"],
    ["FIN", "Finanzas", "No"],
  ],
  [1800, 4200, 3360]
));

children.push(H.heading("Condiciones de IVA", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Código", "Descripción", "Alícuota"],
  [
    ["RI", "Responsable Inscripto", "21 %"],
    ["MO", "Monotributista", "0 %"],
    ["EX", "Exento", "0 %"],
    ["CF", "Consumidor Final", "21 %"],
  ],
  [1800, 4800, 2760]
));

children.push(H.heading("Condiciones de pago", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Código", "Descripción", "Plazo"],
  [
    ["CONT", "Contado", "0 días"],
    ["30D", "30 días", "30 días"],
    ["60D", "60 días", "60 días"],
    ["90D", "90 días", "90 días"],
  ],
  [1800, 4800, 2760]
));

children.push(H.heading("Métodos de pago", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Código", "Nombre", "Afecta caja"],
  [
    ["EFE", "Efectivo", "Sí"],
    ["TRF", "Transferencia", "No"],
    ["TDB", "Tarjeta de Débito", "No"],
    ["TCR", "Tarjeta de Crédito", "No"],
    ["CHQ", "Cheque", "No"],
  ],
  [1500, 5100, 2760]
));

children.push(H.heading("Tipos de comprobante (AR)", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Código", "Descripción", "Ámbito"],
  [
    ["A", "Factura A", "Venta entre Responsables Inscriptos"],
    ["B", "Factura B", "Venta a Consumidor Final o Monotributo"],
    ["C", "Factura C", "Emitida por Monotributista"],
    ["X", "Documento interno", "Sin efecto fiscal"],
    ["NC-A", "Nota de Crédito A", "Ajuste de Factura A"],
    ["NC-B", "Nota de Crédito B", "Ajuste de Factura B"],
  ],
  [1500, 3800, 4060]
));

children.push(H.heading("Locaciones de stock", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Código", "Nombre", "Tipo"],
  [["DEP01", "Depósito Central", "Depósito"]],
  [1500, 4500, 3360]
));

children.push(H.pageBreak());

// =================== 15. CONTACTO ===================
children.push(H.heading("15. Soporte y contacto técnico", HeadingLevel.HEADING_1));
children.push(H.p("Para consultas técnicas, reportes de incidencias o solicitudes de nuevas funcionalidades sobre la API, contacte al equipo de desarrollo de su organización."));
children.push(H.p("Al reportar una incidencia, incluya:"));
children.push(H.bullet("Endpoint invocado (método y ruta completa)."));
children.push(H.bullet("Request body enviado (ofuscando datos sensibles)."));
children.push(H.bullet("Response recibido (código HTTP y cuerpo)."));
children.push(H.bullet("traceId extraído del response de error."));
children.push(H.bullet("Timestamp aproximado en UTC."));
children.push(H.bullet("Descripción del comportamiento esperado vs. obtenido."));
children.push(H.spacer());
children.push(H.callout("info", "Complemento",
  "Para el detalle funcional del sistema (pantallas, flujos operativos, gestión por módulo) consulte el Manual de Usuario - Umbrella ERP, que acompaña a este documento."));

// =================== BUILD ===================
const doc = new Document({
  creator: "Umbrella ERP",
  title: "Manual Técnico - API Umbrella ERP",
  description: "Guía de integración para sistemas externos mediante la API REST de Umbrella ERP",
  styles: H.styles,
  numbering: H.numbering,
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Umbrella ERP — Manual Técnico de API", color: H.DARK_GRAY, size: 18 })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Página ", color: H.DARK_GRAY, size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], color: H.DARK_GRAY, size: 18 }),
            new TextRun({ text: " de ", color: H.DARK_GRAY, size: 18 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], color: H.DARK_GRAY, size: 18 }),
          ],
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const out = path.join(__dirname, "Manual_Tecnico_API_Umbrella_ERP.docx");
  fs.writeFileSync(out, buffer);
  console.log("Manual Técnico escrito en:", out);
}).catch(err => {
  console.error("Error generando Manual Técnico:", err);
  process.exit(1);
});
