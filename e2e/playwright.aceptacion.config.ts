import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Pruebas de aceptación de usuario (AC-01 a AC-06). REPORTE=<carpeta> separa cada ejecución. */
const dir = `reports/${process.env.REPORTE ?? "aceptacion"}`;
export default defineConfig({
  ...base,
  testMatch: /aceptacion\.spec\.ts/,
  outputDir: `${dir}/artifacts`,
  reporter: [["list"], ["html", { outputFolder: `${dir}/html`, open: "never" }], ["json", { outputFile: `${dir}/resultados.json` }]],
});
