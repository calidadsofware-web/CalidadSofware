// Capturas del manual de usuario de DataCell (entorno local, datos aislados).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = "http://127.0.0.1:5173";
const OUT = process.argv[2] ?? "/home/claude/w/manual/img";
const PASS = "Local-demo-2026!";
mkdirSync(OUT, { recursive: true });
const plus = (d) => {
  const t = new Date(Date.now() + d * 864e5);
  return t.toISOString().slice(0, 10);
};
const log = [];
const browser = await chromium.launch();

async function session(email, viewport = { width: 1280, height: 1000 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, locale: "es-PE" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASS);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.getByRole("heading", { name: /^Hola,/ }).waitFor();
  return { ctx, page };
}
async function shot(page, name, target) {
  await page.waitForTimeout(350);
  const file = `${OUT}/${name}.png`;
  await page.evaluate(() => document.querySelectorAll(".toast").forEach((t) => (t.style.display = "none")));
  await page.addStyleTag({ content: ".skip-link{display:none!important}" });
  const vp = page.viewportSize();
  const isDialog = target && target !== "main" && (await target.evaluate((el) => el.tagName === "DIALOG"));
  if (isDialog) {
    const h = await target.evaluate((el) => {
      el.style.maxHeight = "none";
      el.style.height = "auto";
      el.style.overflow = "visible";
      return el.scrollHeight;
    });
    await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h + 120) });
    await page.waitForTimeout(300);
    await target.screenshot({ path: file, animations: "disabled" });
    await target.evaluate((el) => el.removeAttribute("style"));
  } else if (target === "main") {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
    await page.waitForTimeout(300);
    await page.screenshot({ path: file, animations: "disabled" });
  } else if (target) await target.screenshot({ path: file, animations: "disabled" });
  else await page.screenshot({ path: file, animations: "disabled" });
  await page.setViewportSize(vp);
  log.push(name);
  console.log("ok", name);
}
const dialog = (page) => page.locator("dialog[open]").last();
async function go(page, label) {
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: label, exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}
async function choose(scope, label, text, option) {
  const box = scope.getByRole("combobox", { name: label });
  await box.click();
  await box.fill(text);
  await scope.getByRole("option", { name: option }).first().click();
}
async function add(group, name, qty) {
  await group.getByLabel("Buscar producto").fill(name);
  await group.getByRole("button", { name: `Agregar ${name}` }).click();
  await group.getByLabel("Buscar producto").fill("");
  if (qty) await group.getByLabel(`Cantidad de ${name}`).fill(String(qty));
}
async function closeModal(page) {
  await dialog(page).getByRole("button", { name: "Cerrar ventana" }).click();
  const discard = page.getByRole("button", { name: "Descartar cambios" });
  if (await discard.isVisible().catch(() => false)) await discard.click();
  await page.waitForTimeout(300);
}

// 1. Inicio de sesión
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.getByRole("button", { name: "Ingresar" }).waitFor();
  await shot(page, "01-login");
  await page.getByLabel("Correo electrónico").fill("caja@local.test");
  await page.getByLabel("Contraseña").fill("clave-equivocada");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.getByRole("alert").waitFor();
  await shot(page, "02-login-error", page.locator(".login-card"));
  await ctx.close();
}

