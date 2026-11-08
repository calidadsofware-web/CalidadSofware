import { expect, test, type Browser, type Page, type TestInfo } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PaymentsPage } from "../pages/PaymentsPage";
import { SalePage } from "../pages/SalePage";
import { evidencia, montoDe } from "../utils/evidence";

/**
 * Plan de pruebas PP-DC-01: 23 casos (CP01–CP23), uno por criterio de aceptación.
 * Los casos comparten la base local (PGlite con la semilla de supabase/schema.sql) y se ejecutan en orden:
 * cada uno deja el estado que necesita el siguiente (por ejemplo CP05 → CP06 o CP11 → CP17 → CP20).
 */

const CLAVE = "Local-demo-2026!";
const CUENTAS = {
  cajero: "caja@local.test",
  admin: "admin@local.test",
  almacen: "almacen@local.test",
} as const;

const fechaLima = (diasAtras = 0) => {
  const d = new Date(Date.now() - diasAtras * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(d); // YYYY-MM-DD
};

const obtenido = (info: TestInfo, texto: string) => info.annotations.push({ type: "Resultado obtenido", description: texto });

async function ingresar(page: Page, correo: string) {
  const login = new LoginPage(page);
  await login.abrir();
  await login.ingresarCredenciales(correo, CLAVE);
  await login.enviar();
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
}

const menu = (page: Page) => page.getByRole("navigation", { name: "Navegación principal" });
async function irA(page: Page, opcion: string) {
  await menu(page).getByRole("link", { name: opcion, exact: true }).click();
  await expect(page.locator("main h1").first()).toBeVisible();
}

async function nuevaSesion(browser: Browser, correo: string) {
  const ctx = await browser.newContext({ locale: "es-PE", timezoneId: "America/Lima", viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await ingresar(page, correo);
  return { ctx, page };
}

async function venderEfectivoExacto(page: Page, cliente: [string, string], producto: [string, string], cantidad: number) {
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  await sale.seleccionarCliente(...cliente);
  await sale.agregarProducto(producto[0], producto[1], cantidad);
  await sale.tipoComprobante.selectOption("BOLETA");
  await sale.metodoPago.selectOption("EFECTIVO");
  await page.getByRole("button", { name: "Importe exacto" }).click();
  await sale.revisarYCobrar.click();
  await sale.modalConfirmacion.getByRole("button", { name: "Confirmar venta" }).click();
  await expect(sale.avisoExito).toBeVisible();
}

/** Stock que muestra el catálogo de «Productos e inventario» para un SKU. */
async function stockCatalogo(page: Page, sku: string) {
  const panel = page.locator('section[aria-label="Catálogo de productos"]');
  await panel.getByRole("searchbox").fill(sku);
  const fila = panel.locator("tbody tr").filter({ hasText: sku });
  await expect(fila).toHaveCount(1);
  return Number((await fila.locator("td").nth(4).innerText()).trim());
}

/* ----------------------------------------------------------------------------- HU11 – Autenticación */
test("CP21 - Login válido según rol", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const nav = menu(page);
  await expect(page.locator(".sidebar-profile")).toContainText("Cajero");
  await expect(nav.getByRole("link", { name: "Nueva venta" })).toBeVisible();
  for (const oculto of ["Solicitudes de compra", "Cotizaciones", "Equipo y permisos"])
    await expect(nav.getByRole("link", { name: oculto })).toHaveCount(0);
  await evidencia(page, info, "CP21", "01-inicio-cajero");
  obtenido(info, "El cajero ingresa a su interfaz; el menú muestra «Nueva venta» y no muestra Solicitudes de compra, Cotizaciones ni Equipo y permisos.");
});

test("CP22 - Login con credenciales inválidas", async ({ page }, info) => {
  const login = new LoginPage(page);
  await login.abrir();
  await login.ingresarCredenciales(CUENTAS.cajero, "ClaveIncorrecta-123");
  await login.enviar();
  await expect(login.error).toHaveText("Correo o contraseña incorrectos.");
  await expect(menu(page)).toHaveCount(0);
  await evidencia(page, info, "CP22", "01-mensaje-generico");
  obtenido(info, "Acceso denegado con el mensaje genérico «Correo o contraseña incorrectos.».");
});

/* ----------------------------------------------------------------------------- HU01 – Búsqueda */
test("CP01 - Búsqueda de producto con resultados", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  await sale.buscarProducto.fill("iPhone 14");
  const tarjeta = sale.tarjetaProducto("Funda iPhone 14");
  await expect(tarjeta).toContainText("PROD-001");
  await expect(tarjeta).toContainText("120 disponibles");
  await evidencia(page, info, "CP01", "01-resultado-iphone14");
  obtenido(info, "Se lista «Funda iPhone 14» (PROD-001) con 120 disponibles.");
});

test("CP02 - Búsqueda de producto sin resultados", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  await sale.buscarProducto.fill("Nokia 3310");
  await expect(page.locator("article.catalog-product")).toHaveCount(0);
  const msg = page.getByText("No hay productos que coincidan con la búsqueda o el saldo disponible.");
  await expect(msg).toBeVisible();
  await evidencia(page, info, "CP02", "01-sin-resultados");
  obtenido(info, "Lista vacía y mensaje «No hay productos que coincidan con la búsqueda o el saldo disponible.».");
});

