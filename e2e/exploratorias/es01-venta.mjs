// ES-01 · Sesión exploratoria: registro de ventas con datos límite e inusuales.
// Misión: descubrir errores de cálculo, validación o consistencia al vender y cobrar.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "exploratorias/ES-01";
mkdirSync(OUT, { recursive: true });
const URL = "http://127.0.0.1:5173";
const notas = [];
const nota = (id, idea, observado) => {
  notas.push({ id, idea, observado });
  console.log(id, "|", idea, "|", observado);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-PE", timezoneId: "America/Lima" });
const page = await ctx.newPage();
await page.goto(URL);
await page.getByLabel("Correo electrónico").fill("caja@local.test");
await page.getByLabel("Contraseña").fill("Local-demo-2026!");
await page.getByRole("button", { name: "Ingresar" }).click();
await page.getByRole("heading", { name: /^Hola,/ }).waitFor();
const api = (action, payload) =>
  page.evaluate(
    async ([action, payload]) => {
      const r = await fetch("/api/datacell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      return { status: r.status, body: await r.json() };
    },
    [action, payload],
  );
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const grupo = () => page.getByRole("group", { name: "Productos de la venta" });
async function nuevaVenta() {
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Nueva venta", exact: true }).click();
  await page.locator("main h1").first().waitFor();
}
async function agregar(nombre) {
  await grupo().getByLabel("Buscar producto").fill(nombre);
  await grupo().getByRole("button", { name: `Agregar ${nombre}` }).click();
  await grupo().getByLabel("Buscar producto").fill("");
}
async function cliente(t, o) {
  const c = page.getByRole("combobox", { name: /Buscar cliente/ });
  await c.click();
  await c.fill(t);
  await page.getByRole("option", { name: o }).first().click();
}

// 1. Cantidades no válidas en la interfaz
await nuevaVenta();
await cliente("Jorge", /Jorge Salas/);
await agregar("Funda iPhone 14");
const cant = grupo().getByLabel("Cantidad de Funda iPhone 14");
for (const v of ["0", "-3", "2.5", ""]) {
  await cant.fill(v);
  await page.waitForTimeout(250);
  const valor = await cant.inputValue();
  const total = await page.getByRole("complementary", { name: "Cobro de la venta" }).innerText();
  nota("ES01-1", `Cantidad «${v}» en la línea de venta`, `El campo queda en «${valor}»; total: ${total.match(/Total a cobrar\s*S\/\s*[\d.,]+/)?.[0] ?? "?"}`);
}
await cant.fill("0");
await page.getByRole("button", { name: "Revisar y cobrar" }).click();
await page.waitForTimeout(500);
const dlg0 = await page.locator("dialog[open]").count();
const err0 = await page.locator("#sale-form-error, [role=alert]").allInnerTexts();
nota("ES01-2", "Cobrar con cantidad 0", `¿Abre confirmación?: ${dlg0 ? "sí" : "no"}; mensajes: ${err0.join(" / ") || "ninguno"}`);
await shot("01-cantidad-cero");
if (dlg0) await page.locator("dialog[open]").getByRole("button", { name: "Cerrar" }).click();

// 2. API: cantidades y montos manipulados (lo que la interfaz no deja enviar)
for (const [desc, items, extra] of [
  ["cantidad negativa", [{ code: "PROD-001", quantity: -2 }], {}],
  ["cantidad decimal", [{ code: "PROD-001", quantity: 1.5 }], {}],
  ["cantidad cero", [{ code: "PROD-001", quantity: 0 }], {}],
  ["producto repetido en dos líneas", [{ code: "PROD-004", quantity: 1 }, { code: "PROD-004", quantity: 1 }], {}],
  ["efectivo negativo", [{ code: "PROD-004", quantity: 1 }], { cashReceived: -50 }],
  ["efectivo como texto", [{ code: "PROD-004", quantity: 1 }], { cashReceived: "cien" }],
  ["método de pago inexistente", [{ code: "PROD-004", quantity: 1 }], { paymentMethod: "BITCOIN", reference: "X" }],
]) {
  const r = await api("register-sale", { clientName: "Jorge Salas", paymentMethod: "EFECTIVO", items, ...extra });
  nota("ES01-3", `API register-sale con ${desc}`, `HTTP ${r.status}: ${r.body.message ?? JSON.stringify(r.body).slice(0, 120)}`);
}

// 3. Doble clic en «Confirmar venta»
await nuevaVenta();
await cliente("Camila", /Camila Rojas/);
await agregar("Mica templada 9H");
await page.getByRole("button", { name: "Importe exacto" }).click();
await page.getByRole("button", { name: "Revisar y cobrar" }).click();
const pagosAntes = await page.evaluate(async () => (await (await fetch("/api/datacell?bootstrap=1")).json()).data.appData.payments.length);
const confirmar = page.locator("dialog[open]").getByRole("button", { name: "Confirmar venta" });
await confirmar.dblclick({ delay: 30 }).catch(() => {});
await page.waitForTimeout(1500);
const pagosDespues = await page.evaluate(async () => (await (await fetch("/api/datacell?bootstrap=1")).json()).data.appData.payments.length);
nota("ES01-4", "Doble clic en «Confirmar venta»", `Comprobantes antes ${pagosAntes}, después ${pagosDespues} (se registraron ${pagosDespues - pagosAntes}).`);
await shot("02-doble-clic");

// 4. Venta concurrente del último stock desde dos pestañas
const prods = await page.evaluate(async () => (await (await fetch("/api/datacell?bootstrap=1")).json()).data.appData.products);
const pb = prods.find((p) => p.name === "Funda Galaxy S23") ?? prods[0];
const stock = pb.stock;
const res = await Promise.all([
  api("register-sale", { clientName: "Jorge Salas", paymentMethod: "EFECTIVO", items: [{ code: pb.code, quantity: stock }] }),
  api("register-sale", { clientName: "Jorge Salas", paymentMethod: "EFECTIVO", items: [{ code: pb.code, quantity: stock }] }),
]);
const prods2 = await page.evaluate(async () => (await (await fetch("/api/datacell?bootstrap=1")).json()).data.appData.products);
nota("ES01-5", `Dos ventas simultáneas de todo el stock de ${pb.name} (${stock} u.)`,
  `Respuestas: ${res.map((r) => `HTTP ${r.status} ${r.body.message ?? ""}`).join(" | ")}; stock final ${prods2.find((p) => p.code === pb.code).stock}.`);

// 5. Texto largo y caracteres especiales en la observación y el cliente
await nuevaVenta();
await cliente("Maria", /Maria Torres/);
await agregar("Cable Lightning 1m");
const obs = page.getByLabel("Observación (opcional)");
await obs.fill("<script>alert(1)</script> ñandú — " + "x".repeat(600));
const largo = (await obs.inputValue()).length;
nota("ES01-6", "Observación con HTML y 630 caracteres", `El campo acepta ${largo} caracteres.`);
await page.getByRole("button", { name: "Importe exacto" }).click();
await page.getByRole("button", { name: "Revisar y cobrar" }).click();
await page.locator("dialog[open]").getByRole("button", { name: "Confirmar venta" }).click();
await page.locator(".success-notice, [role=alert]").first().waitFor();
nota("ES01-6b", "Resultado al registrar con esa observación", (await page.locator(".success-notice, .form-error, [role=alert]").first().innerText()).slice(0, 160));
await shot("03-observacion-larga");

// 6. Factura a un cliente con DNI
await nuevaVenta();
await cliente("Luis", /Luis Herrera/);
await agregar("Cable Lightning 1m");
await page.getByLabel("Tipo de comprobante").selectOption("FACTURA");
await page.getByRole("button", { name: "Importe exacto" }).click();
await page.getByRole("button", { name: "Revisar y cobrar" }).click();
await page.waitForTimeout(500);
nota("ES01-7", "Factura para cliente con DNI", (await page.locator("#sale-form-error, [role=alert]").allInnerTexts()).join(" / ") || `diálogo abierto: ${await page.locator("dialog[open]").count()}`);
await shot("04-factura-dni");

// 7. Teclado: completar la venta sin ratón (Tab / Enter)
await nuevaVenta();
await page.keyboard.press("Tab");
const foco = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40) || document.activeElement?.getAttribute("aria-label"));
nota("ES01-8", "Primer Tab en «Nueva venta»", `El foco va a: «${foco}»`);

writeFileSync(`${OUT}/notas.json`, JSON.stringify(notas, null, 2));
await browser.close();
