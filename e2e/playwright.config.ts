import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright para el flujo crítico de DataCell.
 * El servidor local (npm run dev:local) usa una base PostgreSQL embebida (PGlite):
 * nunca se conecta a Supabase ni a datos de producción.
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./reports/artifacts",
  fullyParallel: false, // los casos comparten la misma base local: se ejecutan en orden
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["json", { outputFile: "reports/resultados.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5173",
    locale: "es-PE",
    timezoneId: "America/Lima",
    viewport: { width: 1366, height: 768 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } }],
  webServer: {
    command: "npm run dev:local",
    cwd: "../web",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
