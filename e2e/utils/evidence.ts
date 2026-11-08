import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";

const ROOT = path.resolve(__dirname, "..", "evidencias");

/**
 * Captura una evidencia numerada, la guarda en evidencias/<caso>/ y la adjunta al reporte HTML.
 * Ejemplo: evidencias/CP03-venta-exitosa/03-totales-calculados.png
 */
export async function evidencia(page: Page, testInfo: TestInfo, caso: string, nombre: string, fullPage = false) {
  const carpeta = path.join(ROOT, caso);
  mkdirSync(carpeta, { recursive: true });
  const archivo = path.join(carpeta, `${nombre}.png`);
  await page.screenshot({ path: archivo, fullPage });
  await testInfo.attach(`${caso} · ${nombre}`, { path: archivo, contentType: "image/png" });
  return archivo;
}

/** Convierte "S/ 84.96" (con espacio duro del formato es-PE) en el número 84.96. */
export const montoDe = (texto: string | null) => Number((texto ?? "").replace(/[^\d.]/g, ""));
