// ES-02 · Sesión exploratoria: flujo de abastecimiento (solicitud → aprobación → recepción → inventario).
// Misión: descubrir inconsistencias de estado, fechas y cantidades entre módulos y con varios usuarios.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "exploratorias/ES-02";
mkdirSync(OUT, { recursive: true });
const URL = "http://127.0.0.1:5173";
const notas = [];
const nota = (id, idea, observado) => {
  notas.push({ id, idea, observado });
  console.log(id, "|", idea, "|", observado);
};
const browser = await chromium.launch();
async function sesion(correo) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-PE", timezoneId: "America/Lima" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.getByLabel("Correo electrónico").fill(correo);
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
  const datos = () => page.evaluate(async () => (await (await fetch("/api/datacell?bootstrap=1")).json()).data.appData);
  return { ctx, page, api, datos };
}
const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
const dia = (n) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date(Date.now() + n * 864e5));

const alm = await sesion("almacen@local.test");
const adm = await sesion("admin@local.test");
const d0 = await alm.datos();
const prod = d0.products.find((p) => p.code === "PROD-007");
const proveedor = d0.suppliers.find((s) => s.ruc === "20123456789");

// 1. Solicitudes con datos límite
for (const [desc, payload] of [
  ["fecha requerida en el pasado", { priority: "MEDIA", requiredDate: dia(-3), justification: "Prueba exploratoria ES-02", items: [{ code: prod.code, quantity: 5 }] }],
  ["cantidad 0", { priority: "MEDIA", requiredDate: dia(3), justification: "Prueba exploratoria ES-02", items: [{ code: prod.code, quantity: 0 }] }],
  ["justificación de 3 caracteres", { priority: "MEDIA", requiredDate: dia(3), justification: "abc", items: [{ code: prod.code, quantity: 5 }] }],
  ["prioridad inexistente", { priority: "URGENTISIMA", requiredDate: dia(3), justification: "Prueba exploratoria ES-02", items: [{ code: prod.code, quantity: 5 }] }],
]) {
  const r = await alm.api("register-purchase-request", payload);
  nota("ES02-1", `Solicitud con ${desc}`, `HTTP ${r.status}: ${r.body.message}`);
}

// 2. Solicitud válida y doble revisión simultánea (aprobar y rechazar a la vez)
const ok = await alm.api("register-purchase-request", {
  priority: "ALTA", requiredDate: dia(4), supplierId: proveedor.id, justification: "Prueba exploratoria ES-02: doble revisión", items: [{ code: prod.code, quantity: 10 }],
});
const d1 = await adm.datos();
const sol = d1.purchaseRequests.find((r) => r.status === "Pendiente" && r.notes.includes("doble revisión"));
nota("ES02-2", "Crear solicitud válida", `HTTP ${ok.status}: ${ok.body.message}`);
const adm2 = await sesion("admin@local.test");
const [a, b] = await Promise.all([
  adm.api("review-purchase", { id: sol.id, decision: "APROBADA", supplierId: proveedor.id, reason: "Aprobada en ES-02" }),
  adm2.api("review-purchase", { id: sol.id, decision: "RECHAZADA", reason: "Rechazada en ES-02" }),
]);
const estado = (await adm.datos()).purchaseRequests.find((r) => r.id === sol.id)?.status;
nota("ES02-3", `Aprobar y rechazar ${sol.number} al mismo tiempo desde dos sesiones`, `Respuestas: HTTP ${a.status} «${a.body.message}» | HTTP ${b.status} «${b.body.message}»; estado final: ${estado}.`);

