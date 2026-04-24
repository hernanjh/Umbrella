// Build Manual de Usuario - Umbrella ERP
process.env.NODE_PATH = "C:\\Users\\hhegykozi\\AppData\\Roaming\\npm\\node_modules";
require("module").Module._initPaths();

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber,
  AlignmentType, PageOrientation, HeadingLevel, TableOfContents,
} = require("docx");
const H = require("./_helpers.js");

const children = [];

// =================== PORTADA ===================
children.push(new Paragraph({ children: [new TextRun("")], spacing: { before: 2400 } }));
children.push(new Paragraph({
  style: "Title",
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "MANUAL DE USUARIO", bold: true, size: 72, color: H.BLUE })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
  children: [new TextRun({ text: "Umbrella ERP", bold: true, size: 56, color: H.BLUE })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 2400 },
  children: [new TextRun({ text: "Sistema de Gestión de Compra y Venta", italics: true, size: 32, color: H.DARK_GRAY })],
}));
children.push(H.screenshotPlaceholder(
  "Logotipo / Portada",
  "Insertar aquí el logotipo corporativo o una imagen representativa del dashboard"
));
children.push(new Paragraph({ children: [new TextRun("")], spacing: { before: 1200 } }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Versión 1.0", size: 28, color: H.DARK_GRAY })],
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

children.push(H.heading("1.1 ¿Qué es Umbrella ERP?", HeadingLevel.HEADING_2));
children.push(H.p("Umbrella ERP es una solución integral de gestión empresarial orientada a pymes y comercios, diseñada para administrar de manera unificada los procesos de compra, venta, inventario, finanzas y administración de clientes y proveedores."));
children.push(H.p("El sistema incluye funcionalidades avanzadas como:"));
children.push(H.bullet("Facturación de ventas y compras con múltiples tipos de comprobante (A, B, C, X, notas de crédito)"));
children.push(H.bullet("Gestión de inventario multi-depósito con movimientos y ajustes de stock"));
children.push(H.bullet("Administración financiera completa: caja, cuentas por cobrar, cuentas por pagar, planes de pago en cuotas"));
children.push(H.bullet("Listas de precios múltiples con recálculos masivos y actualizaciones por porcentaje"));
children.push(H.bullet("Gestión documental (fotos y documentos de productos y clientes)"));
children.push(H.bullet("Reportes detallados con exportación a Excel y PDF"));
children.push(H.bullet("Sistema de seguridad con roles y permisos granulares por módulo y acción"));
children.push(H.bullet("Zonas comerciales y asignación de vendedores"));
children.push(H.bullet("Interfaz web responsive con modo claro y modo oscuro"));

children.push(H.heading("1.2 Requisitos del sistema", HeadingLevel.HEADING_2));
children.push(H.p([
  { text: "Equipo del usuario: ", bold: true },
  { text: "navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox o Safari) con conexión a internet o a la red local donde esté desplegado el sistema." }
]));
children.push(H.p([
  { text: "Resolución recomendada: ", bold: true },
  { text: "1366 x 768 píxeles o superior. El sistema se adapta a dispositivos móviles pero la experiencia óptima es en desktop o tablet horizontal." }
]));

children.push(H.heading("1.3 Convenciones utilizadas en este manual", HeadingLevel.HEADING_2));
children.push(H.p("A lo largo del manual se utilizan los siguientes elementos visuales para facilitar la comprensión:"));
children.push(H.callout("info", "Información", "Aclaraciones y datos relevantes que complementan la funcionalidad descrita."));
children.push(H.spacer());
children.push(H.callout("tip", "Consejo", "Buenas prácticas y recomendaciones que optimizan el uso del sistema."));
children.push(H.spacer());
children.push(H.callout("warning", "Atención", "Advertencias sobre acciones que pueden requerir consideración especial."));
children.push(H.spacer());
children.push(H.callout("danger", "Importante", "Acciones críticas, irreversibles o que afectan datos sensibles."));
children.push(H.spacer());
children.push(H.p([
  { text: "Además, los textos que representan botones o etiquetas de la interfaz se muestran en " },
  { text: "negrita", bold: true },
  { text: ", y los nombres técnicos o rutas en ", },
  { text: "cursiva", italics: true },
  { text: "." }
]));

children.push(H.pageBreak());

// =================== 2. PRIMEROS PASOS ===================
children.push(H.heading("2. Primeros pasos", HeadingLevel.HEADING_1));

children.push(H.heading("2.1 Acceso al sistema", HeadingLevel.HEADING_2));
children.push(H.p("Para acceder al sistema abra su navegador e ingrese la URL proporcionada por el administrador. Por ejemplo:"));
children.push(H.codeBlock("http://localhost            (instalación local de desarrollo)\nhttp://erp.miempresa.com    (instalación en servidor corporativo)"));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Pantalla de inicio de sesión",
  "Formulario centrado con campo Email, campo Contraseña, botón Iniciar sesión y logotipo de Umbrella ERP"
));
children.push(H.spacer());

children.push(H.heading("2.2 Inicio de sesión", HeadingLevel.HEADING_2));
children.push(H.p("Para iniciar sesión:"));
children.push(H.numbered("Ingrese su correo electrónico en el campo Email."));
children.push(H.numbered("Ingrese su contraseña en el campo Contraseña."));
children.push(H.numbered("Presione el botón Iniciar sesión o la tecla Enter."));
children.push(H.spacer());
children.push(H.callout("info", "Credenciales por defecto",
  "En una instalación nueva existe un usuario administrador con email admin@erp.com y contraseña Admin123!. Se recomienda cambiar esta contraseña después del primer acceso."));
children.push(H.spacer());
children.push(H.callout("warning", "Contraseña olvidada",
  "Si olvidó su contraseña contacte al administrador del sistema, quien puede restablecerla desde el módulo Seguridad > Usuarios."));

children.push(H.heading("2.3 Interfaz general del sistema", HeadingLevel.HEADING_2));
children.push(H.p("Una vez autenticado, el sistema muestra la interfaz principal compuesta por tres áreas:"));
children.push(H.bulletRich([{ text: "Barra lateral (Sidebar): ", bold: true }, { text: "ubicada a la izquierda, contiene el menú de navegación con todos los módulos disponibles según los permisos del usuario." }]));
children.push(H.bulletRich([{ text: "Encabezado (Header): ", bold: true }, { text: "en la parte superior, muestra el nombre del usuario, botón de cambio de tema (claro/oscuro), accesos al perfil y cierre de sesión." }]));
children.push(H.bulletRich([{ text: "Área principal: ", bold: true }, { text: "espacio central donde se despliega el contenido del módulo seleccionado." }]));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Interfaz principal del sistema",
  "Vista completa mostrando sidebar a la izquierda (menú con Dashboard, Ventas, Compras, Stock, Finanzas, Clientes, Proveedores, Productos, Reportes, Seguridad, Parametrización), header con nombre de usuario y cambio de tema, y dashboard en el centro"
));