/* ----------------------------------------------------------------------------- HU07 – Catálogo */
test("CP13 - Registrar producto nuevo", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  await irA(page, "Productos e inventario");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  const modal = page.getByRole("dialog", { name: "Nuevo producto" });
  await modal.getByLabel("SKU / Código interno").fill("PROD-009");
  await modal.getByLabel("Nombre comercial").fill("Funda Galaxy A55");
  await modal.getByLabel("Categoría").fill("Fundas");
  await modal.getByLabel("Marca").fill("Samsung");
  await modal.getByLabel("Descripción y compatibilidad (opcional)").fill("Compatible con Samsung Galaxy A55");
  await modal.getByLabel("Costo de compra (S/)").fill("12");
  await modal.getByLabel("Precio de venta sin IGV (S/)").fill("25");
  await modal.getByLabel("Stock mínimo").fill("5");
  await modal.getByLabel("Stock inicial").fill("30");
  await evidencia(page, info, "CP13", "01-formulario");
  await modal.getByRole("button", { name: /Guardar/ }).click();
  await expect(modal).toHaveCount(0);
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  await sale.buscarProducto.fill("Galaxy A55");
  await expect(sale.tarjetaProducto("Funda Galaxy A55")).toContainText("30 disponibles");
  await evidencia(page, info, "CP13", "02-disponible-en-venta");
  obtenido(info, "PROD-009 «Funda Galaxy A55» se guardó y aparece en la búsqueda de ventas con 30 disponibles.");
});

test("CP14 - Editar precio de producto", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  await irA(page, "Productos e inventario");
  const panel = page.locator('section[aria-label="Catálogo de productos"]');
  await panel.getByRole("searchbox").fill("PROD-001");
  await page.getByRole("button", { name: "Editar Funda iPhone 14" }).click();
  const modal = page.getByRole("dialog", { name: "Editar producto" });
  await modal.getByLabel("Precio de venta sin IGV (S/)").fill("27");
  await modal.getByRole("button", { name: /Guardar/ }).click();
  await expect(modal).toHaveCount(0);
  const fila = panel.locator("tbody tr").filter({ hasText: "PROD-001" });
  await expect(fila).toContainText("27.00");
  await evidencia(page, info, "CP14", "01-precio-actualizado");
  obtenido(info, "El catálogo muestra el nuevo precio de PROD-001: S/ 27.00 sin IGV.");
});

/* ----------------------------------------------------------------------------- HU03 – Stock */
test("CP05 - Descuento automático de stock al vender", async ({ page, browser }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  const antes = await sale.stockDisponible("PROD-004", "Mica templada 9H");
  await venderEfectivoExacto(page, ["45678912", "Maria Torres"], ["PROD-004", "Mica templada 9H"], 3);
  const despues = await sale.stockDisponible("PROD-004", "Mica templada 9H");
  expect(despues).toBe(antes - 3);
  await evidencia(page, info, "CP05", "01-stock-en-venta");
  const { ctx, page: admin } = await nuevaSesion(browser, CUENTAS.admin);
  await irA(admin, "Productos e inventario");
  await admin.getByRole("button", { name: "Movimientos de stock" }).click();
  const mov = admin.locator('section[aria-label="Movimientos de inventario"] tbody tr').filter({ hasText: "Mica templada 9H" }).first();
  await expect(mov).toContainText(/Venta/i);
  await expect(mov).toContainText(String(despues));
  await evidencia(admin, info, "CP05", "02-movimiento-venta");
  await ctx.close();
  obtenido(info, `Stock de PROD-004: ${antes} → ${despues}; se registró el movimiento de inventario tipo Venta.`);
});