// 2. Cajero: ventas, clientes y reclamos
{
  const { ctx, page } = await session("caja@local.test");
  await shot(page, "03-inicio-cajero");
  await go(page, "Nueva venta");
  await shot(page, "04-venta-vacia");
  await choose(page, /Buscar cliente/, "Maria", /Maria Torres/);
  const productos = page.getByRole("group", { name: "Productos de la venta" });
  await add(productos, "Cargador USB-C 20W");
  await add(productos, "Mica templada 9H");
  await productos.getByLabel("Cantidad de Cargador USB-C 20W").fill("2");
  await productos.getByLabel("Cantidad de Mica templada 9H").fill("999");
  await page.locator(".stock-notice").filter({ hasText: "Stock insuficiente" }).waitFor();
  await shot(page, "05-stock-insuficiente", page.locator(".sale-main section").nth(1));
  await productos.getByLabel("Cantidad de Mica templada 9H").fill("1");
  await page.getByLabel("Efectivo recibido (S/)").fill("100");
  await page.getByLabel("Observación (opcional)").fill("Cliente solicita garantía de 3 meses del cargador.");
  await shot(page, "07-venta-completa", "main");
  await page.getByLabel("Efectivo recibido (S/)").fill("50");
  await page.getByRole("button", { name: "Revisar y cobrar" }).click();
  await page.locator("#sale-form-error").waitFor();
  await shot(page, "06-efectivo-insuficiente", page.getByRole("complementary", { name: "Cobro de la venta" }));
  await page.getByLabel("Efectivo recibido (S/)").fill("100");
  await page.getByRole("button", { name: "Revisar y cobrar" }).click();
  await dialog(page).waitFor();
  await shot(page, "08-confirmar-venta", dialog(page));
  await dialog(page).getByRole("button", { name: "Confirmar venta" }).click();
  await page.locator(".success-notice").waitFor();
  await shot(page, "09-venta-registrada");
  await go(page, "Ventas y pagos");
  await shot(page, "10-ventas-pagos", "main");
  await page.getByRole("button", { name: /^Ver detalle de B001/ }).first().click();
  await dialog(page).waitFor();
  await shot(page, "11-detalle-venta", dialog(page));
  await closeModal(page);
  await go(page, "Clientes");
  await shot(page, "12-clientes");
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  const d = dialog(page);
  await d.getByLabel("Número de documento").fill("72654310");
  await d.getByLabel("Nombres").fill("Rosa");
  await d.getByLabel("Apellidos").fill("Quispe Mamani");
  await d.getByLabel("Teléfono (opcional)").fill("987 654 321");
  await shot(page, "13-nuevo-cliente", d);
  await d.getByRole("button", { name: "Guardar cliente" }).click();
  await d.waitFor({ state: "detached" });
  await go(page, "Reclamos");
  await page.getByRole("button", { name: "Nuevo reclamo" }).click();
  const r = dialog(page);
  await choose(r, /^Cliente/, "Maria", /Maria Torres/);
  await choose(r, /Comprobante relacionado/, "B001", /B001/);
  await r.getByLabel("Motivo").selectOption("Producto defectuoso");
  await r.getByLabel("Prioridad").selectOption("ALTA");
  await r
    .getByLabel("Descripción y solución solicitada")
    .fill("El cargador USB-C 20W no carga el equipo. El cliente solicita el cambio del producto.");
  await shot(page, "14-nuevo-reclamo", r);
  await r.getByRole("button", { name: "Registrar reclamo" }).click();
  await r.waitFor({ state: "detached" });
  await page.waitForTimeout(500);
  await shot(page, "15-reclamos", "main");
  await page.getByRole("button", { name: /^Atender reclamo/ }).first().click();
  const a = dialog(page);
  await a.getByLabel("Seguimiento o solución").fill("Se revisó el cargador y se confirma la falla de fábrica.");
  await shot(page, "16-atender-reclamo", a);
  await a.getByRole("button", { name: "Pasar a revisión" }).click();
  await a.waitFor({ state: "detached" });
  await ctx.close();
}

// 3. Almacén: productos, inventario y solicitudes
let solicitud = "";
{
  const { ctx, page } = await session("almacen@local.test");
  await shot(page, "17-inicio-almacen");
  await go(page, "Productos e inventario");
  await shot(page, "18-productos");
  await page.getByRole("button", { name: "Nuevo producto" }).first().click();
  const p = dialog(page);
  await p.getByLabel("SKU / Código interno").fill("PROD-009");
  await p.getByLabel("Nombre comercial").fill("Funda Galaxy A55 antigolpes");
  await p.getByLabel("Categoría").fill("Fundas");
  await p.getByLabel("Marca").fill("Samsung");
  await p.getByLabel("Costo de compra (S/)").fill("9.50");
  await p.getByLabel("Precio de venta sin IGV (S/)").fill("22.00");
  await p.getByLabel("Stock mínimo").fill("10");
  await p.getByLabel("Stock inicial").fill("30");
  await shot(page, "19-nuevo-producto", p);
  await p.getByRole("button", { name: "Guardar producto" }).click();
  await p.waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Ajustar stock de Power Bank 10000mAh" }).click();
  const aj = dialog(page);
  await aj.getByLabel("Stock contado").fill("6");
  await aj.getByLabel("Motivo del ajuste").fill("Conteo físico: una unidad dañada en vitrina.");
  await shot(page, "20-ajustar-stock", aj);
  await aj.getByRole("button", { name: "Confirmar ajuste" }).click();
  await aj.waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Movimientos de stock" }).click();
  await shot(page, "21-movimientos", "main");
  await go(page, "Solicitudes de compra");
  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  const s = dialog(page);
  await s.getByLabel("Prioridad").selectOption("ALTA");
  await s.getByLabel("Fecha requerida").fill(plus(7));
  await choose(s, /Proveedor sugerido/, "Importaciones", /Importaciones Movil/);
  await s
    .getByLabel("Justificación")
    .fill("Reposición por stock mínimo: Power Bank y mica Galaxy A55 por debajo del umbral.");
  const sp = s.getByRole("group", { name: "Productos para solicitar" });
  await add(sp, "Power Bank 10000mAh");
  await add(sp, "Mica templada Galaxy A55");
  await sp.getByLabel("Cantidad de Power Bank 10000mAh").fill("20");
  await sp.getByLabel("Cantidad de Mica templada Galaxy A55").fill("30");
  await shot(page, "22-nueva-solicitud", s);
  await s.getByRole("button", { name: "Enviar a aprobación" }).click();
  await s.waitFor({ state: "detached" });
  await page.waitForTimeout(500);
  await shot(page, "23-solicitudes", "main");
  solicitud = (await page.getByRole("button", { name: /^Revisar SC-/ }).first().getAttribute("aria-label")).replace("Revisar ", "");
  await ctx.close();
}

