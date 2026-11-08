import { expect, type Locator, type Page } from "@playwright/test";

/** Page Object del "Historial de ventas y pagos" (/pagos). */
export class PaymentsPage {
  readonly titulo: Locator;
  readonly buscar: Locator;
  readonly tabla: Locator;

  constructor(private readonly page: Page) {
    this.titulo = page.getByRole("heading", { name: "Ventas y pagos", level: 1 });
    const seccion = page.locator('section[aria-label="Historial de ventas y pagos"]');
    this.buscar = seccion.getByRole("searchbox");
    this.tabla = seccion.getByRole("table").first();
  }

  async abrir() {
    await this.page.goto("/pagos");
    await expect(this.titulo).toBeVisible();
  }

  filas() {
    return this.tabla.locator("tbody tr");
  }
}