test("CP06 - Inventario actualizado sin recarga manual", async ({ page, browser }, info) => {
  const { ctx, page: admin } = await nuevaSesion(browser, CUENTAS.admin);
  await irA(admin, "Productos e inventario");
  const antes = await stockCatalogo(admin, "PROD-004");
  await ingresar(page, CUENTAS.cajero);
  await venderEfectivoExacto(page, ["45678912", "Maria Torres"], ["PROD-004", "Mica templada 9H"], 3);
  await irA(admin, "Inicio");
  await irA(admin, "Productos e inventario");
  const visto = await stockCatalogo(admin, "PROD-004");
  await evidencia(admin, info, "CP06", "01-inventario-admin");
  obtenido(info, `El cajero vendió 3 unidades. Sin pulsar «Actualizar», el administrador ve ${visto} unidades de PROD-004 (antes ${antes}, esperado ${antes - 3}).`);
  await ctx.close();
  expect(visto).toBe(antes - 3);
});

/* ----------------------------------------------------------------------------- HU02 – Venta */
test("CP03 - Cálculo de subtotal, IGV y total de la venta", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  await sale.seleccionarCliente("70011223", "Camila Rojas");
  await sale.agregarProducto("PROD-002", "Cargador USB-C 20W", 2);
  await sale.agregarProducto("PROD-004", "Mica templada 9H", 1);
  await sale.tipoComprobante.selectOption("BOLETA");
  await sale.metodoPago.selectOption("EFECTIVO");
  await sale.efectivo.fill("100");
  await sale.revisarYCobrar.click();
  await expect(sale.modalConfirmacion).toBeVisible();
  const m = sale.modalConfirmacion;
  const [sub, igv, tot] = await Promise.all(
    (["Subtotal", "IGV (18%)", "Total a cobrar"] as const).map(async (c) => montoDe(await sale.valorResumen(c, m).first().innerText())),
  );
  await evidencia(page, info, "CP03", "01-modal-totales");
  expect([sub, igv, tot]).toEqual([72, 12.96, 84.96]);
  await m.getByRole("button", { name: "Confirmar venta" }).click();
  await expect(sale.avisoExito).toBeVisible();
  obtenido(info, `Subtotal S/ ${sub.toFixed(2)}, IGV S/ ${igv.toFixed(2)}, total S/ ${tot.toFixed(2)}; la venta se registró.`);
});

test("CP04 - Venta con cantidad mayor al stock", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  await sale.seleccionarCliente("43098765", "Jorge Salas");
  const cantidad = await sale.agregarProducto("PROD-005", "Power Bank 10000mAh", 1);
  await cantidad.fill("8");
  await cantidad.blur();
  await page.waitForTimeout(400);
  const valor = await cantidad.inputValue();
  const aviso = page.locator("main").getByText(/stock insuficiente/i);
  const hayAviso = (await aviso.count()) > 0 && (await aviso.first().isVisible());
  await evidencia(page, info, "CP04", "01-cantidad-solicitada-8");
  obtenido(
    info,
    hayAviso
      ? `Se solicitaron 8 unidades (stock 7): la cantidad queda en ${valor} y se muestra «${(await aviso.first().innerText()).trim()}».`
      : `Se solicitaron 8 unidades (stock 7): la cantidad se ajustó a ${valor} sin mostrar un mensaje de stock insuficiente.`,
  );
  expect(Number(valor)).toBeLessThanOrEqual(7);
  expect(hayAviso, "Debe mostrarse un mensaje de stock insuficiente").toBe(true);
});

