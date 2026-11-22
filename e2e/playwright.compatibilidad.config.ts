import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

/**
 * Compatibilidad (ISO/IEC 25010): los escenarios de aceptación AC-01, AC-02, AC-03 y AC-06
 * se ejecutan en los tres motores de navegador: Chromium (Chrome/Edge), Firefox y WebKit (Safari).
 */
const dir = `reports/${process.env.REPORTE ?? "compatibilidad"}`;
const vista = { viewport: { width: 1366, height: 768 } };
export default defineConfig({
  ...base,
  testMatch: /aceptacion\.spec\.ts/,
  grep: /AC-0[1236]/,
  outputDir: `${dir}/artifacts`,
  reporter: [["list"], ["html", { outputFolder: `${dir}/html`, open: "never" }], ["json", { outputFile: `${dir}/resultados.json` }]],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], ...vista } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], ...vista } },
    { name: "webkit", use: { ...devices["Desktop Safari"], ...vista } },
  ],
});