children.push(H.heading("2.4 Navegación del menú lateral", HeadingLevel.HEADING_2));
children.push(H.p("El menú lateral organiza todos los módulos del sistema. Algunos módulos son expandibles y contienen submenús. Haga clic en el nombre del grupo para mostrar u ocultar sus opciones."));
children.push(H.p("La estructura completa del menú es la siguiente:"));

children.push(H.simpleTable(
  ["Grupo", "Opciones incluidas"],
  [
    ["Dashboard", "Panel principal con KPIs"],
    ["Ventas", "Facturas de Venta, Listas de Precios"],
    ["Compras", "Facturas de Compra"],
    ["Stock", "Estado de Stock, Ajustes, Movimientos"],
    ["Finanzas", "Caja, Histórico de Caja, Cuentas por Cobrar, Cuentas por Pagar, Planes de Pago, Cobros del día"],
    ["Clientes", "Listado y cuentas corrientes"],
    ["Proveedores", "Listado y cuentas corrientes"],
    ["Productos", "Catálogo, fotos y documentos"],
    ["Reportes", "Reportes tabulares y gráficos"],
    ["Seguridad", "Usuarios, Roles"],
    ["Parametrización", "Configuración general, tipos, zonas, IVA, métodos de pago, etc."],
  ],
  [2600, 6760]
));
children.push(H.spacer());
children.push(H.callout("info", "Permisos y visibilidad",
  "La barra lateral oculta automáticamente los módulos a los que el usuario no tiene permiso de lectura. Si un usuario no ve cierta opción, debe solicitar al administrador la asignación del permiso correspondiente."));

children.push(H.heading("2.5 Cambio de tema (claro / oscuro)", HeadingLevel.HEADING_2));
children.push(H.p("El sistema soporta dos modos de visualización: claro y oscuro. Para alternar entre ellos haga clic sobre el ícono de sol o luna ubicado en la parte superior derecha del encabezado."));
children.push(H.screenshotPlaceholder(
  "Comparativa tema claro vs. tema oscuro",
  "Mostrar la misma pantalla (por ejemplo, el Dashboard) en modo claro a la izquierda y modo oscuro a la derecha"
));

children.push(H.heading("2.6 Cerrar sesión", HeadingLevel.HEADING_2));
children.push(H.p("Para cerrar sesión de forma segura, haga clic sobre el nombre de usuario en el encabezado y seleccione la opción Cerrar sesión. El sistema invalidará la sesión y redirigirá a la pantalla de inicio."));
children.push(H.callout("tip", "Buenas prácticas",
  "Siempre cierre sesión al terminar de trabajar, especialmente en equipos compartidos. El sistema aplica caducidad automática al token de acceso, pero el cierre manual es la opción más segura."));

children.push(H.pageBreak());

// =================== 3. DASHBOARD ===================
children.push(H.heading("3. Dashboard", HeadingLevel.HEADING_1));
children.push(H.p("El Dashboard es la pantalla principal del sistema, diseñada para ofrecer una vista rápida del estado del negocio. Es la primera página que se muestra después del inicio de sesión."));

children.push(H.heading("3.1 KPIs principales", HeadingLevel.HEADING_2));
children.push(H.p("En la parte superior se muestran tarjetas con los indicadores clave de gestión:"));
children.push(H.bulletRich([{ text: "Ventas del mes: ", bold: true }, { text: "total facturado en el mes en curso." }]));
children.push(H.bulletRich([{ text: "Cuentas por cobrar: ", bold: true }, { text: "saldo total de facturas de venta con pagos pendientes." }]));
children.push(H.bulletRich([{ text: "Cuentas por pagar: ", bold: true }, { text: "saldo total de facturas de compra con pagos pendientes." }]));
children.push(H.bulletRich([{ text: "Saldo de caja: ", bold: true }, { text: "efectivo actual en la sesión de caja abierta." }]));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Dashboard con KPIs",
  "Tarjetas superiores con los 4 indicadores principales, cada una con un ícono representativo, el monto destacado y una tendencia respecto al período anterior"
));

children.push(H.heading("3.2 Gráficos y listados", HeadingLevel.HEADING_2));
children.push(H.p("Debajo de los KPIs se muestran:"));
children.push(H.bulletRich([{ text: "Tendencia de ventas: ", bold: true }, { text: "gráfico de líneas con las ventas diarias de los últimos 30 días." }]));
children.push(H.bulletRich([{ text: "Top vendedores: ", bold: true }, { text: "ranking con los vendedores de mayor facturación del período." }]));
children.push(H.bulletRich([{ text: "Facturas recientes: ", bold: true }, { text: "últimos 10 comprobantes emitidos con su estado." }]));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Dashboard con gráficos",
  "Gráfico de líneas de tendencia de ventas, ranking de vendedores y tabla de facturas recientes"
));

children.push(H.pageBreak());

// =================== 4. MÓDULO DE VENTAS ===================
children.push(H.heading("4. Módulo de Ventas", HeadingLevel.HEADING_1));
children.push(H.p("El módulo de Ventas permite gestionar el ciclo completo de facturación a clientes: emisión de comprobantes, confirmación, registro de pagos, generación de planes de cuotas y descarga en PDF."));

children.push(H.heading("4.1 Listado de facturas de venta", HeadingLevel.HEADING_2));
children.push(H.p("Acceda desde Ventas > Facturas de Venta. La pantalla muestra un grilla con todas las facturas emitidas, con filtros por estado, fecha, cliente y vendedor."));
children.push(H.screenshotPlaceholder(
  "Listado de facturas de venta",
  "Grilla con columnas: Número, Fecha, Cliente, Tipo, Total, Saldo, Estado (badge Borrador/Confirmada/Anulada), acciones (ver/editar/pagar). Arriba: botón Nueva, buscador y filtros"
));

children.push(H.heading("Estados de una factura", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Estado", "Descripción"],
  [
    ["Borrador", "Factura creada pero no confirmada. Puede editarse libremente. No afecta stock ni cuenta corriente."],
    ["Confirmada", "Factura oficializada. Descuenta stock, genera saldo en cuenta corriente. Puede recibir pagos."],
    ["Anulada", "Factura cancelada. Revierte stock y pagos asociados si los hubiera."],
    ["Pagada", "Factura con saldo cero (todos los pagos registrados). Es un sub-estado de Confirmada."],
  ],
  [2000, 7360]
));