test("CP23 - Venta con efectivo insuficiente", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const sale = new SalePage(page);
  await sale.abrirDesdeMenu();
  await sale.seleccionarCliente("71234567", "Luis Herrera");
  await sale.agregarProducto("PROD-003", "Audifonos Bluetooth", 1);
  await sale.metodoPago.selectOption("EFECTIVO");
  await sale.efectivo.fill("10");
  await sale.revisarYCobrar.click();
  await page.waitForTimeout(400);
  const nativo = await sale.efectivo.evaluate((e: HTMLInputElement) => e.validationMessage);
  const mensaje = page.locator("main").getByText("El efectivo recibido no cubre el total.");
  const visible = (await mensaje.count()) > 0 && (await mensaje.first().isVisible());
  await expect(sale.modalConfirmacion).toHaveCount(0);
  await evidencia(page, info, "CP23", "01-venta-bloqueada");
  obtenido(
    info,
    visible
      ? "La venta se impide y se muestra el mensaje «El efectivo recibido no cubre el total.» en la página."
      : `La venta se bloquea, pero solo con el aviso nativo del navegador: «${nativo}».`,
  );
  expect(visible, "Debe mostrarse el mensaje de negocio en la página").toBe(true);
});

/* ----------------------------------------------------------------------------- HU04 – Historial */
test("CP07 - Historial de ventas del día", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  const pagos = new PaymentsPage(page);
  await irA(page, "Ventas y pagos");
  const hoy = fechaLima();
  await page.getByLabel("Desde").fill(hoy);
  await page.getByLabel("Hasta").fill(hoy);
  const filas = pagos.filas();
  await expect(filas.first()).toBeVisible();
  const n = await filas.count();
  const fechas = await filas.locator("td:nth-child(3)").allInnerTexts();
  await evidencia(page, info, "CP07", "01-historial-hoy");
  const conHora = fechas.every((f) => /\d{2}:\d{2}/.test(f));
  obtenido(info, `Se listan ${n} ventas del día; la columna Fecha muestra «${fechas[0].trim()}»${conHora ? " (con hora)" : " (sin hora)"}.`);
  expect(conHora, "Cada venta debe mostrar fecha y hora").toBe(true);
});

test("CP08 - Historial sin ventas en la fecha", async ({ page }, info) => {
  await ingresar(page, CUENTAS.cajero);
  await irA(page, "Ventas y pagos");
  const dia = fechaLima(10);
  await page.getByLabel("Desde").fill(dia);
  await page.getByLabel("Hasta").fill(dia);
  await expect(page.getByText("No hay información para mostrar.")).toBeVisible();
  await evidencia(page, info, "CP08", "01-sin-ventas");
  obtenido(info, `Para el ${dia} se muestra «No hay información para mostrar.».`);
});

/* ----------------------------------------------------------------------------- HU08 – Reportes */
test("CP15 - Reporte de ventas por rango de fechas", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  await irA(page, "Ventas y pagos");
  await page.getByLabel("Desde").fill(fechaLima(1));
  await page.getByLabel("Hasta").fill(fechaLima());
  const n = await new PaymentsPage(page).filas().count();
  const resumen = page.getByRole("region", { name: "Resumen del periodo" });
  const hay = (await resumen.count()) > 0;
  await evidencia(page, info, "CP15", "01-ventas-rango", true);
  if (hay) {
    await expect(resumen).toContainText(/Monto total/i);
    await expect(resumen.locator("tbody tr").first()).toBeVisible();
    obtenido(info, `Se muestran ${n} comprobantes y el resumen del periodo: ${(await resumen.innerText()).replace(/\s+/g, " ").slice(0, 160)}…`);
  } else {
    obtenido(info, `El historial filtra ${n} comprobantes del rango, pero no muestra un resumen con productos vendidos, cantidades y monto total.`);
  }
  expect(hay, "Debe mostrarse el resumen del periodo").toBe(true);
});

test("CP16 - Reporte de inventario", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  await irA(page, "Productos e inventario");
  const panel = page.locator('section[aria-label="Catálogo de productos"]');
  const texto = await panel.innerText();
  const total = Number(/(\d+) de (\d+) registros/.exec(texto)?.[2] ?? (await panel.locator("tbody tr").count()));
  await evidencia(page, info, "CP16", "01-catalogo", true);
  expect(total).toBe(9);
  obtenido(info, `El catálogo lista los ${total} productos registrados con stock, precio y disponibilidad.`);
});

/* ----------------------------------------------------------------------------- HU05 – Alertas */
async function alertas(page: Page) {
  const panel = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "Revisar existencias" }) });
  await expect(panel).toBeVisible();
  return (await panel.locator("li").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
}