// 3. Recepción: más que el saldo, fecha futura, guía vacía, dos recepciones simultáneas
const d2 = await alm.datos();
const orden = d2.purchases.find((p) => p.supplier.includes("Tecnologia") && p.items.some((i) => i.code === prod.code && i.pending === 10));
nota("ES02-4", "Orden de compra generada", `${orden.number} (${orden.status}): ${orden.items.map((i) => `${i.code} pedido ${i.ordered}, pendiente ${i.pending}`).join("; ")}`);
const linea = (q) => [{ code: prod.code, quantity: q }];
for (const [desc, payload] of [
  ["cantidad mayor al saldo (11 de 10)", { purchaseNumber: orden.number, entryDate: hoy, guide: "T001-ES02", items: linea(11) }],
  ["fecha de recepción futura", { purchaseNumber: orden.number, entryDate: dia(2), guide: "T001-ES02", items: linea(1) }],
  ["guía vacía", { purchaseNumber: orden.number, entryDate: hoy, guide: "", items: linea(1) }],
]) {
  const r = await alm.api("register-receipt", payload);
  nota("ES02-5", `Recepción con ${desc}`, `HTTP ${r.status}: ${r.body.message}`);
}
const stockAntes = (await alm.datos()).products.find((p) => p.code === prod.code).stock;
const alm2 = await sesion("almacen@local.test");
const [r1, r2] = await Promise.all([
  alm.api("register-receipt", { purchaseNumber: orden.number, entryDate: hoy, guide: "T001-ES02-A", items: linea(10) }),
  alm2.api("register-receipt", { purchaseNumber: orden.number, entryDate: hoy, guide: "T001-ES02-B", items: linea(10) }),
]);
const stockDespues = (await alm.datos()).products.find((p) => p.code === prod.code).stock;
nota("ES02-6", "Dos recepciones simultáneas del saldo completo (10 u.) de la misma orden",
  `Respuestas: HTTP ${r1.status} «${r1.body.message}» | HTTP ${r2.status} «${r2.body.message}»; stock ${stockAntes} → ${stockDespues}.`);

// 4. Inactivar un producto con una orden pendiente desde la interfaz
const sol2 = await alm.api("register-purchase-request", {
  priority: "BAJA", requiredDate: dia(6), supplierId: proveedor.id, justification: "Prueba exploratoria ES-02: inactivación", items: [{ code: "PROD-008", quantity: 4 }],
});
const pend = (await adm.datos()).purchaseRequests.find((r) => r.status === "Pendiente" && r.notes.includes("inactivación"));
const ap = await adm.api("review-purchase", { id: pend.id, decision: "APROBADA", supplierId: proveedor.id, reason: "Aprobada para probar inactivación" });
const p8 = (await alm.datos()).products.find((p) => p.code === "PROD-008");
const inac = await alm.api("save-product", { ...p8, originalCode: p8.code, status: "INACTIVO" });
nota("ES02-7", `Inactivar ${p8.name} con orden pendiente (solicitud HTTP ${sol2.status}, aprobación HTTP ${ap.status})`, `HTTP ${inac.status}: ${inac.body.message}`);

// 5. Ajuste de stock con valores límite
for (const [desc, payload] of [
  ["stock contado negativo", { code: prod.code, stock: -1, expectedStock: prod.stock, notes: "Conteo ES-02" }],
  ["motivo de 2 caracteres", { code: prod.code, stock: 1, expectedStock: prod.stock, notes: "ok" }],
]) {
  const r = await alm.api("adjust-stock", payload);
  nota("ES02-8", `Ajuste de stock con ${desc}`, `HTTP ${r.status}: ${r.body.message}`);
}

// 6. ¿El administrador ve el cambio de stock sin recargar?
await adm.page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Productos e inventario", exact: true }).click();
await adm.page.getByRole("searchbox", { name: "Buscar" }).fill(prod.name);
await adm.page.screenshot({ path: `${OUT}/01-inventario-admin.png` });
const fila = await adm.page.getByRole("row").filter({ hasText: prod.code }).innerText();
nota("ES02-9", "Inventario visto por el administrador tras las recepciones", fila.replace(/\s+/g, " ").slice(0, 160));

await alm.page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Recepciones", exact: true }).click();
await alm.page.getByRole("button", { name: "Historial de recepciones" }).click();
await alm.page.screenshot({ path: `${OUT}/02-historial-recepciones.png` });

writeFileSync(`${OUT}/notas.json`, JSON.stringify(notas, null, 2));
await browser.close();
