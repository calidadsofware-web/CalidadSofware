import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Plan PP-DC-01 completo (23 casos). REPORTE=<carpeta> separa los reportes de cada ciclo. */
const dir = `reports/${process.env.REPORTE ?? "plan"}`;
export default defineConfig({
  ...base,
  testMatch: /plan-pruebas\.spec\.ts/,
  outputDir: `${dir}/artifacts`,
  reporter: [["list"], ["html", { outputFolder: `${dir}/html`, open: "never" }], ["json", { outputFile: `${dir}/resultados.json` }]],
});