test("CP09 - Alerta de stock mínimo", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  const lista = [...new Set(await alertas(page))];
  await evidencia(page, info, "CP09", "01-panel-alertas");
  expect(lista.some((t) => t.includes("PROD-005"))).toBe(true);
  expect(lista.some((t) => t.includes("PROD-008"))).toBe(true);
  obtenido(info, `El panel «Revisar existencias» muestra: ${lista.join(" · ")}.`);
});

test("CP10 - Orden de las alertas por urgencia", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  const lista = [...new Set(await alertas(page))];
  await evidencia(page, info, "CP10", "01-orden-alertas");
  obtenido(info, `Orden mostrado: ${lista.map((t) => /PROD-\d+/.exec(t)?.[0]).join(" → ")}.`);
  expect(lista[0]).toContain("PROD-005");
});

/* ----------------------------------------------------------------------------- HU06 / HU10 – Compras */
/** Solicitud creada en CP11: la más reciente del seguimiento (la consulta ordena por fecha descendente). */
async function ultimaSolicitud(page: Page) {
  const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').first();
  await expect(fila).toBeVisible();
  return (await fila.locator("td").first().innerText()).trim();
}

test("CP11 - Crear solicitud de compra", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  await irA(page, "Solicitudes de compra");
  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  const modal = page.getByRole("dialog", { name: "Nueva solicitud de compra" });
  await modal.getByLabel("Prioridad").selectOption("ALTA");
  await modal.getByLabel("Fecha requerida").fill(new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10));
  const prov = modal.getByRole("combobox", { name: /Proveedor sugerido/ });
  await prov.click();
  await prov.fill("20123456789");
  await page.getByRole("option", { name: /Tecnologia Peru/ }).click();
  await modal.getByLabel("Justificación").fill("Reposición por stock mínimo de Power Bank 10000mAh");
  await modal.getByRole("group", { name: "Productos para solicitar" }).getByRole("searchbox").fill("PROD-005");
  await modal.getByRole("button", { name: "Agregar Power Bank 10000mAh" }).click();
  await modal.getByRole("spinbutton", { name: "Cantidad de Power Bank 10000mAh" }).fill("20");
  await evidencia(page, info, "CP11", "01-formulario");
  await modal.getByRole("button", { name: "Enviar a aprobación" }).click();
  await expect(modal).toHaveCount(0);
  const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').first();
  const solicitud = await ultimaSolicitud(page);
  await fila.getByRole("button", { name: /^Revisar / }).click();
  const det = page.getByRole("dialog", { name: solicitud });
  await expect(det).toContainText("Power Bank 10000mAh");
  await expect(det).toContainText("20");
  await expect(det).toContainText("Tecnologia Peru");
  await evidencia(page, info, "CP11", "02-detalle");
  obtenido(info, `Se registró ${solicitud} con PROD-005 × 20 y proveedor Tecnologia Peru S.A.C.`);
});

test("CP12 - Estado de la solicitud de compra", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  await irA(page, "Solicitudes de compra");
  const solicitud = await ultimaSolicitud(page);
  const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').filter({ hasText: solicitud });
  await expect(fila).toContainText("Pendiente");
  await evidencia(page, info, "CP12", "01-estado-pendiente");
  obtenido(info, `${solicitud} figura con estado «Pendiente».`);
});

test("CP19 - Encargado de almacén visualiza solicitudes", async ({ page }, info) => {
  await ingresar(page, CUENTAS.almacen);
  await irA(page, "Solicitudes de compra");
  const solicitud = await ultimaSolicitud(page);
  const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').filter({ hasText: solicitud });
  await fila.getByRole("button", { name: /^Revisar / }).click();
  const det = page.getByRole("dialog", { name: solicitud });
  await expect(det).toContainText("Power Bank 10000mAh");
  await expect(det).toContainText("Fecha requerida");
  await expect(det.getByRole("button", { name: "Confirmar decisión" })).toHaveCount(0);
  await evidencia(page, info, "CP19", "01-detalle-almacen");
  obtenido(info, "El encargado de almacén ve la solicitud con producto, cantidad y fecha requerida, sin opción de aprobar.");
});

