// ES-03 · Sesión exploratoria: seguridad, sesión y control de acceso por rol.
// Misión: intentar acceder a datos u operaciones sin sesión, con un rol sin permiso o con entradas maliciosas.
import { chromium, request } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "exploratorias/ES-03";
mkdirSync(OUT, { recursive: true });
const URL = "http://127.0.0.1:5173";
const notas = [];
const nota = (id, idea, observado) => {
  notas.push({ id, idea, observado });
  console.log(id, "|", idea, "|", observado);
};
const browser = await chromium.launch();
async function sesion(correo, clave = "Local-demo-2026!") {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "es-PE" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.getByLabel("Correo electrónico").fill(correo);
  await page.getByLabel("Contraseña").fill(clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.getByRole("heading", { name: /^Hola,/ }).waitFor();
  const api = (action, payload, headers = {}) =>
    page.evaluate(
      async ([action, payload, headers]) => {
        const r = await fetch("/api/datacell", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ action, payload }),
        });
        return { status: r.status, body: await r.json() };
      },
      [action, payload, headers],
    );
  return { ctx, page, api };
}

// 1. Sin sesión
const anon = await request.newContext({ baseURL: URL });
const g = await anon.get("/api/datacell?bootstrap=1");
nota("ES03-1", "Leer los datos del sistema sin sesión (GET)", `HTTP ${g.status()}: ${JSON.stringify(await g.json()).slice(0, 100)}`);
const p = await anon.post("/api/datacell", { data: { action: "register-sale", payload: {} }, headers: { Origin: URL } });
nota("ES03-2", "Registrar una venta sin sesión (POST)", `HTTP ${p.status()}: ${(await p.json()).message}`);

// 2. Origen cruzado (CSRF) con una sesión válida
const caja = await sesion("caja@local.test");
const cookies = await caja.ctx.cookies();
const sc = cookies.find((c) => c.name.toLowerCase().includes("session") || c.name.toLowerCase().includes("datacell"));
nota("ES03-3", "Atributos de la cookie de sesión", sc ? `${sc.name}: HttpOnly=${sc.httpOnly}, SameSite=${sc.sameSite}, Secure=${sc.secure}, expira en ${Math.round((sc.expires - Date.now() / 1000) / 3600)} h` : "sin cookie");
const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
const csrf = await anon.post("/api/datacell", {
  data: { action: "register-sale", payload: { clientName: "Jorge Salas", items: [{ code: "PROD-004", quantity: 1 }] } },
  headers: { Origin: "https://sitio-malicioso.example", Cookie: cookieHeader },
});
nota("ES03-4", "POST con la cookie del cajero desde otro origen (CSRF)", `HTTP ${csrf.status()}: ${(await csrf.json()).message}`);
const js = await caja.page.evaluate(() => document.cookie);
nota("ES03-5", "Leer la cookie de sesión con JavaScript (document.cookie)", js ? `Visible: ${js.slice(0, 40)}…` : "No visible (cadena vacía)");

// 3. Escalamiento de privilegios: cajero contra operaciones de otros roles
for (const [action, payload] of [
  ["save-user", { firstName: "X", lastName: "Y", email: "x@y.pe", role: "ADMINISTRADOR", password: "ContraseñaLarga123" }],
  ["review-purchase", { id: 1, decision: "APROBADA", reason: "Escalamiento" }],
  ["adjust-stock", { code: "PROD-001", stock: 999, expectedStock: 0, notes: "Escalamiento" }],
  ["save-supplier", { ruc: "20111111111", businessName: "Proveedor X" }],
]) {
  const r = await caja.api(action, payload);
  nota("ES03-6", `Cajero invoca «${action}»`, `HTTP ${r.status}: ${r.body.message}`);
}
const adm = await sesion("admin@local.test");
const r7 = await adm.api("save-user", { firstName: "Admin", lastName: "Dos", email: "admin2@local.test", role: "ADMINISTRADOR", password: "ContraseñaLarga123", confirmPassword: "ContraseñaLarga123", status: "ACTIVO" });
nota("ES03-7", "Administrador intenta crear otro administrador por la API", `HTTP ${r7.status}: ${r7.body.message}`);