children.push(H.heading("4.2 Crear una factura de venta", HeadingLevel.HEADING_2));
children.push(H.p("Para crear una nueva factura haga clic en el botón Nueva en la esquina superior derecha del listado."));
children.push(H.screenshotPlaceholder(
  "Formulario de nueva factura (cabecera)",
  "Campos: Tipo de comprobante, Fecha, Cliente (con buscador), Vendedor, Lista de precios, Condición de pago, Depósito de stock, Notas"
));
children.push(H.p("Complete los campos de cabecera:"));
children.push(H.numbered("Seleccione el Tipo de comprobante (A, B, C, X, etc.)."));
children.push(H.numbered("Elija la Fecha de emisión."));
children.push(H.numbered("Busque y seleccione el Cliente. Si no existe puede crearlo desde el módulo Clientes y luego volver."));
children.push(H.numbered("Asigne un Vendedor (por defecto el usuario actual si es vendedor)."));
children.push(H.numbered("Seleccione la Lista de precios a aplicar."));
children.push(H.numbered("Elija la Condición de pago (Contado, 30 días, 60 días, 90 días, etc.)."));
children.push(H.numbered("Seleccione el Depósito del cual descontar el stock."));
children.push(H.spacer());

children.push(H.heading("Agregar productos (ítems)", HeadingLevel.HEADING_3));
children.push(H.screenshotPlaceholder(
  "Sección de ítems de la factura",
  "Tabla con columnas: Producto (buscador), Cantidad, Precio unitario, % Desc, % IVA, Subtotal. Botón para agregar línea"
));
children.push(H.numbered("Haga clic en Agregar línea."));
children.push(H.numbered("Busque el producto por código, nombre o código de barras."));
children.push(H.numbered("Ingrese la cantidad."));
children.push(H.numbered("El precio unitario se completa automáticamente según la lista de precios, pero puede modificarlo."));
children.push(H.numbered("Ingrese un porcentaje de descuento si corresponde."));
children.push(H.numbered("El IVA se calcula según la condición del producto."));
children.push(H.numbered("El subtotal de línea se recalcula automáticamente."));
children.push(H.spacer());
children.push(H.callout("tip", "Totales automáticos",
  "El sistema recalcula en tiempo real los totales al modificar cualquier campo: subtotal, descuento, base gravada, IVA y total general."));

children.push(H.heading("4.3 Confirmar una factura", HeadingLevel.HEADING_2));
children.push(H.p("Una factura en estado Borrador puede ser confirmada con el botón Confirmar. Al hacerlo:"));
children.push(H.bullet("Se descuenta la cantidad facturada del stock del depósito seleccionado."));
children.push(H.bullet("Se genera un saldo deudor en la cuenta corriente del cliente."));
children.push(H.bullet("La factura deja de poder editarse (solo admite pagos y anulación)."));
children.push(H.bullet("Se asigna un número definitivo según la secuencia del tipo de comprobante."));
children.push(H.spacer());
children.push(H.callout("warning", "Stock negativo",
  "Si la configuración del sistema no permite stock negativo, la confirmación fallará si no hay existencias suficientes. Revise el parámetro Permitir stock negativo en Configuración general."));

children.push(H.heading("4.4 Registrar un pago", HeadingLevel.HEADING_2));
children.push(H.p("En el detalle de una factura confirmada con saldo pendiente, utilice la sección Pagos para registrar cobros parciales o totales."));
children.push(H.screenshotPlaceholder(
  "Sección de pagos en detalle de factura",
  "Panel con listado de pagos ya registrados (fecha, método, monto, referencia) y botón Registrar pago que abre un modal"
));
children.push(H.numbered("Haga clic en Registrar pago."));
children.push(H.numbered("Seleccione el Método de pago (Efectivo, Transferencia, Tarjeta, Cheque)."));
children.push(H.numbered("Ingrese el monto. El sistema sugiere el saldo pendiente."));
children.push(H.numbered("Complete la referencia (número de cheque, comprobante de transferencia, etc.)."));
children.push(H.numbered("Agregue notas si lo desea."));
children.push(H.numbered("Presione Confirmar."));
children.push(H.spacer());
children.push(H.callout("info", "Efecto en caja",
  "Si el método de pago es Efectivo y afecta caja, el pago se registra automáticamente como movimiento de ingreso en la sesión de caja abierta."));

children.push(H.heading("4.5 Planes de pago en cuotas", HeadingLevel.HEADING_2));
children.push(H.p("Para facturas con pagos diferidos, el sistema permite armar un plan de cuotas desde la sección Plan de cuotas en el detalle de la factura."));
children.push(H.screenshotPlaceholder(
  "Panel de plan de cuotas",
  "Tabla con Nº cuota, Fecha de vencimiento, Monto, Estado (Pendiente/Pagada/Vencida), botones Marcar pagada y Eliminar plan"
));
children.push(H.numbered("Haga clic en Crear plan de cuotas."));
children.push(H.numbered("Indique la cantidad de cuotas y la fecha de la primera."));
children.push(H.numbered("El sistema calcula los vencimientos y montos."));
children.push(H.numbered("Ajuste manualmente montos o fechas si lo necesita."));
children.push(H.numbered("Guarde el plan."));
children.push(H.spacer());
children.push(H.p("Para pagar una cuota, haga clic en Marcar pagada. Se abrirá el diálogo de registro de pago con el monto prellenado."));
children.push(H.callout("info", "Cuotas vencidas",
  "Las cuotas cuya fecha de vencimiento ya pasó y no están pagadas se muestran en color rojo. Aparecen también en el reporte Cuotas vencidas y en el módulo Cuentas por Cobrar."));

children.push(H.heading("4.6 Descargar factura en PDF", HeadingLevel.HEADING_2));
children.push(H.p("Desde el detalle de cualquier factura, haga clic en el botón PDF para descargar el comprobante en formato imprimible."));
children.push(H.screenshotPlaceholder(
  "Ejemplo de PDF de factura",
  "Layout de la factura con encabezado de la empresa (logo, datos fiscales), datos del cliente, tabla de ítems, totales y pie con observaciones"
));

children.push(H.heading("4.7 Anular / Cancelar una factura", HeadingLevel.HEADING_2));
children.push(H.p("Si una factura fue emitida por error o debe revertirse, utilice el botón Anular en el detalle. El sistema:"));
children.push(H.bullet("Marca la factura como Anulada."));
children.push(H.bullet("Revierte el movimiento de stock (devuelve cantidades al depósito)."));
children.push(H.bullet("Revierte los pagos asociados si los hubiera."));
children.push(H.bullet("Elimina el saldo de la cuenta corriente del cliente."));
children.push(H.spacer());
children.push(H.callout("danger", "Acción irreversible",
  "La anulación de una factura es una acción que requiere permisos de eliminación y debe realizarse con cuidado. Las facturas anuladas quedan registradas en el sistema para auditoría y no pueden ser restauradas."));

children.push(H.pageBreak());

