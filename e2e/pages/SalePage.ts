import { expect, type Locator, type Page } from "@playwright/test";

/** Page Object de la pantalla "Nueva venta" (/ventas/nueva). */
export class SalePage {
  readonly titulo: Locator;
  readonly buscarCliente: Locator;
  readonly buscarProducto: Locator;
  readonly tipoComprobante: Locator;
  readonly metodoPago: Locator;
  readonly efectivo: Locator;
  readonly observacion: Locator;
  readonly revisarYCobrar: Locator;
  readonly resumenCobro: Locator;
  readonly errorFormulario: Locator;
  readonly avisoExito: Locator;
  readonly modalConfirmacion: Locator;

  constructor(private readonly page: Page) {
    this.titulo = page.getByRole("heading", { name: "Nueva venta", level: 1 });
    this.buscarCliente = page.getByRole("combobox", { name: /Buscar cliente/ });
    this.buscarProducto = page.getByRole("searchbox", { name: "Buscar producto" });
    this.tipoComprobante = page.getByLabel("Tipo de comprobante");
    this.metodoPago = page.getByLabel("Método de pago");
    this.efectivo = page.getByLabel("Efectivo recibido (S/)");
    this.observacion = page.getByLabel("Observación (opcional)");
    this.revisarYCobrar = page.getByRole("button", { name: "Revisar y cobrar" });
    this.resumenCobro = page.getByRole("complementary", { name: "Cobro de la venta" }).locator("dl.sale-totals");
    this.errorFormulario = page.locator("form").getByRole("alert");
    this.avisoExito = page.getByRole("status").filter({ hasText: "Venta registrada" });
    this.modalConfirmacion = page.getByRole("dialog", { name: "Confirmar venta y cobro" });
  }

  async abrirDesdeMenu() {
    await this.page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Nueva venta" }).click();
    await expect(this.page).toHaveURL(/\/ventas\/nueva$/);
    await expect(this.titulo).toBeVisible();
  }

  async seleccionarCliente(busqueda: string, nombre: string) {
    await this.buscarCliente.click();
    await this.buscarCliente.fill(busqueda);
    await this.page.getByRole("option", { name: new RegExp(nombre) }).click();
    await expect(this.buscarCliente).toHaveValue(nombre);
  }

  /** Tarjeta del catálogo de un producto (muestra "N disponibles"). */
  tarjetaProducto(nombre: string) {
    return this.page.locator("article.catalog-product").filter({ has: this.page.getByText(nombre, { exact: true }) });
  }

  async stockDisponible(busqueda: string, nombre: string) {
    await this.buscarProducto.fill(busqueda);
    const texto = await this.tarjetaProducto(nombre).getByText(/disponibles/).innerText();
    return Number(/(\d+) disponibles/.exec(texto)?.[1]);
  }

  async agregarProducto(busqueda: string, nombre: string, cantidad: number) {
    await this.buscarProducto.fill(busqueda);
    await this.page.getByRole("button", { name: `Agregar ${nombre}` }).click();
    const campoCantidad = this.page.getByRole("spinbutton", { name: `Cantidad de ${nombre}` });
    if (cantidad !== 1) await campoCantidad.fill(String(cantidad));
    return campoCantidad;
  }

  valorResumen(concepto: "Subtotal" | "IGV (18%)" | "Total a cobrar" | "Vuelto", ambito: Locator = this.resumenCobro) {
    return ambito.locator("div").filter({ has: this.page.locator("dt", { hasText: concepto }) }).locator("dd");
  }
}