// 4. Administrador: aprobación y equipo
{
  const { ctx, page } = await session("admin@local.test");
  await shot(page, "24-inicio-admin");
  await go(page, "Solicitudes de compra");
  await page.getByRole("button", { name: `Revisar ${solicitud}` }).click();
  const d = dialog(page);
  await d.getByLabel("Motivo de la decisión").fill("Aprobada: reposición urgente por stock mínimo.");
  await shot(page, "25-aprobar-solicitud", d);
  await d.getByRole("button", { name: "Confirmar decisión" }).click();
  await d.waitFor({ state: "detached" });
  await go(page, "Equipo y permisos");
  await shot(page, "26-usuarios", "main");
  await page.getByRole("button", { name: "Nuevo usuario" }).click();
  const u = dialog(page);
  await u.getByLabel("Nombres").fill("Ana");
  await u.getByLabel("Apellidos").fill("Ramos Vega");
  await u.getByLabel("Correo de acceso").fill("ana.ramos@datacell.pe");
  await shot(page, "27-nuevo-usuario", u);
  await closeModal(page);
  await ctx.close();
}

// 5. Almacén: recepción de la orden aprobada
{
  const { ctx, page } = await session("almacen@local.test");
  await go(page, "Recepciones");
  const form = page.locator("form.panel");
  await choose(form, /Orden de compra pendiente/, "Importaciones", /Importaciones Movil/);
  await form.getByLabel("Guía / Documento de entrega").fill("T001-00004521");
  await form.getByLabel("Observación de la recepción (opcional)").fill("Entrega parcial: las micas llegan la próxima semana.");
  const g = form.getByRole("group", { name: "Productos pendientes de la orden" });
  await add(g, "Power Bank 10000mAh");
  await g.getByLabel("Cantidad de Power Bank 10000mAh").fill("20");
  await shot(page, "28-recepcion", form);
  await form.getByRole("button", { name: "Registrar recepción" }).click();
  await page.locator(".success-notice").waitFor();
  await page.getByRole("button", { name: "Historial de recepciones" }).click();
  await shot(page, "29-historial-recepciones", "main");
  await ctx.close();
}

// 6. Asistente de compras: proveedores y cotizaciones
{
  const { ctx, page } = await session("compras@local.test");
  await shot(page, "30-inicio-compras");
  await go(page, "Proveedores");
  await shot(page, "31-proveedores", "main");
  await page.getByRole("button", { name: "Nuevo proveedor" }).click();
  const pv = dialog(page);
  await pv.getByLabel("RUC").fill("20601234567");
  await pv.getByLabel("Razón social").fill("Distribuidora Andina de Accesorios S.A.C.");
  await pv.getByLabel("Dirección fiscal").fill("Jr. Paruro 1180, Cercado de Lima");
  await pv.getByLabel("Persona de contacto").fill("Carlos Medina");
  await pv.getByLabel("Teléfono").fill("01 427 5566");
  await pv.getByLabel("Correo comercial").fill("ventas@andina.pe");
  await shot(page, "32-nuevo-proveedor", pv);
  await closeModal(page);
  await go(page, "Cotizaciones");
  await page.getByRole("button", { name: "Nueva solicitud de cotización" }).click();
  const c = dialog(page);
  await c.getByLabel("Fecha límite de respuesta").fill(plus(5));
  await c
    .getByLabel("Condiciones y observaciones")
    .fill("Entrega en tienda, garantía mínima de 6 meses y pago a 30 días.");
  await c.getByRole("checkbox", { name: /Tecnologia Peru/ }).check();
  await c.getByRole("checkbox", { name: /Importaciones Movil/ }).check();
  const cp = c.getByRole("group", { name: "Productos para cotizar" });
  await add(cp, "Audifonos Bluetooth");
  await cp.getByLabel("Cantidad de Audifonos Bluetooth").fill("15");
  await shot(page, "33-nueva-cotizacion", c);
  await c.getByRole("button", { name: "Guardar solicitud" }).click();
  await c.waitFor({ state: "detached" });
  await page.waitForTimeout(500);
  await shot(page, "34-cotizaciones", "main");
  await page.getByRole("button", { name: /^Ver detalle de/ }).first().click();
  await shot(page, "35-detalle-cotizacion", dialog(page));
  await ctx.close();
}

// 7. Vista móvil del menú
{
  const { ctx, page } = await session("caja@local.test", { width: 390, height: 844 });
  await shot(page, "36-movil-inicio");
  await page.getByRole("button", { name: "Menú" }).click();
  await shot(page, "37-movil-menu");
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify({ capturas: log.length, solicitud }));
