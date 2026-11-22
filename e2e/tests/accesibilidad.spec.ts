import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { LoginPage } from "../pages/LoginPage";
import { SalePage } from "../pages/SalePage";

/**
 * Actividad 12 – Evaluación de accesibilidad con axe-core (WCAG 2.2 nivel A y AA) y verificaciones complementarias.
 * Recorre la pantalla de acceso, todas las pantallas del menú del administrador y los estados clave de la venta.
 * Guarda un JSON por pantalla y una captura con los elementos que incumplen resaltados en rojo.
 * REPORTE=<carpeta> separa los resultados de cada ciclo.
 */

const CLAVE = "Local-demo-2026!";
const DIR = `reports/${process.env.REPORTE ?? "accesibilidad"}`;
const ETIQUETAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
mkdirSync(`${DIR}/axe`, { recursive: true });
mkdirSync(`${DIR}/capturas`, { recursive: true });
mkdirSync(`${DIR}/verificaciones`, { recursive: true });

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function auditar(page: Page, info: TestInfo, orden: number, pantalla: string, rol: string) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // margen para que React termine de renderizar los datos cargados
  const r = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
  const nombre = `${String(orden).padStart(2, "0")}-${slug(pantalla)}`;
  const violaciones = r.violations.map((v) => ({
    id: v.id,
    impacto: v.impact,
    ayuda: v.help,
    url: v.helpUrl,
    etiquetas: v.tags,
    nodos: v.nodes.length,
    ejemplos: v.nodes.slice(0, 3).map((n) => ({ selector: n.target.join(" "), html: n.html.slice(0, 160), resumen: n.failureSummary })),
  }));
  writeFileSync(
    `${DIR}/axe/${nombre}.json`,
    JSON.stringify(
      {
        pantalla,
        rol,
        url: page.url(),
        fecha: r.timestamp,
        motor: r.testEngine,
        violaciones,
        aprobadas: r.passes.length,
        incompletas: r.incomplete.map((i) => ({
          id: i.id,
          impacto: i.impact,
          ayuda: i.help,
          nodos: i.nodes.length,
          ejemplos: i.nodes.slice(0, 5).map((n) => ({ selector: n.target.join(" "), html: n.html.slice(0, 160), resumen: n.failureSummary })),
        })),
      },
      null,
      1,
    ),
  );
  // Evidencia: resalta los elementos que incumplen.
  const selectores = r.violations.flatMap((v) => v.nodes.flatMap((n) => n.target.filter((t) => typeof t === "string")));
  await page.evaluate((sels) => {
    for (const s of sels) document.querySelectorAll(s).forEach((e) => ((e as HTMLElement).style.outline = "3px solid #d00000"));
  }, selectores as string[]);
  await page.screenshot({ path: `${DIR}/capturas/${nombre}.png`, fullPage: true });
  await page.evaluate((sels) => {
    for (const s of sels) document.querySelectorAll(s).forEach((e) => ((e as HTMLElement).style.outline = ""));
  }, selectores as string[]);
  info.annotations.push({
    type: pantalla,
    description: `${r.violations.length} reglas incumplidas (${violaciones.reduce((a, v) => a + v.nodos, 0)} elementos); ${r.passes.length} reglas aprobadas`,
  });
}

async function ingresar(page: Page, correo: string) {
  const login = new LoginPage(page);
  await login.abrir();
  await login.ingresarCredenciales(correo, CLAVE);
  await login.enviar();
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
}