// =================== 5. MÓDULO DE COMPRAS ===================
children.push(H.heading("5. Módulo de Compras", HeadingLevel.HEADING_1));
children.push(H.p("El módulo de Compras gestiona las facturas recibidas de proveedores. Su funcionamiento es análogo al de ventas, pero con sentido inverso: incrementa stock y genera saldos acreedores."));

children.push(H.heading("5.1 Listado de facturas de compra", HeadingLevel.HEADING_2));
children.push(H.p("Acceda desde Compras > Facturas de Compra. Se muestra el listado con filtros y acciones equivalentes al módulo de ventas."));
children.push(H.screenshotPlaceholder(
  "Listado de facturas de compra",
  "Grilla con Número, Fecha, Proveedor, Tipo, Total, Saldo a pagar, Estado y acciones"
));

children.push(H.heading("5.2 Crear una factura de compra", HeadingLevel.HEADING_2));
children.push(H.p("Para registrar una factura de un proveedor:"));
children.push(H.numbered("Haga clic en Nueva."));
children.push(H.numbered("Seleccione Tipo de comprobante, Fecha y Proveedor."));
children.push(H.numbered("Ingrese los ítems (productos, cantidades, precios de compra)."));
children.push(H.numbered("Seleccione el Depósito donde ingresará el stock."));
children.push(H.numbered("Guarde como Borrador o Confirme para actualizar stock."));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Formulario de nueva factura de compra",
  "Formulario similar al de ventas, con buscador de proveedor y campos específicos como número externo del comprobante"
));
children.push(H.callout("info", "Actualización del costo",
  "Al confirmar una factura de compra, el sistema actualiza el precio de última compra y recalcula el costo promedio ponderado de cada producto. Este valor se utiliza para reportes de rentabilidad."));

children.push(H.heading("5.3 Registrar pagos a proveedores", HeadingLevel.HEADING_2));
children.push(H.p("El flujo de pagos es idéntico al de facturas de venta, pero registra egresos en caja (si el método es efectivo) y reduce el saldo en cuenta corriente del proveedor."));

children.push(H.pageBreak());

// =================== 6. MÓDULO DE STOCK ===================
children.push(H.heading("6. Módulo de Stock", HeadingLevel.HEADING_1));

children.push(H.heading("6.1 Estado de stock", HeadingLevel.HEADING_2));
children.push(H.p("Acceda desde Stock > Estado de Stock. Visualice las existencias por producto y por depósito, con filtros por categoría y locación."));
children.push(H.screenshotPlaceholder(
  "Pantalla de estado de stock",
  "Grilla con columnas: Producto, Código, Categoría, Depósito, Cantidad actual, Stock mínimo, Estado (OK/Bajo mínimo)"
));
children.push(H.callout("tip", "Filtrado rápido",
  "Use los filtros superiores para ver sólo productos por debajo de su stock mínimo. Esta vista es útil para detectar necesidades de reposición."));

children.push(H.heading("6.2 Ajustes de stock", HeadingLevel.HEADING_2));
children.push(H.p("Los ajustes de stock permiten corregir diferencias detectadas en inventarios físicos, registrar pérdidas, mermas, traspasos o cualquier movimiento que no provenga de una factura."));
children.push(H.screenshotPlaceholder(
  "Creación de ajuste de stock",
  "Formulario con Código, Fecha, Depósito, listado de ítems (producto, cantidad ajustada positiva o negativa, motivo, costo unitario) y botones Guardar borrador / Confirmar"
));
children.push(H.numbered("Ingrese a Stock > Ajustes y haga clic en Nuevo ajuste."));
children.push(H.numbered("Seleccione el Depósito."));
children.push(H.numbered("Agregue los productos y cantidades (positivas para aumentar stock, negativas para disminuir)."));
children.push(H.numbered("Indique el Motivo (inventario físico, rotura, robo, etc.)."));
children.push(H.numbered("Guarde como Borrador para revisar, o Confirme para aplicar los cambios."));
children.push(H.spacer());
children.push(H.callout("warning", "Ajustes confirmados",
  "Un ajuste confirmado no puede modificarse. Si necesita corregirlo, debe crear un nuevo ajuste con los valores inversos."));

children.push(H.heading("6.3 Movimientos de stock", HeadingLevel.HEADING_2));
children.push(H.p("El listado de movimientos muestra el historial completo de entradas y salidas de cada producto, con su origen (factura, ajuste, transferencia), fecha y usuario responsable."));
children.push(H.screenshotPlaceholder(
  "Historial de movimientos",
  "Grilla cronológica con Fecha, Producto, Depósito, Tipo (Entrada/Salida/Ajuste/Transferencia), Cantidad, Referencia (nº de factura o ajuste), Usuario"
));

children.push(H.pageBreak());

// =================== 7. MÓDULO FINANCIERO ===================
children.push(H.heading("7. Módulo Financiero", HeadingLevel.HEADING_1));

children.push(H.heading("7.1 Caja", HeadingLevel.HEADING_2));
children.push(H.p("El módulo Caja permite administrar las sesiones de caja: apertura diaria, registro de movimientos de efectivo y cierre con arqueo."));

children.push(H.heading("Apertura de sesión", HeadingLevel.HEADING_3));
children.push(H.screenshotPlaceholder(
  "Apertura de sesión de caja",
  "Modal con campos: Fecha y hora de apertura, Saldo inicial (efectivo contado), Observaciones"
));
children.push(H.numbered("Acceda a Finanzas > Caja."));
children.push(H.numbered("Si no hay sesión abierta, haga clic en Abrir caja."));
children.push(H.numbered("Ingrese el saldo inicial (efectivo disponible al iniciar el día)."));
children.push(H.numbered("Confirme la apertura."));
children.push(H.spacer());
children.push(H.callout("info", "Una sesión por vez",
  "El sistema solo permite una sesión abierta por usuario. Debe cerrar la sesión actual antes de abrir otra."));

children.push(H.heading("Registrar movimientos", HeadingLevel.HEADING_3));
children.push(H.p("Desde la caja abierta puede registrar movimientos manuales de ingresos y egresos (por ejemplo, retiros o depósitos administrativos):"));
children.push(H.bullet("Tipo (Ingreso / Egreso / Transferencia)"));
children.push(H.bullet("Monto y método (efectivo, transferencia, etc.)"));
children.push(H.bullet("Referencia y notas"));
children.push(H.spacer());
children.push(H.callout("tip", "Cobros automáticos",
  "Los pagos de facturas que se cobran en efectivo se registran automáticamente como ingresos en la sesión de caja actual. No es necesario hacerlo manualmente."));

children.push(H.heading("Cierre de caja", HeadingLevel.HEADING_3));
children.push(H.screenshotPlaceholder(
  "Modal de cierre de caja",
  "Resumen de ingresos/egresos del día por método, saldo teórico calculado, campo para ingresar el efectivo contado y cálculo automático de diferencia"
));
children.push(H.p("Al finalizar el día haga clic en Cerrar caja. El sistema muestra el saldo teórico y le pide ingresar el efectivo contado. La diferencia se registra como observación en el cierre."));