/* ----------------------------------------------------------------------------- HU09 – Recepción */
test("CP17 - Recepción de mercadería suma stock", async ({ page, browser }, info) => {
  // Precondición: el administrador aprueba la solicitud de CP11 y se genera la orden de compra.
  const { ctx, page: admin } = await nuevaSesion(browser, CUENTAS.admin);
  await irA(admin, "Solicitudes de compra");
  const solicitud = await ultimaSolicitud(admin);
  await admin.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').filter({ hasText: solicitud }).getByRole("button", { name: /^Revisar / }).click();
  const det = admin.getByRole("dialog", { name: solicitud });
  await det.locator("fieldset select").first().selectOption("APROBADA");
  const prov = det.getByRole("combobox", { name: /Proveedor de la orden/ });
  if (!(await prov.inputValue())) {
    await prov.click();
    await prov.fill("20123456789");
    await admin.getByRole("option", { name: /Tecnologia Peru/ }).click();
  }
  await det.getByLabel("Motivo de la decisión").fill("Aprobada por stock mínimo");
  await det.getByRole("button", { name: "Confirmar decisión" }).click();
  await expect(det).toHaveCount(0);
  await ctx.close();

  await ingresar(page, CUENTAS.almacen);
  await irA(page, "Recepciones");
  const orden = page.getByRole("combobox", { name: /Orden de compra pendiente/ });
  await orden.click();
  await orden.fill("Tecnologia");
  const opcion = page.getByRole("option", { name: /Tecnologia Peru/ }).first();
  const numeroOrden = (/OC-\d{4}-\d{4}/.exec(await opcion.innerText()) ?? [""])[0];
  await opcion.click();
  await page.getByLabel("Guía / Documento de entrega").fill("T001-00009001");
  await page.getByRole("group", { name: "Productos pendientes de la orden" }).getByRole("searchbox").fill("PROD-005");
  await page.getByRole("button", { name: "Agregar Power Bank 10000mAh" }).click();
  await page.getByRole("spinbutton", { name: "Cantidad de Power Bank 10000mAh" }).fill("20");
  await evidencia(page, info, "CP17", "01-recepcion");
  await page.getByRole("button", { name: "Registrar recepción" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Recepción registrada" })).toBeVisible();
  await irA(page, "Productos e inventario");
  const stock = await stockCatalogo(page, "PROD-005");
  await evidencia(page, info, "CP17", "02-stock-actualizado");
  expect(stock).toBe(27);
  await irA(page, "Inicio");
  const sigue = (await alertas(page)).some((t) => t.includes("PROD-005"));
  expect(sigue).toBe(false);
  obtenido(info, `Recepción registrada para ${numeroOrden || "la orden"} con guía T001-00009001: stock de PROD-005 7 → ${stock}; la alerta de stock mínimo desaparece.`);
});

test("CP18 - Recepción con datos incompletos", async ({ page }, info) => {
  await ingresar(page, CUENTAS.almacen);
  await irA(page, "Recepciones");
  const orden = page.getByRole("combobox", { name: /Orden de compra pendiente/ });
  await orden.click();
  await orden.fill("OC-2026-0006");
  await page.getByRole("option", { name: /OC-2026-0006/ }).click();
  const registrar = page.getByRole("button", { name: "Registrar recepción" });
  await expect(registrar).toBeDisabled();
  await page.getByRole("group", { name: "Productos pendientes de la orden" }).getByRole("searchbox").fill("PROD-002");
  await page.getByRole("button", { name: "Agregar Cargador USB-C 20W" }).click();
  await registrar.click();
  const guia = page.getByLabel("Guía / Documento de entrega");
  const msg = await guia.evaluate((e: HTMLInputElement) => e.validationMessage);
  await expect(page.getByRole("status").filter({ hasText: "Recepción registrada" })).toHaveCount(0);
  await evidencia(page, info, "CP18", "01-guia-obligatoria");
  expect(msg).not.toBe("");
  obtenido(info, `Sin productos el botón está deshabilitado; sin guía se impide el registro y se solicita completarla («${msg}»).`);
});

test("CP20 - Solicitud atendida al completar la recepción", async ({ page }, info) => {
  await ingresar(page, CUENTAS.admin);
  await irA(page, "Solicitudes de compra");
  const solicitud = await ultimaSolicitud(page);
  const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').filter({ hasText: solicitud });
  await expect(fila).toContainText("Atendida");
  await evidencia(page, info, "CP20", "01-estado-atendida");
  obtenido(info, `Al recibir las 20 unidades, ${solicitud} cambió a «Atendida».`);
});