test.describe("Accesibilidad WCAG 2.2 AA con axe-core", () => {
  test("Pantalla de acceso: formulario y mensaje de error", async ({ page }, info) => {
    const login = new LoginPage(page);
    await login.abrir();
    await auditar(page, info, 1, "Iniciar sesión", "Público");
    await login.ingresarCredenciales("caja@local.test", "ClaveIncorrecta-123");
    await login.enviar();
    await expect(login.error).toBeVisible();
    await auditar(page, info, 2, "Iniciar sesión con error", "Público");
  });

  test("Todas las pantallas del menú del administrador", async ({ page }, info) => {
    await ingresar(page, "admin@local.test");
    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    const enlaces = await nav.getByRole("link").allInnerTexts();
    let orden = 3;
    for (const nombre of enlaces.map((e) => e.trim())) {
      await nav.getByRole("link", { name: nombre, exact: true }).click();
      // Las pantallas se cargan de forma diferida: se espera su título antes de auditar.
      await expect(page.locator("main h1").first()).toBeVisible();
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await auditar(page, info, orden++, nombre, "Administrador");
    }
  });

  test("Estados de la venta: carrito, efectivo insuficiente y modal de confirmación", async ({ page }, info) => {
    await ingresar(page, "caja@local.test");
    const sale = new SalePage(page);
    await sale.abrirDesdeMenu();
    await sale.seleccionarCliente("71234567", "Luis Herrera");
    await sale.agregarProducto("PROD-003", "Audifonos Bluetooth", 1);
    await auditar(page, info, 40, "Nueva venta con carrito", "Cajero");
    await sale.efectivo.fill("10");
    await sale.revisarYCobrar.click();
    await auditar(page, info, 41, "Nueva venta con efectivo insuficiente", "Cajero");
    await page.getByRole("button", { name: "Importe exacto" }).click();
    await sale.revisarYCobrar.click();
    await expect(sale.modalConfirmacion).toBeVisible();
    await auditar(page, info, 42, "Modal Confirmar venta y cobro", "Cajero");
  });
});

/* ------------------------------------------------------------------------------------------------
 * Verificaciones complementarias (criterios WCAG que axe no puede resolver solo).
 * ---------------------------------------------------------------------------------------------- */
type Verificacion = { id: string; criterio: string; pantalla: string; resultado: string; cumple: boolean };
const registrar = (v: Verificacion) => {
  writeFileSync(`${DIR}/verificaciones/${v.id}.json`, JSON.stringify(v, null, 1));
  expect.soft(v.cumple, `${v.id} – ${v.criterio}: ${v.resultado}`).toBe(true); // la verificación falla si no se cumple
};