children.push(H.heading("7.2 Histórico de sesiones de caja", HeadingLevel.HEADING_2));
children.push(H.p("Desde Finanzas > Histórico de Caja puede consultar todas las sesiones cerradas con sus totales, diferencias y responsables."));
children.push(H.screenshotPlaceholder(
  "Listado de sesiones de caja",
  "Grilla con Fecha apertura, Fecha cierre, Usuario, Saldo inicial, Total ingresos, Total egresos, Saldo final, Diferencia"
));

children.push(H.heading("7.3 Cuentas por Cobrar", HeadingLevel.HEADING_2));
children.push(H.p("Listado de todos los saldos pendientes de cobro, agrupados por cliente, con análisis de antigüedad."));
children.push(H.screenshotPlaceholder(
  "Pantalla de cuentas por cobrar",
  "Tabla con Cliente, Saldo total, Vencido, Por vencer, detalle de facturas con sus días de antigüedad (0-30, 31-60, 61-90, +90)"
));

children.push(H.heading("7.4 Cuentas por Pagar", HeadingLevel.HEADING_2));
children.push(H.p("Análogo a cuentas por cobrar, pero para saldos adeudados a proveedores."));
children.push(H.screenshotPlaceholder(
  "Pantalla de cuentas por pagar",
  "Tabla con Proveedor, Saldo total, Vencido, Por vencer, detalle de facturas"
));

children.push(H.heading("7.5 Planes de pago", HeadingLevel.HEADING_2));
children.push(H.p("Desde Finanzas > Planes de Pago accede a todos los planes de cuotas generados en el sistema, con estado global, filtrables por vigencia."));
children.push(H.screenshotPlaceholder(
  "Listado de planes de pago",
  "Grilla con Factura, Cliente, Total del plan, Nº cuotas, Pagadas, Pendientes, Vencidas, Estado del plan"
));

children.push(H.heading("7.6 Cobros del día", HeadingLevel.HEADING_2));
children.push(H.p("Reporte diario de los cobros realizados, filtrable por zona y fecha. Útil para cierres de vendedores de campo."));
children.push(H.screenshotPlaceholder(
  "Reporte de cobros del día",
  "Filtros: Zona, Fecha. Tabla con Vendedor, Cliente, Factura, Método, Monto. Totales al pie. Botones Exportar Excel / PDF"
));

children.push(H.pageBreak());

// =================== 8. CLIENTES ===================
children.push(H.heading("8. Clientes", HeadingLevel.HEADING_1));

children.push(H.heading("8.1 Listado de clientes", HeadingLevel.HEADING_2));
children.push(H.p("Acceda a Clientes desde el menú lateral. El listado muestra todos los clientes activos (los eliminados pueden verse con el filtro correspondiente)."));
children.push(H.screenshotPlaceholder(
  "Listado de clientes",
  "Grilla con Código, Razón Social, CUIT/DNI, Teléfono, Email, Zona, Tipo, acciones. Botón Nuevo, buscador, filtro por zona y tipo"
));

children.push(H.heading("8.2 Crear o editar un cliente", HeadingLevel.HEADING_2));
children.push(H.p("Haga clic en Nuevo o en el ícono de edición de un cliente existente. Complete los datos:"));
children.push(H.bulletRich([{ text: "Datos generales: ", bold: true }, { text: "código, razón social/nombre, CUIT o DNI, fecha de nacimiento." }]));
children.push(H.bulletRich([{ text: "Contacto: ", bold: true }, { text: "teléfono, celular, email, sitio web." }]));
children.push(H.bulletRich([{ text: "Domicilio: ", bold: true }, { text: "dirección, localidad, provincia, código postal." }]));
children.push(H.bulletRich([{ text: "Comercial: ", bold: true }, { text: "tipo de cliente, condición frente al IVA, zona, lista de precios por defecto." }]));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Formulario de cliente",
  "Formulario en pestañas o secciones: Datos Generales, Contacto, Domicilio, Comercial, Documentos. Botones Guardar/Cancelar"
));

children.push(H.heading("8.3 Cuenta corriente del cliente", HeadingLevel.HEADING_2));
children.push(H.p("Desde el detalle de un cliente puede acceder a la Cuenta corriente, donde se muestran todas las facturas, pagos y saldos."));
children.push(H.screenshotPlaceholder(
  "Cuenta corriente de cliente",
  "Cabecera con datos del cliente y saldo total. Tabla de movimientos: Fecha, Tipo (Factura/Pago/Nota), Número, Debe, Haber, Saldo acumulado. Botones Exportar Excel / PDF"
));

children.push(H.heading("8.4 Documentos del cliente", HeadingLevel.HEADING_2));
children.push(H.p("Se pueden adjuntar documentos digitalizados al ficha del cliente: contratos, DNI, poderes, etc."));
children.push(H.numbered("Desde el detalle del cliente, acceda a la pestaña Documentos."));
children.push(H.numbered("Haga clic en Subir archivo."));
children.push(H.numbered("Seleccione el archivo (PDF, imagen, documento Office)."));
children.push(H.numbered("Agregue una descripción."));
children.push(H.numbered("Guarde."));
children.push(H.spacer());
children.push(H.callout("info", "Tamaño máximo",
  "Cada archivo puede tener hasta 10 MB. Formatos admitidos: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX."));

children.push(H.pageBreak());

// =================== 9. PROVEEDORES ===================
children.push(H.heading("9. Proveedores", HeadingLevel.HEADING_1));
children.push(H.p("La gestión de proveedores es análoga a la de clientes. Los campos específicos incluyen la condición de IVA del proveedor, CUIT y datos de contacto comercial."));

children.push(H.heading("9.1 Listado de proveedores", HeadingLevel.HEADING_2));
children.push(H.screenshotPlaceholder(
  "Listado de proveedores",
  "Grilla con Código, Razón Social, CUIT, Contacto, Email, Teléfono, acciones. Botón Nuevo, buscador"
));

children.push(H.heading("9.2 Crear o editar un proveedor", HeadingLevel.HEADING_2));
children.push(H.screenshotPlaceholder(
  "Formulario de proveedor",
  "Campos: Código, Razón Social, CUIT, Condición frente al IVA, Dirección, Teléfono, Email, Contacto, Notas"
));

children.push(H.heading("9.3 Cuenta corriente del proveedor", HeadingLevel.HEADING_2));
children.push(H.p("Similar a la del cliente, muestra facturas recibidas y pagos efectuados, con saldo acumulado."));
children.push(H.screenshotPlaceholder(
  "Cuenta corriente del proveedor",
  "Tabla cronológica de movimientos. Exportable a Excel y PDF"
));