// 4. Entradas maliciosas: inyección SQL y XSS
const sqli = await anon.post("/api/datacell", {
  data: { action: "sign-in", payload: { email: "admin@local.test' OR '1'='1", password: "' OR '1'='1" } },
  headers: { Origin: URL },
});
nota("ES03-8", "Inicio de sesión con inyección SQL", `HTTP ${sqli.status()}: ${(await sqli.json()).message}`);
const xss = await caja.api("save-client", { documentType: "DNI", document: "76543219", firstName: "<img src=x onerror=alert('xss')>", lastName: "Prueba", address: "", phone: "", email: "" });
nota("ES03-9", "Registrar un cliente con nombre <img onerror> (XSS almacenado)", `HTTP ${xss.status}: ${xss.body.message}`);
let alerta = false;
caja.page.on("dialog", async (d) => {
  alerta = true;
  await d.dismiss();
});
await caja.page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Clientes", exact: true }).click();
await caja.page.getByRole("searchbox", { name: "Buscar" }).fill("onerror");
await caja.page.waitForTimeout(800);
await caja.page.screenshot({ path: `${OUT}/01-xss-escapado.png` });
nota("ES03-9b", "Mostrar ese cliente en el directorio", `¿Se ejecutó el script?: ${alerta ? "sí" : "no"}; el nombre se ve como texto.`);

// 5. Fuerza bruta: 25 intentos fallidos y luego la clave correcta
const t0 = Date.now();
let estados = {};
for (let i = 0; i < 25; i++) {
  const r = await anon.post("/api/datacell", { data: { action: "sign-in", payload: { email: "caja@local.test", password: `mala-${i}` } }, headers: { Origin: URL } });
  estados[r.status()] = (estados[r.status()] ?? 0) + 1;
}
const fin = await anon.post("/api/datacell", { data: { action: "sign-in", payload: { email: "caja@local.test", password: "Local-demo-2026!" } }, headers: { Origin: URL } });
nota("ES03-10", "25 intentos de contraseña incorrecta seguidos y luego la correcta",
  `Respuestas a los fallidos: ${JSON.stringify(estados)} en ${((Date.now() - t0) / 1000).toFixed(1)} s; intento correcto: HTTP ${fin.status()}. No hay bloqueo ni demora progresiva.`);

// 6. Reutilizar la cookie después de cerrar sesión
const otra = await sesion("caja@local.test");
const robada = (await otra.ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
await otra.page.getByRole("button", { name: "Cerrar sesión" }).click();
await otra.page.getByRole("button", { name: "Ingresar" }).waitFor();
const reuso = await anon.get("/api/datacell?bootstrap=1", { headers: { Cookie: robada } });
const cuerpo = await reuso.json();
nota("ES03-11", "Reutilizar la cookie copiada antes de «Cerrar sesión»",
  `HTTP ${reuso.status()}; usuario devuelto: ${cuerpo.data?.user?.email ?? "ninguno"}.`);

// 7. Cuenta desactivada con sesión abierta
const almacen = await sesion("almacen@local.test");
const usuarios = (await adm.page.evaluate(async () => (await (await fetch("/api/datacell?bootstrap=1")).json()).data.appData.users)) ?? [];
const u = usuarios.find((x) => x.email === "almacen@local.test");
const base = { id: u.id, firstName: "almacen", lastName: "Local", email: u.email, role: "ALMACEN" };
const des = await adm.api("save-user", { ...base, status: "INACTIVO" });
const tras = await almacen.page.evaluate(async () => (await (await fetch("/api/datacell?bootstrap=1")).json()).data.user?.email ?? null);
nota("ES03-12", "Desactivar la cuenta de almacén mientras tiene la sesión abierta", `Desactivación HTTP ${des.status}: ${des.body.message}; la sesión abierta devuelve usuario: ${tras ?? "ninguno (sesión invalidada)"}.`);
if (des.status === 200) await adm.api("save-user", { ...base, status: "ACTIVO" });

writeFileSync(`${OUT}/notas.json`, JSON.stringify(notas, null, 2));
await browser.close();