/** Razón de contraste WCAG entre dos colores rgb(a). */
function contraste(a: string, b: string) {
  const lum = (c: string) => {
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? [])
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

test.describe("Verificaciones complementarias de accesibilidad", () => {
  test("V1-V2: contraste del texto sobre el degradado del acceso y de los textos de ayuda (placeholder)", async ({ page }) => {
    await new LoginPage(page).abrir();
    const datos = await page.evaluate(() => {
      const fondo = (el: Element | null): string => {
        while (el) {
          const c = getComputedStyle(el).backgroundColor;
          if (c && !c.endsWith(", 0)") && c !== "transparent") return c;
          el = el.parentElement;
        }
        return "rgb(255, 255, 255)";
      };
      return [".eyebrow", "#login-title", ".muted", 'label[for="login-email"]'].map((s) => {
        const e = document.querySelector(s)!;
        return { s, color: getComputedStyle(e).color, fondo: fondo(e) };
      });
    });
    const min = Math.min(...datos.map((d) => contraste(d.color, d.fondo)));
    registrar({
      id: "V1",
      criterio: "1.4.3 Contraste mínimo",
      pantalla: "Iniciar sesión",
      resultado: `Contraste mínimo de los textos marcados por axe como «incompletos»: ${min.toFixed(2)}:1 (${datos
        .map((d) => `${d.s} ${contraste(d.color, d.fondo).toFixed(2)}:1`)
        .join("; ")}).`,
      cumple: min >= 4.5,
    });

    await ingresar(page, "caja@local.test");
    await new SalePage(page).abrirDesdeMenu();
    const ph = await page.evaluate(() =>
      [...document.querySelectorAll("main input[placeholder], main textarea[placeholder]")].map((e) => ({
        ph: (e as HTMLInputElement).placeholder,
        color: getComputedStyle(e, "::placeholder").color,
        fondo: getComputedStyle(e).backgroundColor,
      })),
    );
    const peor = ph.map((p) => ({ ...p, r: contraste(p.color, p.fondo) })).sort((a, b) => a.r - b.r)[0];
    registrar({
      id: "V2",
      criterio: "1.4.3 Contraste mínimo (texto de ayuda)",
      pantalla: "Nueva venta",
      resultado: `${ph.length} campos con placeholder; el de menor contraste es «${peor.ph}» con ${peor.r.toFixed(2)}:1 (${peor.color} sobre ${peor.fondo}).`,
      cumple: peor.r >= 4.5,
    });
  });

  test("V3-V4: operación completa con teclado y foco visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Ingresar" })).toBeEnabled();
    const enfocados: string[] = [];
    const vistos: boolean[] = [];
    const foco = async () =>
      page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        const cs = getComputedStyle(e);
        const visible = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 ? true : cs.boxShadow !== "none";
        return { nombre: e.getAttribute("aria-label") || e.id || e.textContent?.trim().slice(0, 30) || e.tagName, visible };
      });
    await page.keyboard.press("Tab");
    let f = await foco();
    enfocados.push(f.nombre);
    vistos.push(f.visible);
    await page.keyboard.type("caja@local.test");
    await page.keyboard.press("Tab");
    f = await foco();
    enfocados.push(f.nombre);
    vistos.push(f.visible);
    await page.keyboard.type(CLAVE);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
    await page.keyboard.press("Tab");
    f = await foco();
    enfocados.push(f.nombre);
    vistos.push(f.visible);
    const saltoVisible = await page.locator(".skip-link").isVisible();
    await page.screenshot({ path: `${DIR}/capturas/v3-salto-al-contenido.png` });
    await page.keyboard.press("Enter");
    const enMain = await page.evaluate(() => document.activeElement?.id === "main-content");
    registrar({
      id: "V3",
      criterio: "2.1.1 Teclado · 2.4.1 Evitar bloques · 2.4.3 Orden del foco",
      pantalla: "Iniciar sesión → Inicio",
      resultado: `Ingreso completo solo con teclado. Orden del foco: ${enfocados.join(" → ")}. Enlace «Saltar al contenido principal» ${
        saltoVisible ? "visible al recibir el foco" : "no visible"
      } y ${enMain ? "lleva el foco al contenido principal" : "no mueve el foco"}.`,
      cumple: enMain && saltoVisible,
    });
    registrar({
      id: "V4",
      criterio: "2.4.7 Foco visible",
      pantalla: "Iniciar sesión → Inicio",
      resultado: `Indicador de foco visible en ${vistos.filter(Boolean).length} de ${vistos.length} elementos recorridos (regla :focus-visible de base.css).`,
      cumple: vistos.every(Boolean),
    });
  });

  test("V5: adaptación a pantallas de 320 px sin desplazamiento horizontal", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, locale: "es-PE" });
    const page = await ctx.newPage();
    const login = new LoginPage(page);
    await login.abrir();
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.screenshot({ path: `${DIR}/capturas/v5-login-320.png`, fullPage: true });
    await login.ingresarCredenciales("caja@local.test", CLAVE);
    await login.enviar();
    // En pantallas angostas el menú lateral se oculta tras el botón «Menú».
    await page.getByRole("button", { name: "Menú", exact: true }).click();
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Nueva venta" }).click();
    await expect(page.locator("main h1").first()).toBeVisible();
    await page.waitForTimeout(800);
    const venta = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.screenshot({ path: `${DIR}/capturas/v5-venta-320.png`, fullPage: true });
    // INC-13: el «Resumen del periodo» de Ventas y pagos desbordaba la página a 320 px.
    await page.getByRole("button", { name: "Menú", exact: true }).click();
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Ventas y pagos" }).click();
    await expect(page.locator("main h1").first()).toBeVisible();
    await page.waitForTimeout(800);
    const pagos = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.screenshot({ path: `${DIR}/capturas/v5-pagos-320.png`, fullPage: true });
    registrar({
      id: "V5",
      criterio: "1.4.10 Reajuste del contenido (320 px)",
      pantalla: "Iniciar sesión, Nueva venta y Ventas y pagos",
      resultado: `Ancho del documento a 320 px: acceso ${ancho} px, Nueva venta ${venta} px y Ventas y pagos ${pagos} px.`,
      cumple: ancho <= 320 && venta <= 320 && pagos <= 320,
    });
    await ctx.close();
  });

  test("V6-V7: identificación de errores y mensajes de estado en la venta", async ({ page }) => {
    await ingresar(page, "caja@local.test");
    const sale = new SalePage(page);
    await sale.abrirDesdeMenu();
    await sale.seleccionarCliente("71234567", "Luis Herrera");
    await sale.agregarProducto("PROD-003", "Audifonos Bluetooth", 1);
    await sale.efectivo.fill("10");
    await sale.revisarYCobrar.click();
    await page.waitForTimeout(400);
    const alertas = await page.locator("main").getByRole("alert").count();
    const nativo = await sale.efectivo.evaluate((e: HTMLInputElement) => e.validationMessage);
    const descrito = await sale.efectivo.evaluate((e) => e.getAttribute("aria-describedby") ?? "");
    const invalido = await sale.efectivo.evaluate((e) => e.getAttribute("aria-invalid") ?? "");
    registrar({
      id: "V6",
      criterio: "3.3.1 Identificación de errores",
      pantalla: "Nueva venta (efectivo insuficiente)",
      resultado:
        alertas > 0
          ? `Con S/ 10 para un total de S/ 53.10 se muestra en la página «${(await page.locator("main").getByRole("alert").first().innerText()).trim()}» (role="alert"), vinculado al campo con aria-describedby (${descrito || "ninguno"}) y aria-invalid=${invalido || "no"}.`
          : `Con S/ 10 para un total de S/ 53.10 no aparece ningún mensaje en la página (role="alert": 0); solo el globo nativo del navegador «${nativo}», que no forma parte del contenido y desaparece. aria-describedby: ${descrito || "ninguno"}.`,
      cumple: alertas > 0,
    });
    await page.screenshot({ path: `${DIR}/capturas/v6-efectivo-insuficiente.png` });

    await page.reload();
    await sale.abrirDesdeMenu();
    await sale.seleccionarCliente("70011223", "Camila Rojas");
    // La cantidad se toma del stock real (stock + 1) para que la verificación no dependa del estado de la base.
    await sale.buscarProducto.fill("PROD-005");
    const tarjeta = await page.getByRole("button", { name: "Agregar Power Bank 10000mAh" }).locator("..").innerText();
    const stock = Number(/(\d+) disponibles/.exec(tarjeta)?.[1] ?? 7);
    const cantidad = await sale.agregarProducto("PROD-005", "Power Bank 10000mAh", 1);
    await cantidad.fill(String(stock + 1));
    await cantidad.blur();
    await page.waitForTimeout(500);
    const valor = await cantidad.inputValue();
    const avisos = await page.locator("main [role=alert], main [role=status]").allInnerTexts();
    const sobreStock = avisos.filter((t) => /stock/i.test(t));
    await page.screenshot({ path: `${DIR}/capturas/v7-stock-insuficiente.png` });
    registrar({
      id: "V7",
      criterio: "3.3.1 Identificación de errores · 4.1.3 Mensajes de estado",
      pantalla: "Nueva venta (cantidad mayor al stock)",
      resultado: sobreStock.length
        ? `Al escribir ${stock + 1} con stock ${stock} el campo queda en ${valor} y se anuncia «${sobreStock[0].trim()}» en una región de estado.`
        : `Al escribir ${stock + 1} con stock ${stock} el campo queda en ${valor} sin aviso de estado ni de error (0 mensajes sobre el stock).`,
      cumple: sobreStock.length > 0,
    });
  });
});