children.push(H.pageBreak());

// =================== 10. PRODUCTOS ===================
children.push(H.heading("10. Productos", HeadingLevel.HEADING_1));

children.push(H.heading("10.1 Catálogo de productos", HeadingLevel.HEADING_2));
children.push(H.p("El módulo Productos administra el catálogo completo: altas, bajas, modificaciones, fotografías y documentos asociados."));
children.push(H.screenshotPlaceholder(
  "Listado de productos",
  "Grilla con Código, Nombre, Código de barras, Categoría, Unidad, Stock total, Estado (Activo/Inactivo). Filtros por categoría. Botón Nuevo y buscador"
));

children.push(H.heading("10.2 Crear o editar un producto", HeadingLevel.HEADING_2));
children.push(H.screenshotPlaceholder(
  "Formulario de producto",
  "Campos: Código, Nombre, Descripción, Código de barras, Marca, Modelo, Unidad (UN, KG, LT, etc.), Categoría, ¿Lleva stock?, Stock mínimo, Foto principal"
));
children.push(H.p("Los campos más relevantes:"));
children.push(H.bulletRich([{ text: "Código: ", bold: true }, { text: "identificador único del producto, utilizado en facturación." }]));
children.push(H.bulletRich([{ text: "Lleva stock: ", bold: true }, { text: "si está activado, el producto afecta inventario al facturarse. Si no, se trata como servicio o ítem genérico." }]));
children.push(H.bulletRich([{ text: "Stock mínimo: ", bold: true }, { text: "cantidad por debajo de la cual se alerta en el estado de stock." }]));

children.push(H.heading("10.3 Fotografías del producto", HeadingLevel.HEADING_2));
children.push(H.p("Cada producto puede tener múltiples fotografías. Una de ellas se define como principal y aparece en listados y formularios."));
children.push(H.screenshotPlaceholder(
  "Sección de fotografías del producto",
  "Grilla de miniaturas con opción de marcar como principal, reordenar y eliminar. Botón Subir fotos permite seleccionar varios archivos"
));
children.push(H.callout("info", "Formatos admitidos",
  "JPG, PNG, WEBP y GIF. Tamaño máximo 10 MB por archivo."));

children.push(H.heading("10.4 Documentos del producto", HeadingLevel.HEADING_2));
children.push(H.p("Fichas técnicas, manuales, certificados y cualquier otro documento relacionado con el producto pueden almacenarse en la pestaña Documentos del detalle del producto."));
children.push(H.screenshotPlaceholder(
  "Sección de documentos del producto",
  "Listado de archivos con Nombre, Tipo, Tamaño, Descripción, Fecha de subida y botón Descargar. Formulario de subida arriba"
));

children.push(H.pageBreak());

// =================== 11. LISTAS DE PRECIOS ===================
children.push(H.heading("11. Listas de Precios", HeadingLevel.HEADING_1));
children.push(H.p("El sistema admite múltiples listas de precios para diferenciar segmentos comerciales: minorista, mayorista, preferencial, etc."));

children.push(H.heading("11.1 Listado de listas de precios", HeadingLevel.HEADING_2));
children.push(H.screenshotPlaceholder(
  "Listado de listas de precios",
  "Grilla con Código, Nombre, Descripción, Cantidad de ítems, Última actualización. Botones Nueva y acciones"
));

children.push(H.heading("11.2 Detalle y edición de precios", HeadingLevel.HEADING_2));
children.push(H.p("Al abrir una lista accede al listado de productos con su precio dentro de esa lista. Puede modificar precios individualmente o masivamente."));
children.push(H.screenshotPlaceholder(
  "Detalle de lista de precios",
  "Grilla con Producto, Código, Precio actual, botón de edición inline. Arriba: botones Actualización masiva (% o valor fijo), Recalcular, Agregar producto"
));

children.push(H.heading("11.3 Actualización masiva", HeadingLevel.HEADING_2));
children.push(H.p("Con la función Actualización masiva puede aumentar o disminuir precios por un porcentaje o un valor fijo sobre todos los productos de la lista o una selección."));
children.push(H.screenshotPlaceholder(
  "Modal de actualización masiva",
  "Opciones: Aumentar/Disminuir, Porcentaje o Valor absoluto, valor, filtro opcional por categoría, redondeo, vista previa"
));
children.push(H.callout("tip", "Vista previa",
  "Antes de confirmar una actualización masiva el sistema muestra los precios resultantes. Revise el resultado antes de aplicar los cambios."));

children.push(H.pageBreak());

// =================== 12. REPORTES ===================
children.push(H.heading("12. Reportes", HeadingLevel.HEADING_1));
children.push(H.p("El módulo Reportes centraliza todos los informes gerenciales del sistema. Cada reporte admite filtros de fecha, zona, cliente, vendedor o producto según corresponda, y puede exportarse a Excel y PDF."));

children.push(H.heading("12.1 Reportes disponibles", HeadingLevel.HEADING_2));
children.push(H.simpleTable(
  ["Reporte", "Descripción"],
  [
    ["Ventas por período", "Total facturado en un rango de fechas, con apertura por tipo de comprobante y resumen de IVA"],
    ["Ventas por vendedor", "Desempeño de cada vendedor: total facturado, cantidad de comprobantes, promedio por venta"],
    ["Ventas por cliente", "Top de clientes y detalle de ventas por cada uno en el período"],
    ["Ventas detalladas", "Detalle línea por línea de productos vendidos, con filtro por zona"],
    ["Stock", "Valuación actual del inventario y cantidades por depósito y categoría"],
    ["Pagos", "Listado de pagos recibidos por método, fecha y cliente"],
    ["Cuentas por Cobrar", "Saldos pendientes agrupados con análisis de antigüedad"],
    ["Cuentas por Pagar", "Saldos adeudados a proveedores con análisis de antigüedad"],
    ["Cobros del día", "Detalle de cobranzas diarias por zona, útil para vendedores de campo"],
    ["Caja", "Movimientos de caja entre fechas con saldo acumulado"],
    ["Cuotas vencidas", "Cuotas impagas con más de N días de atraso"],
  ],
  [2800, 6560]
));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Pantalla de reportes",
  "Pestañas superiores con los reportes disponibles, filtros laterales (rango de fechas, zona, vendedor), área central con tabla y totales, botones Exportar Excel y Exportar PDF"
));

children.push(H.heading("12.2 Exportación a Excel y PDF", HeadingLevel.HEADING_2));
children.push(H.p("Todos los reportes pueden descargarse en formato Excel (.xlsx) para análisis posterior, o en PDF para archivar e imprimir. Los archivos incluyen cabecera con los datos de la empresa, filtros aplicados y totales."));
children.push(H.callout("tip", "Programar reportes",
  "Aunque el sistema no incluye envío automático por email, los reportes en PDF pueden adjuntarse manualmente a correos para compartir con socios o gerencia."));

