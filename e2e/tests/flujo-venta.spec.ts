import { expect, test, type Page } from "@playwright/test";
import { usuarios, venta, ventaEfectivoInsuficiente, ventaSobreStock } from "../data/venta.data";
import { LoginPage } from "../pages/LoginPage";
import { PaymentsPage } from "../pages/PaymentsPage";
import { SalePage } from "../pages/SalePage";
import { evidencia, montoDe } from "../utils/evidence";

/**
 * FLUJO CRÍTICO: Inicio de sesión del cajero + Registro de una venta en mostrador.
 * Requisitos cubiertos: RF02, RF03, RF04, RF08, RF10 · Historias: HU01, HU02, HU03, HU04, HU11.
 */

async function iniciarSesionComoCajero(page: Page) {
  const login = new LoginPage(page);
  await login.abrir();
  await login.ingresarCredenciales(usuarios.cajero.correo, usuarios.cajero.clave);
  await login.enviar();
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
}

test.describe("Flujo crítico: Login y registro de venta", () => {
  test("CP01 - Login con contraseña incorrecta es rechazado", async ({ page }, testInfo) => {
    const caso = "CP01-login-invalido";
    const login = new LoginPage(page);

    await test.step("Paso 1: Abrir la pantalla de inicio de sesión", async () => {
      await login.abrir();
      await evidencia(page, testInfo, caso, "01-pantalla-login");
    });

    await test.step("Paso 2: Ingresar correo válido y contraseña incorrecta", async () => {
      await login.ingresarCredenciales(usuarios.invalido.correo, usuarios.invalido.clave);
      await evidencia(page, testInfo, caso, "02-credenciales-ingresadas");
      await login.enviar();
    });

    await test.step("Validación: mensaje genérico de error y sin acceso al sistema", async () => {
      await expect(login.error).toHaveText("Correo o contraseña incorrectos.");
      await expect(page.getByRole("navigation", { name: "Navegación principal" })).toHaveCount(0);
      await expect(login.clave).toHaveAttribute("type", "password");
      await evidencia(page, testInfo, caso, "03-mensaje-error");
    });
  });

  test("CP02 - Login exitoso del cajero muestra solo sus módulos", async ({ page }, testInfo) => {
    const caso = "CP02-login-exitoso";
    const login = new LoginPage(page);

    await test.step("Paso 1: Ingresar credenciales válidas del rol Cajero", async () => {
      await login.abrir();
      await login.ingresarCredenciales(usuarios.cajero.correo, usuarios.cajero.clave);
      await evidencia(page, testInfo, caso, "01-credenciales-validas");
      await login.enviar();
    });

    await test.step("Validación: acceso concedido según el rol", async () => {
      const menu = page.getByRole("navigation", { name: "Navegación principal" });
      await expect(menu).toBeVisible();
      await expect(page.locator(".sidebar-profile")).toContainText(usuarios.cajero.rol);
      await expect(menu.getByRole("link", { name: "Nueva venta" })).toBeVisible();
      // RNF04: el cajero no debe ver módulos de administración ni compras
      await expect(menu.getByRole("link", { name: /Usuarios|Equipo/ })).toHaveCount(0);
      await expect(menu.getByRole("link", { name: /Cotizaciones/ })).toHaveCount(0);
      await evidencia(page, testInfo, caso, "02-inicio-cajero");
    });
  });

  test("CP03 - Registro de venta exitosa con pago en efectivo", async ({ page }, testInfo) => {
    const caso = "CP03-venta-exitosa";
    const sale = new SalePage(page);
    const pagos = new PaymentsPage(page);
    const [p1, p2] = venta.productos;
    let stockInicial = 0;
    let ventasInicial = 0;

    await test.step("Precondición: sesión de cajero y estado inicial (historial y stock)", async () => {
      await iniciarSesionComoCajero(page);
      await pagos.abrir();
      ventasInicial = await pagos.filas().count();
      await sale.abrirDesdeMenu();
      stockInicial = await sale.stockDisponible(p1.busqueda, p1.nombre);
      expect(stockInicial).toBeGreaterThanOrEqual(p1.cantidad);
      await evidencia(page, testInfo, caso, "01-pantalla-nueva-venta");
    });

    await test.step(`Paso 1: Seleccionar cliente ${venta.cliente.nombre} (DNI ${venta.cliente.busqueda})`, async () => {
      await sale.seleccionarCliente(venta.cliente.busqueda, venta.cliente.nombre);
      await expect(page.locator(".client-preview")).toContainText(venta.cliente.busqueda);
      await evidencia(page, testInfo, caso, "02-cliente-seleccionado");
    });

    await test.step("Paso 2: Agregar productos y cantidades", async () => {
      const cant1 = await sale.agregarProducto(p1.busqueda, p1.nombre, p1.cantidad);
      await expect(cant1).toHaveValue(String(p1.cantidad));
      const cant2 = await sale.agregarProducto(p2.busqueda, p2.nombre, p2.cantidad);
      await expect(cant2).toHaveValue(String(p2.cantidad));
      await expect(page.getByText("2 seleccionados")).toBeVisible();
      await evidencia(page, testInfo, caso, "03-productos-agregados", true);
    });

    await test.step("Paso 3: Elegir boleta, pago en efectivo e ingresar monto recibido", async () => {
      await sale.tipoComprobante.selectOption(venta.comprobante);
      await sale.metodoPago.selectOption(venta.metodoPago);
      await sale.efectivo.fill(venta.efectivoRecibido);
      await sale.observacion.fill(venta.observacion);
    });

    await test.step("Validación: cálculo de subtotal, IGV 18 %, total y vuelto (RF03)", async () => {
      expect(montoDe(await sale.valorResumen("Subtotal").innerText())).toBe(Number(venta.esperado.subtotal));
      expect(montoDe(await sale.valorResumen("IGV (18%)").innerText())).toBe(Number(venta.esperado.igv));
      expect(montoDe(await sale.valorResumen("Total a cobrar").innerText())).toBe(Number(venta.esperado.total));
      expect(montoDe(await sale.valorResumen("Vuelto").innerText())).toBe(Number(venta.esperado.vuelto));
      await evidencia(page, testInfo, caso, "04-totales-calculados", true);
    });

    await test.step("Paso 4: Revisar y cobrar → confirmar en el modal", async () => {
      await sale.revisarYCobrar.click();
      await expect(sale.modalConfirmacion).toBeVisible();
      await expect(sale.modalConfirmacion).toContainText(venta.cliente.nombre);
      expect(montoDe(await sale.valorResumen("Total a cobrar", sale.modalConfirmacion).innerText())).toBe(
        Number(venta.esperado.total),
      );
      await evidencia(page, testInfo, caso, "05-modal-confirmacion");
      await sale.modalConfirmacion.getByRole("button", { name: "Confirmar venta" }).click();
    });

    await test.step("Validación: venta registrada y formulario reiniciado", async () => {
      await expect(sale.avisoExito).toBeVisible();
      await expect(sale.avisoExito).toContainText("El pago y el inventario están actualizados");
      await expect(page.getByText("Busca un producto y pulsa Agregar para empezar.")).toBeVisible();
      await evidencia(page, testInfo, caso, "06-venta-registrada");
    });

    await test.step("Validación: descuento automático de stock (RF04)", async () => {
      const stockFinal = await sale.stockDisponible(p1.busqueda, p1.nombre);
      expect(stockFinal).toBe(stockInicial - p1.cantidad);
      testInfo.annotations.push({ type: "Stock PROD-002", description: `${stockInicial} → ${stockFinal}` });
      await evidencia(page, testInfo, caso, "07-stock-actualizado");
    });

    await test.step("Validación: la venta aparece en el historial con su detalle (RF08)", async () => {
      await pagos.abrir();
      await expect(pagos.filas()).toHaveCount(ventasInicial + 1);
      await pagos.buscar.fill(venta.cliente.nombre);
      const fila = pagos.filas().filter({ hasText: venta.esperado.total }).first();
      await expect(fila).toBeVisible();
      await expect(fila).toContainText(/EFECTIVO/i);
      testInfo.annotations.push({ type: "Comprobante generado", description: (await fila.locator("td").first().innerText()).trim() });
      await evidencia(page, testInfo, caso, "08-historial-ventas");
      await fila.getByRole("button", { name: /^Ver / }).click();
      const detalle = page.getByRole("dialog", { name: /^Venta / });
      await expect(detalle).toContainText(p1.nombre);
      await expect(detalle).toContainText(p2.nombre);
      await expect(detalle).toContainText(venta.observacion);
      await evidencia(page, testInfo, caso, "09-detalle-comprobante");
    });
  });

  test("CP04 - Efectivo insuficiente impide registrar la venta", async ({ page }, testInfo) => {
    const caso = "CP04-efectivo-insuficiente";
    const sale = new SalePage(page);
    const d = ventaEfectivoInsuficiente;

    await test.step("Paso 1: Preparar venta y registrar efectivo menor al total", async () => {
      await iniciarSesionComoCajero(page);
      await sale.abrirDesdeMenu();
      await sale.seleccionarCliente(d.cliente.busqueda, d.cliente.nombre);
      await sale.agregarProducto(d.producto.busqueda, d.producto.nombre, d.producto.cantidad);
      await sale.efectivo.fill(d.efectivoRecibido);
      expect(montoDe(await sale.valorResumen("Total a cobrar").innerText())).toBe(Number(d.esperado.total));
      await evidencia(page, testInfo, caso, "01-efectivo-insuficiente");
      await sale.revisarYCobrar.click();
    });

    await test.step("Validación: no se abre la confirmación ni se registra la venta", async () => {
      await expect(sale.modalConfirmacion).toHaveCount(0);
      await expect(sale.avisoExito).toHaveCount(0);
      const mensajeNativo = await sale.efectivo.evaluate((el: HTMLInputElement) => el.validationMessage);
      testInfo.annotations.push({ type: "Mensaje mostrado por el navegador", description: mensajeNativo || "(ninguno)" });
      await evidencia(page, testInfo, caso, "02-venta-bloqueada");
    });

    await test.step("Validación: el sistema muestra el mensaje de negocio definido (HU02-CA02)", async () => {
      await expect(sale.errorFormulario).toHaveText("El efectivo recibido no cubre el total.", { timeout: 3_000 });
    });
  });

  test("CP05 - La cantidad no puede superar el stock disponible", async ({ page }, testInfo) => {
    const caso = "CP05-limite-stock";
    const sale = new SalePage(page);
    const d = ventaSobreStock;

    await test.step("Paso 1: Agregar producto con stock bajo e ingresar cantidad excesiva", async () => {
      await iniciarSesionComoCajero(page);
      await sale.abrirDesdeMenu();
      await sale.seleccionarCliente(d.cliente.busqueda, d.cliente.nombre);
      const stock = await sale.stockDisponible(d.producto.busqueda, d.producto.nombre);
      const cantidad = await sale.agregarProducto(d.producto.busqueda, d.producto.nombre, d.cantidadSolicitada);
      await cantidad.blur();

      await test.step(`Validación: la cantidad se limita al stock (${stock} unidades)`, async () => {
        await expect(cantidad).toHaveValue(String(stock));
        await expect(sale.tarjetaProducto(d.producto.nombre).getByRole("button", { name: /Agregar/ })).toBeDisabled();
      });
      await evidencia(page, testInfo, caso, "01-cantidad-limitada-al-stock");
    });
  });
});
