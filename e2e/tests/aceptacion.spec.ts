import { expect, test, type Browser, type Locator, type Page, type TestInfo } from "@playwright/test";
import { evidencia, montoDe } from "../utils/evidence";

/**
 * Pruebas de aceptación de usuario (UAT) de DataCell – Evaluación final.
 * Cada escenario recorre un proceso de negocio completo, de punta a punta y con los roles reales,
 * escrito en formato BDD (Dado / Cuando / Entonces). Las comprobaciones usan variaciones (stock antes
 * y después, totales antes y después), por lo que los escenarios no dependen de un estado fijo de la base.
 */

const CLAVE = "Local-demo-2026!";
const CUENTA = {
  cajero: "caja@local.test",
  admin: "admin@local.test",
  almacen: "almacen@local.test",
} as const;

const hoyLima = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
const enDias = (n: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date(Date.now() + n * 86_400_000));
const obtenido = (info: TestInfo, texto: string) =>
  info.annotations.push({ type: "Resultado obtenido", description: texto });

async function sesion(browser: Browser, correo: string) {
  const ctx = await browser.newContext({ locale: "es-PE", timezoneId: "America/Lima", viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill(correo);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  return { ctx, page };
}
const menu = (page: Page) => page.getByRole("navigation", { name: "Navegación principal" });
async function irA(page: Page, opcion: string) {
  await menu(page).getByRole("link", { name: opcion, exact: true }).click();
  await expect(page.locator("main h1").first()).toBeVisible();
}
const dialogo = (page: Page) => page.locator("dialog[open]").last();
async function elegir(ambito: Page | Locator, etiqueta: RegExp, texto: string, opcion: RegExp) {
  const caja = ambito.getByRole("combobox", { name: etiqueta });
  await caja.click();
  await caja.fill(texto);
  await ambito.getByRole("option", { name: opcion }).first().click();
}
async function agregar(grupo: Locator, producto: string, cantidad?: number) {
  await grupo.getByLabel("Buscar producto").fill(producto);
  await grupo.getByRole("button", { name: `Agregar ${producto}` }).click();
  await grupo.getByLabel("Buscar producto").fill("");
  if (cantidad) await grupo.getByLabel(`Cantidad de ${producto}`).fill(String(cantidad));
}
/** Lee el stock de un producto en el catálogo (columna «Stock»). */
async function stockDe(page: Page, producto: string) {
  await irA(page, "Productos e inventario");
  await page.getByRole("searchbox", { name: "Buscar" }).fill(producto);
  const fila = page.getByRole("row").filter({ has: page.getByRole("cell", { name: producto, exact: true }) });
  return Number((await fila.locator("td").nth(4).innerText()).trim());
}
/** Comprobantes y monto del «Resumen del periodo» filtrado por la fecha de hoy. */
async function cierreDeHoy(page: Page) {
  await irA(page, "Ventas y pagos");
  await page.getByLabel("Desde").fill(hoyLima());
  await page.getByLabel("Hasta").fill(hoyLima());
  const resumen = page.getByRole("region", { name: "Resumen del periodo" });
  if (!(await resumen.isVisible().catch(() => false))) return { comprobantes: 0, monto: 0 };
  const valor = (dt: string) => resumen.locator("div").filter({ has: page.locator("dt", { hasText: dt }) }).locator("dd");
  return {
    comprobantes: Number(await valor("Comprobantes").innerText()),
    monto: montoDe(await valor("Monto total cobrado").innerText()),
  };
}

test.describe.configure({ mode: "serial" });

test("AC-01 – Venta con boleta en efectivo y descuento de stock (HU02, HU03)", async ({ browser }, info) => {
  const { ctx, page } = await sesion(browser, CUENTA.cajero);
  let antes = 0;
  await test.step("Dado que el cajero tiene productos con stock y una clienta registrada", async () => {
    antes = await stockDe(page, "Cargador USB-C 20W");
    expect(antes).toBeGreaterThanOrEqual(2);
  });
  await test.step("Cuando vende 2 «Cargador USB-C 20W» y 1 «Mica templada 9H» con boleta y paga S/ 100 en efectivo", async () => {
    await irA(page, "Nueva venta");
    await elegir(page, /Buscar cliente/, "Maria", /Maria Torres/);
    const productos = page.getByRole("group", { name: "Productos de la venta" });
    await agregar(productos, "Cargador USB-C 20W", 2);
    await agregar(productos, "Mica templada 9H", 1);
    await page.getByLabel("Efectivo recibido (S/)").fill("100");
    await page.getByRole("button", { name: "Revisar y cobrar" }).click();
    await expect(dialogo(page)).toContainText("S/ 84.96");
    await expect(dialogo(page)).toContainText("S/ 15.04");
    await evidencia(page, info, "AC-01", "01-confirmacion");
    await dialogo(page).getByRole("button", { name: "Confirmar venta" }).click();
    await expect(page.locator(".success-notice")).toContainText("Venta registrada");
  });
  await test.step("Entonces el total es S/ 84.96 con vuelto S/ 15.04 y el stock del cargador baja en 2", async () => {
    const despues = await stockDe(page, "Cargador USB-C 20W");
    expect(despues).toBe(antes - 2);
    await evidencia(page, info, "AC-01", "02-stock-actualizado");
    obtenido(info, `Venta confirmada por S/ 84.96 con vuelto S/ 15.04; stock del cargador ${antes} → ${despues}.`);
  });
  await ctx.close();
});

test("AC-02 – Factura a un cliente nuevo con RUC y pago con tarjeta (HU02, RF03)", async ({ browser }, info) => {
  const { ctx, page } = await sesion(browser, CUENTA.cajero);
  const ruc = `20${String(Date.now()).slice(-9)}`;
  await test.step("Dado que llega una empresa que no está registrada y pide factura", async () => {
    await irA(page, "Nueva venta");
    await page.getByRole("button", { name: "Nuevo cliente" }).click();
  });
  await test.step("Cuando el cajero la registra con RUC y dirección fiscal y cobra 1 «Audifonos Bluetooth» con tarjeta", async () => {
    const d = dialogo(page);
    await d.getByLabel("Tipo de documento").selectOption("RUC");
    await d.getByLabel("Número de documento").fill(ruc);
    await d.getByLabel("Razón social", { exact: true }).fill("Comercial Andina de Prueba S.A.C.");
    await d.getByLabel("Dirección", { exact: true }).fill("Av. Arequipa 1250, Lince, Lima");
    await d.getByRole("button", { name: "Guardar cliente" }).click();
    await expect(d).toBeHidden();
    await agregar(page.getByRole("group", { name: "Productos de la venta" }), "Audifonos Bluetooth", 1);
    await page.getByLabel("Tipo de comprobante").selectOption("FACTURA");
    await page.getByLabel("Método de pago").selectOption("TARJETA");
    await page.getByLabel(/Número de operación/).fill("VOUCHER-AC02");
    await page.getByRole("button", { name: "Revisar y cobrar" }).click();
    await dialogo(page).getByRole("button", { name: "Confirmar venta" }).click();
    await expect(page.locator(".success-notice")).toContainText("Venta registrada");
  });
  await test.step("Entonces se emite una factura F001 por S/ 53.10 con la referencia del voucher", async () => {
    await irA(page, "Ventas y pagos");
    await page.getByRole("searchbox", { name: "Buscar" }).fill("VOUCHER-AC02");
    const fila = page.getByRole("row").filter({ hasText: "VOUCHER-AC02" });
    await expect(fila).toContainText(/F001-\d{8}/);
    await expect(fila).toContainText("53.10");
    await evidencia(page, info, "AC-02", "01-factura-en-historial");
    obtenido(info, `Cliente RUC ${ruc} registrado; factura ${(await fila.innerText()).match(/F001-\d{8}/)?.[0]} por S/ 53.10 con tarjeta.`);
  });
  await ctx.close();
});

test("AC-03 – Cierre de caja: la venta se refleja en el resumen del día (HU04, RF08)", async ({ browser }, info) => {
  const { ctx, page } = await sesion(browser, CUENTA.cajero);
  let antes = { comprobantes: 0, monto: 0 };
  await test.step("Dado el resumen de ventas del día antes de una nueva venta", async () => {
    antes = await cierreDeHoy(page);
  });
  await test.step("Cuando el cajero vende 1 «Mica templada 9H» (S/ 14.16 con IGV)", async () => {
    await irA(page, "Nueva venta");
    await elegir(page, /Buscar cliente/, "Luis", /Luis Herrera/);
    await agregar(page.getByRole("group", { name: "Productos de la venta" }), "Mica templada 9H", 1);
    await page.getByRole("button", { name: "Importe exacto" }).click();
    await page.getByRole("button", { name: "Revisar y cobrar" }).click();
    await dialogo(page).getByRole("button", { name: "Confirmar venta" }).click();
    await expect(page.locator(".success-notice")).toContainText("Venta registrada");
  });
  await test.step("Entonces el resumen del día suma un comprobante y S/ 14.16 más", async () => {
    const despues = await cierreDeHoy(page);
    expect(despues.comprobantes).toBe(antes.comprobantes + 1);
    expect(despues.monto).toBeCloseTo(antes.monto + 14.16, 2);
    await evidencia(page, info, "AC-03", "01-resumen-del-dia", true);
    obtenido(info, `Comprobantes del día ${antes.comprobantes} → ${despues.comprobantes}; monto S/ ${antes.monto.toFixed(2)} → S/ ${despues.monto.toFixed(2)}.`);
  });
  await ctx.close();
});

test("AC-04 – Reposición completa: solicitud, aprobación y recepción (HU05, HU06, HU09, HU10)", async ({ browser }, info) => {
  const almacen = await sesion(browser, CUENTA.almacen);
  let antes = 0;
  let solicitud = "";
  await test.step("Dado que el encargado de almacén detecta un producto que debe reponer", async () => {
    antes = await stockDe(almacen.page, "Power Bank 10000mAh");
  });
  await test.step("Cuando solicita 12 unidades, el administrador aprueba y almacén registra la recepción completa", async () => {
    const p = almacen.page;
    await irA(p, "Solicitudes de compra");
    await p.getByRole("button", { name: "Nueva solicitud" }).click();
    const s = dialogo(p);
    await s.getByLabel("Prioridad").selectOption("ALTA");
    await s.getByLabel("Fecha requerida").fill(enDias(5));
    await elegir(s, /Proveedor sugerido/, "Importaciones", /Importaciones Movil/);
    await s.getByLabel("Justificación").fill("Prueba de aceptación AC-04: reposición por stock mínimo.");
    await agregar(s.getByRole("group", { name: "Productos para solicitar" }), "Power Bank 10000mAh", 12);
    await s.getByRole("button", { name: "Enviar a aprobación" }).click();
    await expect(s).toBeHidden();
    const boton = p.getByRole("button", { name: /^Revisar SC-/ }).first();
    solicitud = ((await boton.getAttribute("aria-label")) ?? "").replace("Revisar ", "");

    const admin = await sesion(browser, CUENTA.admin);
    await irA(admin.page, "Solicitudes de compra");
    await admin.page.getByRole("button", { name: `Revisar ${solicitud}` }).click();
    const d = dialogo(admin.page);
    await d.getByLabel("Motivo de la decisión").fill("Aprobada en la prueba de aceptación AC-04.");
    await evidencia(admin.page, info, "AC-04", "01-aprobacion");
    await d.getByRole("button", { name: "Confirmar decisión" }).click();
    await expect(d).toBeHidden();
    await admin.ctx.close();

    await irA(p, "Recepciones");
    const form = p.locator("form.panel");
    await elegir(form, /Orden de compra pendiente/, "Importaciones", /Importaciones Movil/);
    await form.getByLabel("Guía / Documento de entrega").fill("T001-AC04");
    await agregar(form.getByRole("group", { name: "Productos pendientes de la orden" }), "Power Bank 10000mAh", 12);
    await form.getByRole("button", { name: "Registrar recepción" }).click();
    await expect(p.locator(".success-notice")).toBeVisible();
  });
  await test.step("Entonces el stock sube en 12 y la solicitud queda «Atendida»", async () => {
    const despues = await stockDe(almacen.page, "Power Bank 10000mAh");
    expect(despues).toBe(antes + 12);
    await irA(almacen.page, "Solicitudes de compra");
    const fila = almacen.page.getByRole("row").filter({ hasText: solicitud });
    await expect(fila).toContainText("Atendida");
    await evidencia(almacen.page, info, "AC-04", "02-solicitud-atendida");
    obtenido(info, `${solicitud} aprobada y recibida; stock Power Bank ${antes} → ${despues}; estado Atendida.`);
  });
  await almacen.ctx.close();
});

test("AC-05 – Producto nuevo de almacén disponible para la venta (HU07, RF01)", async ({ browser }, info) => {
  const sku = `PROD-AC${String(Date.now()).slice(-5)}`;
  const nombre = `Funda Redmi Note 13 ${sku.slice(-5)}`;
  await test.step("Dado que el encargado de almacén registra un producto nuevo con stock inicial 15", async () => {
    const { ctx, page } = await sesion(browser, CUENTA.almacen);
    await irA(page, "Productos e inventario");
    await page.getByRole("button", { name: "Nuevo producto" }).first().click();
    const d = dialogo(page);
    await d.getByLabel("SKU / Código interno").fill(sku);
    await d.getByLabel("Nombre comercial").fill(nombre);
    await d.getByLabel("Categoría").fill("Fundas");
    await d.getByLabel("Marca").fill("Xiaomi");
    await d.getByLabel("Costo de compra (S/)").fill("8.00");
    await d.getByLabel("Precio de venta sin IGV (S/)").fill("20.00");
    await d.getByLabel("Stock mínimo").fill("5");
    await d.getByLabel("Stock inicial").fill("15");
    await d.getByRole("button", { name: "Guardar producto" }).click();
    await expect(d).toBeHidden();
    await ctx.close();
  });
  await test.step("Cuando el cajero lo busca por el modelo de celular en «Nueva venta»", async () => {
    const { ctx, page } = await sesion(browser, CUENTA.cajero);
    await irA(page, "Nueva venta");
    const productos = page.getByRole("group", { name: "Productos de la venta" });
    await productos.getByLabel("Buscar producto").fill("Redmi Note 13");
    await test.step("Entonces aparece con 15 unidades disponibles y precio S/ 20.00 sin IGV", async () => {
      const tarjeta = productos.locator("article, li, div").filter({ hasText: nombre }).last();
      await expect(tarjeta).toContainText("15 disponibles");
      await expect(tarjeta).toContainText("20.00");
      await evidencia(page, info, "AC-05", "01-producto-en-venta");
      obtenido(info, `${nombre} (${sku}) visible en Nueva venta con 15 disponibles a S/ 20.00 sin IGV.`);
    });
    await ctx.close();
  });
});

test("AC-06 – Acceso restringido por rol (HU11, RF10)", async ({ browser }, info) => {
  const { ctx, page } = await sesion(browser, CUENTA.cajero);
  await test.step("Dado que un cajero inició sesión", async () => {
    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
  });
  await test.step("Cuando revisa el menú e intenta abrir por URL «Equipo y permisos» y «Recepciones»", async () => {
    for (const opcion of ["Equipo y permisos", "Recepciones", "Solicitudes de compra", "Proveedores", "Cotizaciones"])
      await expect(menu(page).getByRole("link", { name: opcion, exact: true })).toHaveCount(0);
    await page.goto("/usuarios");
  });
  await test.step("Entonces el sistema no muestra esos módulos y lo redirige al inicio", async () => {
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/recepciones/nueva");
    await expect(page).toHaveURL(/\/$/);
    // El servidor también rechaza la operación aunque se invoque directamente la API.
    const api = await page.evaluate(async () => {
      const res = await fetch("/api/datacell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register-receipt", payload: {} }),
      });
      return { status: res.status, body: (await res.json()) as { message?: string } };
    });
    expect(api.status).toBe(403);
    await evidencia(page, info, "AC-06", "01-menu-cajero");
    obtenido(info, `Menú sin módulos de abastecimiento ni administración; /usuarios y /recepciones/nueva redirigen al inicio; la API responde ${api.status} «${api.body.message}».`);
  });
  await ctx.close();
});