children.push(H.pageBreak());

// =================== 13. SEGURIDAD ===================
children.push(H.heading("13. Seguridad", HeadingLevel.HEADING_1));

children.push(H.heading("13.1 Usuarios", HeadingLevel.HEADING_2));
children.push(H.p("Acceda desde Seguridad > Usuarios. Sólo los usuarios con permiso Seguridad > Escribir pueden gestionar este módulo."));
children.push(H.screenshotPlaceholder(
  "Listado de usuarios",
  "Grilla con Código, Nombre, Email, Roles, Estado (Activo/Inactivo), Último acceso, acciones"
));
children.push(H.p("Desde este módulo puede:"));
children.push(H.bullet("Crear nuevos usuarios asignando email, nombre, contraseña inicial y uno o más roles."));
children.push(H.bullet("Editar datos de usuarios existentes y modificar sus roles."));
children.push(H.bullet("Restablecer contraseñas (el usuario deberá iniciar sesión con la nueva y cambiarla)."));
children.push(H.bullet("Activar o desactivar usuarios sin eliminarlos."));
children.push(H.bullet("Eliminar usuarios (borrado lógico que puede revertirse)."));
children.push(H.spacer());
children.push(H.screenshotPlaceholder(
  "Formulario de usuario",
  "Campos: Código, Nombre, Apellido, Email, Contraseña (solo al crear), Teléfono, Estado, Roles (selección múltiple)"
));

children.push(H.heading("13.2 Roles y permisos", HeadingLevel.HEADING_2));
children.push(H.p("Los roles definen qué puede hacer un usuario en el sistema. Cada rol tiene un conjunto de permisos por módulo."));
children.push(H.screenshotPlaceholder(
  "Editor de roles",
  "Formulario con Código, Nombre, marca ¿Es vendedor?, grilla de módulos con 4 columnas de permisos (Leer, Escribir, Eliminar, Ver todo)"
));
children.push(H.p("Los módulos con permisos configurables son:"));
children.push(H.simpleTable(
  ["Módulo", "Descripción"],
  [
    ["dashboard", "Acceso al panel principal"],
    ["clients", "Gestión de clientes"],
    ["suppliers", "Gestión de proveedores"],
    ["products", "Catálogo de productos"],
    ["pricelists", "Listas de precios"],
    ["sales", "Facturas de venta"],
    ["purchases", "Facturas de compra"],
    ["stock", "Inventario y ajustes"],
    ["cash", "Sesiones de caja"],
    ["receivables", "Cuentas por cobrar"],
    ["payables", "Cuentas por pagar"],
    ["reports", "Reportes gerenciales"],
    ["params", "Parametrización del sistema"],
    ["security", "Usuarios y roles"],
  ],
  [2200, 7160]
));
children.push(H.spacer());
children.push(H.p("Cada permiso tiene cuatro acciones:"));
children.push(H.bulletRich([{ text: "Leer: ", bold: true }, { text: "permite ver los registros del módulo." }]));
children.push(H.bulletRich([{ text: "Escribir: ", bold: true }, { text: "permite crear y modificar registros." }]));
children.push(H.bulletRich([{ text: "Eliminar: ", bold: true }, { text: "permite eliminar registros (borrado lógico)." }]));
children.push(H.bulletRich([{ text: "Ver todo: ", bold: true }, { text: "sin esta bandera, el usuario sólo ve registros propios o de su zona (aplica principalmente a vendedores)." }]));

children.push(H.heading("Roles por defecto", HeadingLevel.HEADING_3));
children.push(H.simpleTable(
  ["Rol", "Descripción"],
  [
    ["Administrador", "Acceso total a todos los módulos. Puede administrar usuarios, roles y parámetros"],
    ["Vendedor", "Accede a clientes, productos, ventas, cobranzas y reportes propios. Tiene flag 'Es vendedor' y puede estar asignado a una zona"],
    ["Finanzas", "Accede a ventas, compras, caja, cuentas corrientes y reportes financieros"],
  ],
  [2000, 7360]
));

children.push(H.pageBreak());

// =================== 14. PARAMETRIZACIÓN ===================
children.push(H.heading("14. Parametrización", HeadingLevel.HEADING_1));
children.push(H.p("El módulo Parametrización concentra la configuración maestra del sistema. Las modificaciones aquí impactan transversalmente en toda la aplicación."));

children.push(H.heading("14.1 Configuración general", HeadingLevel.HEADING_2));
children.push(H.p("Datos de la empresa y comportamientos globales del sistema."));
children.push(H.screenshotPlaceholder(
  "Configuración general",
  "Formulario con: Razón Social, CUIT, Dirección, Teléfono, Email, Sitio Web, Logotipo, Moneda, Símbolo, Zona horaria, Permitir stock negativo"
));

children.push(H.heading("14.2 Tipos de cliente", HeadingLevel.HEADING_2));
children.push(H.p("Segmentos comerciales (por ejemplo Empresa, Consumidor Final, Mayorista). Cada tipo puede tener asociada una lista de precios por defecto."));

children.push(H.heading("14.3 Zonas", HeadingLevel.HEADING_2));
children.push(H.p("Territorios comerciales con un vendedor por defecto. Al asignar una zona a un cliente, el vendedor se propone automáticamente en sus facturas."));
children.push(H.screenshotPlaceholder(
  "Parametrización de zonas",
  "Listado con Código, Nombre, Vendedor por defecto, Estado. Formulario para crear/editar"
));

children.push(H.heading("14.4 Condiciones de IVA", HeadingLevel.HEADING_2));
children.push(H.p("Categorías impositivas: Responsable Inscripto, Monotributo, Exento, Consumidor Final. Cada una con su código AFIP y alícuota."));

children.push(H.heading("14.5 Condiciones de pago", HeadingLevel.HEADING_2));
children.push(H.p("Plazos comerciales (Contado, 30 días, 60 días, 90 días, etc.)."));

children.push(H.heading("14.6 Métodos de pago", HeadingLevel.HEADING_2));
children.push(H.p("Formas de cobro y pago: Efectivo, Transferencia, Tarjeta de Débito, Tarjeta de Crédito, Cheque. Cada uno indica si afecta caja."));

children.push(H.heading("14.7 Tipos de comprobante", HeadingLevel.HEADING_2));
children.push(H.p("Facturas A, B, C, X, notas de crédito, remitos. Cada tipo tiene su secuencia numérica independiente."));

children.push(H.heading("14.8 Categorías de productos", HeadingLevel.HEADING_2));
children.push(H.p("Clasificación jerárquica del catálogo. Soporta categorías y subcategorías (anidamiento)."));

