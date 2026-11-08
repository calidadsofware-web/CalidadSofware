import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Auditoría de accesibilidad con axe-core y verificaciones complementarias. REPORTE=<carpeta> separa cada ciclo. */
const dir = `reports/${process.env.REPORTE ?? "accesibilidad"}`;
export default defineConfig({
  ...base,
  testMatch: /accesibilidad\.spec\.ts/,
  outputDir: `${dir}/artifacts`,
  reporter: [["list"], ["html", { outputFolder: `${dir}/html`, open: "never" }], ["json", { outputFile: `${dir}/resultados.json` }]],
});