children.push(H.heading("14.9 Locaciones de stock", HeadingLevel.HEADING_2));
children.push(H.p("Depósitos, sucursales o puntos de venta donde se gestiona inventario. Soporta múltiples ubicaciones simultáneas."));

children.push(H.pageBreak());

// =================== 15. PERFIL DEL USUARIO ===================
children.push(H.heading("15. Perfil del usuario", HeadingLevel.HEADING_1));
children.push(H.p("Todo usuario autenticado puede ver y modificar sus propios datos desde la opción Mi perfil en el menú superior derecho."));
children.push(H.screenshotPlaceholder(
  "Formulario de perfil",
  "Campos: Nombre, Apellido, Email, Teléfono, Tema preferido (claro/oscuro/sistema). Sección Cambiar contraseña con campos Contraseña actual, Nueva, Repetir nueva"
));
children.push(H.p("Desde esta pantalla puede:"));
children.push(H.bullet("Actualizar su nombre, apellido y teléfono."));
children.push(H.bullet("Cambiar su preferencia de tema (claro, oscuro, sistema)."));
children.push(H.bullet("Cambiar su contraseña."));
children.push(H.spacer());
children.push(H.callout("info", "Email y roles",
  "El email y los roles asignados sólo pueden modificarlos usuarios con permiso de Seguridad, no desde el perfil propio."));

children.push(H.pageBreak());

// =================== 16. GLOSARIO ===================
children.push(H.heading("16. Glosario", HeadingLevel.HEADING_1));
children.push(H.simpleTable(
  ["Término", "Definición"],
  [
    ["AFIP", "Administración Federal de Ingresos Públicos (autoridad fiscal de Argentina)"],
    ["CUIT", "Clave Única de Identificación Tributaria"],
    ["IVA", "Impuesto al Valor Agregado"],
    ["Responsable Inscripto", "Contribuyente registrado en el régimen general del IVA"],
    ["Monotributo", "Régimen simplificado para pequeños contribuyentes"],
    ["Cuenta corriente", "Registro de movimientos entre la empresa y un cliente o proveedor"],
    ["Borrador", "Estado inicial de un comprobante antes de su confirmación"],
    ["Confirmación", "Acción que oficializa un comprobante e impacta stock y saldos"],
    ["Lista de precios", "Conjunto de precios aplicables a un segmento de clientes"],
    ["Plan de cuotas", "División de una factura en pagos fraccionados"],
    ["KPI", "Indicador Clave de Desempeño (Key Performance Indicator)"],
    ["Sesión de caja", "Período entre apertura y cierre durante el cual se registran movimientos de efectivo"],
    ["Antigüedad de deuda", "Clasificación de saldos vencidos según su tiempo de impago"],
    ["Zona", "Territorio comercial con un vendedor asignado"],
  ],
  [2800, 6560]
));

children.push(H.pageBreak());

// =================== 17. PREGUNTAS FRECUENTES ===================
children.push(H.heading("17. Preguntas Frecuentes", HeadingLevel.HEADING_1));

children.push(H.heading("¿Puedo editar una factura ya confirmada?", HeadingLevel.HEADING_3));
children.push(H.p("No. Una factura confirmada queda fija para garantizar la trazabilidad contable. Si detecta un error debe anular la factura y emitir una nueva."));

children.push(H.heading("¿Qué pasa si no hay stock suficiente al facturar?", HeadingLevel.HEADING_3));
children.push(H.p("Depende del parámetro Permitir stock negativo en Configuración general. Si está desactivado, la confirmación fallará. Si está activo, el stock queda negativo y debe ajustarse posteriormente."));

children.push(H.heading("¿Cómo cambio la contraseña de otro usuario?", HeadingLevel.HEADING_3));
children.push(H.p("Como administrador, desde Seguridad > Usuarios haga clic en el usuario y utilice la opción Restablecer contraseña."));

children.push(H.heading("¿Se puede usar el sistema desde un celular?", HeadingLevel.HEADING_3));
children.push(H.p("Sí. La interfaz es responsive y funciona en navegadores móviles, aunque la experiencia óptima es en pantallas medianas o grandes para los módulos de facturación."));

children.push(H.heading("¿Cómo se respalda la información?", HeadingLevel.HEADING_3));
children.push(H.p("El respaldo de la base de datos es responsabilidad del administrador de sistemas. Consulte el Manual Técnico para detalles sobre backup y restauración."));

children.push(H.heading("¿Dónde configuro la empresa emisora (razón social, CUIT)?", HeadingLevel.HEADING_3));
children.push(H.p("En Parametrización > Configuración general. Estos datos aparecerán en todos los comprobantes PDF y reportes."));

children.push(H.heading("¿Puedo tener varios depósitos?", HeadingLevel.HEADING_3));
children.push(H.p("Sí. Desde Parametrización > Locaciones de Stock puede crear tantos depósitos como necesite. El stock se maneja de forma independiente por cada uno y los movimientos indican origen/destino."));

children.push(H.heading("¿Cómo exporto un reporte?", HeadingLevel.HEADING_3));
children.push(H.p("Todos los reportes tienen los botones Exportar Excel y Exportar PDF en la parte superior. Los archivos se descargan directamente."));

children.push(H.pageBreak());

// =================== 18. SOPORTE ===================
children.push(H.heading("18. Soporte y contacto", HeadingLevel.HEADING_1));
children.push(H.p("Para consultas técnicas, reporte de incidencias o solicitudes de nuevas funcionalidades contacte al administrador del sistema o al equipo de TI de su organización."));
children.push(H.p("Incluya en su consulta:"));
children.push(H.bullet("Descripción del problema o consulta."));
children.push(H.bullet("Pantalla donde ocurre (ruta del menú)."));
children.push(H.bullet("Usuario con el que se encontraba."));
children.push(H.bullet("Fecha y hora aproximada del evento."));
children.push(H.bullet("Capturas de pantalla si es posible."));
children.push(H.spacer());
children.push(H.callout("tip", "Consulte el manual técnico",
  "Para integraciones con sistemas externos, conexión mediante API, configuración del servidor o despliegue, consulte el Manual Técnico - API Umbrella ERP."));

// =================== BUILD ===================
const doc = new Document({
  creator: "Umbrella ERP",
  title: "Manual de Usuario - Umbrella ERP",
  description: "Manual completo de usuario del sistema de gestión Umbrella ERP",
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
          children: [new TextRun({ text: "Umbrella ERP — Manual de Usuario", color: H.DARK_GRAY, size: 18 })],
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
  const out = path.join(__dirname, "Manual_de_Usuario_Umbrella_ERP.docx");
  fs.writeFileSync(out, buffer);
  console.log("Manual de Usuario escrito en:", out);
}).catch(err => {
  console.error("Error generando Manual de Usuario:", err);
  process.exit(1);
});
