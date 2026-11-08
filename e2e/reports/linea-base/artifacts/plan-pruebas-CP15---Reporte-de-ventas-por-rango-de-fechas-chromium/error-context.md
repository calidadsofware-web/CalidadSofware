# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-pruebas.spec.ts >> CP15 - Reporte de ventas por rango de fechas
- Location: tests/plan-pruebas.spec.ts:297:5

# Error details

```
Error: Debe mostrarse el resumen del periodo

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Saltar al contenido principal" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - complementary [ref=e5]:
    - generic [ref=e6]: DataCell
    - navigation "Navegación principal" [ref=e8]:
      - generic [ref=e9]:
        - paragraph [ref=e10]: Trabajo diario
        - link "Inicio" [ref=e11] [cursor=pointer]:
          - /url: /
      - generic [ref=e12]:
        - paragraph [ref=e13]: Comercial
        - link "Nueva venta" [ref=e14] [cursor=pointer]:
          - /url: /ventas/nueva
        - link "Ventas y pagos" [ref=e15] [cursor=pointer]:
          - /url: /pagos
        - link "Clientes" [ref=e16] [cursor=pointer]:
          - /url: /clientes
        - link "Reclamos" [ref=e17] [cursor=pointer]:
          - /url: /reclamos
      - generic [ref=e18]:
        - paragraph [ref=e19]: Abastecimiento
        - link "Productos e inventario" [ref=e20] [cursor=pointer]:
          - /url: /productos
        - link "Recepciones" [ref=e21] [cursor=pointer]:
          - /url: /recepciones/nueva
        - link "Solicitudes de compra" [ref=e22] [cursor=pointer]:
          - /url: /solicitudes
        - link "Proveedores" [ref=e23] [cursor=pointer]:
          - /url: /proveedores
        - link "Cotizaciones" [ref=e24] [cursor=pointer]:
          - /url: /cotizaciones
      - generic [ref=e25]:
        - paragraph [ref=e26]: Administración
        - link "Equipo y permisos" [ref=e27] [cursor=pointer]:
          - /url: /usuarios
    - generic [ref=e28]:
      - strong [ref=e29]: admin Local
      - generic [ref=e30]: Administrador
      - button "Cerrar sesión" [ref=e31] [cursor=pointer]
  - generic [ref=e32]:
    - banner [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e35]: Espacio de trabajo
        - strong [ref=e36]: Ventas y pagos
      - generic [ref=e37]:
        - generic [ref=e38]: Entorno local
        - button "Actualizar" [ref=e39] [cursor=pointer]
    - main [ref=e40]:
      - generic [ref=e41]:
        - generic [ref=e42]:
          - heading "Ventas y pagos" [level=1] [ref=e43]
          - paragraph [ref=e44]: Consulta cobros, referencias y detalle de cada venta.
        - link "Nueva venta" [ref=e45] [cursor=pointer]:
          - /url: /ventas/nueva
      - region "Historial de ventas y pagos" [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]:
            - text: Buscar
            - searchbox "Buscar" [ref=e49]
          - generic [ref=e50]:
            - text: Método
            - combobox "Método" [ref=e51]:
              - option "Todos" [selected]
              - option "Efectivo"
              - option "Tarjeta"
              - option "Transferencia"
              - option "Yape"
          - generic [ref=e52]:
            - text: Estado
            - combobox "Estado" [ref=e53]:
              - option "Todos" [selected]
              - option "Observado"
              - option "Pagado"
          - generic [ref=e54]:
            - text: Desde
            - textbox "Desde" [ref=e55]: 2026-11-07
          - generic [ref=e56]:
            - text: Hasta
            - textbox "Hasta" [active] [ref=e57]: 2026-11-08
          - button "Limpiar filtros" [ref=e58] [cursor=pointer]
        - generic [ref=e59]:
          - region "Historial de ventas y pagos" [ref=e60]:
            - table [ref=e61]:
              - caption [ref=e62]: Historial de ventas y pagos
              - rowgroup [ref=e63]:
                - row [ref=e64]:
                  - columnheader [ref=e65]:
                    - button "Ordenar por Comprobante" [ref=e66] [cursor=pointer]: Comprobante
                  - columnheader [ref=e67]:
                    - button "Ordenar por Cliente" [ref=e68] [cursor=pointer]: Cliente
                  - columnheader [ref=e69]:
                    - button "Ordenar por Fecha" [ref=e70] [cursor=pointer]: Fecha
                  - columnheader [ref=e71]:
                    - button "Ordenar por Pago" [ref=e72] [cursor=pointer]: Pago
                  - columnheader [ref=e73]:
                    - button "Ordenar por Referencia" [ref=e74] [cursor=pointer]: Referencia
                  - columnheader [ref=e75]:
                    - button "Ordenar por Estado" [ref=e76] [cursor=pointer]: Estado
                  - columnheader [ref=e77]:
                    - button "Ordenar por Total" [ref=e78] [cursor=pointer]: Total
                  - columnheader "Acciones" [ref=e79]
              - rowgroup [ref=e80]:
                - row [ref=e81]:
                  - cell "B001-00000127" [ref=e82]
                  - cell "Camila Rojas" [ref=e83]
                  - cell "08/11/2026" [ref=e84]
                  - cell "Efectivo" [ref=e85]
                  - cell "-" [ref=e86]
                  - cell "Pagado" [ref=e87]
                  - cell "S/ 84.96" [ref=e89]
                  - cell [ref=e90]:
                    - button "Ver B001-00000127" [ref=e91] [cursor=pointer]: Ver detalle
                - row [ref=e92]:
                  - cell "B001-00000126" [ref=e93]
                  - cell "Maria Torres" [ref=e94]
                  - cell "08/11/2026" [ref=e95]
                  - cell "Efectivo" [ref=e96]
                  - cell "-" [ref=e97]
                  - cell "Pagado" [ref=e98]
                  - cell "S/ 42.48" [ref=e100]
                  - cell [ref=e101]:
                    - button "Ver B001-00000126" [ref=e102] [cursor=pointer]: Ver detalle
                - row [ref=e103]:
                  - cell "B001-00000125" [ref=e104]
                  - cell "Maria Torres" [ref=e105]
                  - cell "08/11/2026" [ref=e106]
                  - cell "Efectivo" [ref=e107]
                  - cell "-" [ref=e108]
                  - cell "Pagado" [ref=e109]
                  - cell "S/ 42.48" [ref=e111]
                  - cell [ref=e112]:
                    - button "Ver B001-00000125" [ref=e113] [cursor=pointer]: Ver detalle
                - row [ref=e114]:
                  - cell "F001-00000088" [ref=e115]
                  - cell "Luis Herrera" [ref=e116]
                  - cell "08/11/2026" [ref=e117]
                  - cell "Tarjeta" [ref=e118]
                  - cell "-" [ref=e119]
                  - cell "Pagado" [ref=e120]
                  - cell "S/ 145.00" [ref=e122]
                  - cell [ref=e123]:
                    - button "Ver F001-00000088" [ref=e124] [cursor=pointer]: Ver detalle
                - row [ref=e125]:
                  - cell "B001-00000124" [ref=e126]
                  - cell "Maria Torres" [ref=e127]
                  - cell "08/11/2026" [ref=e128]
                  - cell "Yape" [ref=e129]
                  - cell "-" [ref=e130]
                  - cell "Pagado" [ref=e131]
                  - cell "S/ 89.90" [ref=e133]
                  - cell [ref=e134]:
                    - button "Ver B001-00000124" [ref=e135] [cursor=pointer]: Ver detalle
                - row [ref=e136]:
                  - cell "B001-00000118" [ref=e137]
                  - cell "Jorge Salas" [ref=e138]
                  - cell "07/11/2026" [ref=e139]
                  - cell "Transferencia" [ref=e140]
                  - cell "-" [ref=e141]
                  - cell "Pagado" [ref=e142]
                  - cell "S/ 120.00" [ref=e144]
                  - cell [ref=e145]:
                    - button "Ver B001-00000118" [ref=e146] [cursor=pointer]: Ver detalle
                - row [ref=e147]:
                  - cell "B001-00000122" [ref=e148]
                  - cell "Camila Rojas" [ref=e149]
                  - cell "07/11/2026" [ref=e150]
                  - cell "Efectivo" [ref=e151]
                  - cell "-" [ref=e152]
                  - cell "Observado" [ref=e153]
                  - cell "S/ 65.00" [ref=e155]
                  - cell [ref=e156]:
                    - button "Ver B001-00000122" [ref=e157] [cursor=pointer]: Ver detalle
          - generic [ref=e158]:
            - status [ref=e159]: 1–7 de 7 registros
            - generic [ref=e160]:
              - text: Por página
              - combobox "Por página" [ref=e161]:
                - option "10" [selected]
                - option "25"
                - option "50"
            - generic [ref=e162]:
              - button "Anterior" [disabled] [ref=e163]
              - generic [ref=e164]: 1 / 1
              - button "Siguiente" [disabled] [ref=e165]
```

# Test source

```ts
  213 |   await evidencia(page, info, "CP03", "01-modal-totales");
  214 |   expect([sub, igv, tot]).toEqual([72, 12.96, 84.96]);
  215 |   await m.getByRole("button", { name: "Confirmar venta" }).click();
  216 |   await expect(sale.avisoExito).toBeVisible();
  217 |   obtenido(info, `Subtotal S/ ${sub.toFixed(2)}, IGV S/ ${igv.toFixed(2)}, total S/ ${tot.toFixed(2)}; la venta se registró.`);
  218 | });
  219 | 
  220 | test("CP04 - Venta con cantidad mayor al stock", async ({ page }, info) => {
  221 |   await ingresar(page, CUENTAS.cajero);
  222 |   const sale = new SalePage(page);
  223 |   await sale.abrirDesdeMenu();
  224 |   await sale.seleccionarCliente("43098765", "Jorge Salas");
  225 |   const cantidad = await sale.agregarProducto("PROD-005", "Power Bank 10000mAh", 1);
  226 |   await cantidad.fill("8");
  227 |   await cantidad.blur();
  228 |   await page.waitForTimeout(400);
  229 |   const valor = await cantidad.inputValue();
  230 |   const aviso = page.locator("main").getByText(/stock insuficiente/i);
  231 |   const hayAviso = (await aviso.count()) > 0 && (await aviso.first().isVisible());
  232 |   await evidencia(page, info, "CP04", "01-cantidad-solicitada-8");
  233 |   obtenido(
  234 |     info,
  235 |     hayAviso
  236 |       ? `Se solicitaron 8 unidades (stock 7): la cantidad queda en ${valor} y se muestra «${(await aviso.first().innerText()).trim()}».`
  237 |       : `Se solicitaron 8 unidades (stock 7): la cantidad se ajustó a ${valor} sin mostrar un mensaje de stock insuficiente.`,
  238 |   );
  239 |   expect(Number(valor)).toBeLessThanOrEqual(7);
  240 |   expect(hayAviso, "Debe mostrarse un mensaje de stock insuficiente").toBe(true);
  241 | });
  242 | 
  243 | test("CP23 - Venta con efectivo insuficiente", async ({ page }, info) => {
  244 |   await ingresar(page, CUENTAS.cajero);
  245 |   const sale = new SalePage(page);
  246 |   await sale.abrirDesdeMenu();
  247 |   await sale.seleccionarCliente("71234567", "Luis Herrera");
  248 |   await sale.agregarProducto("PROD-003", "Audifonos Bluetooth", 1);
  249 |   await sale.metodoPago.selectOption("EFECTIVO");
  250 |   await sale.efectivo.fill("10");
  251 |   await sale.revisarYCobrar.click();
  252 |   await page.waitForTimeout(400);
  253 |   const nativo = await sale.efectivo.evaluate((e: HTMLInputElement) => e.validationMessage);
  254 |   const mensaje = page.locator("main").getByText("El efectivo recibido no cubre el total.");
  255 |   const visible = (await mensaje.count()) > 0 && (await mensaje.first().isVisible());
  256 |   await expect(sale.modalConfirmacion).toHaveCount(0);
  257 |   await evidencia(page, info, "CP23", "01-venta-bloqueada");
  258 |   obtenido(
  259 |     info,
  260 |     visible
  261 |       ? "La venta se impide y se muestra el mensaje «El efectivo recibido no cubre el total.» en la página."
  262 |       : `La venta se bloquea, pero solo con el aviso nativo del navegador: «${nativo}».`,
  263 |   );
  264 |   expect(visible, "Debe mostrarse el mensaje de negocio en la página").toBe(true);
  265 | });
  266 | 
  267 | /* ----------------------------------------------------------------------------- HU04 – Historial */
  268 | test("CP07 - Historial de ventas del día", async ({ page }, info) => {
  269 |   await ingresar(page, CUENTAS.cajero);
  270 |   const pagos = new PaymentsPage(page);
  271 |   await irA(page, "Ventas y pagos");
  272 |   const hoy = fechaLima();
  273 |   await page.getByLabel("Desde").fill(hoy);
  274 |   await page.getByLabel("Hasta").fill(hoy);
  275 |   const filas = pagos.filas();
  276 |   await expect(filas.first()).toBeVisible();
  277 |   const n = await filas.count();
  278 |   const fechas = await filas.locator("td:nth-child(3)").allInnerTexts();
  279 |   await evidencia(page, info, "CP07", "01-historial-hoy");
  280 |   const conHora = fechas.every((f) => /\d{2}:\d{2}/.test(f));
  281 |   obtenido(info, `Se listan ${n} ventas del día; la columna Fecha muestra «${fechas[0].trim()}»${conHora ? " (con hora)" : " (sin hora)"}.`);
  282 |   expect(conHora, "Cada venta debe mostrar fecha y hora").toBe(true);
  283 | });
  284 | 
  285 | test("CP08 - Historial sin ventas en la fecha", async ({ page }, info) => {
  286 |   await ingresar(page, CUENTAS.cajero);
  287 |   await irA(page, "Ventas y pagos");
  288 |   const dia = fechaLima(10);
  289 |   await page.getByLabel("Desde").fill(dia);
  290 |   await page.getByLabel("Hasta").fill(dia);
  291 |   await expect(page.getByText("No hay información para mostrar.")).toBeVisible();
  292 |   await evidencia(page, info, "CP08", "01-sin-ventas");
  293 |   obtenido(info, `Para el ${dia} se muestra «No hay información para mostrar.».`);
  294 | });
  295 | 
  296 | /* ----------------------------------------------------------------------------- HU08 – Reportes */
  297 | test("CP15 - Reporte de ventas por rango de fechas", async ({ page }, info) => {
  298 |   await ingresar(page, CUENTAS.admin);
  299 |   await irA(page, "Ventas y pagos");
  300 |   await page.getByLabel("Desde").fill(fechaLima(1));
  301 |   await page.getByLabel("Hasta").fill(fechaLima());
  302 |   const n = await new PaymentsPage(page).filas().count();
  303 |   const resumen = page.getByRole("region", { name: "Resumen del periodo" });
  304 |   const hay = (await resumen.count()) > 0;
  305 |   await evidencia(page, info, "CP15", "01-ventas-rango", true);
  306 |   if (hay) {
  307 |     await expect(resumen).toContainText(/Monto total/i);
  308 |     await expect(resumen.locator("tbody tr").first()).toBeVisible();
  309 |     obtenido(info, `Se muestran ${n} comprobantes y el resumen del periodo: ${(await resumen.innerText()).replace(/\s+/g, " ").slice(0, 160)}…`);
  310 |   } else {
  311 |     obtenido(info, `El historial filtra ${n} comprobantes del rango, pero no muestra un resumen con productos vendidos, cantidades y monto total.`);
  312 |   }
> 313 |   expect(hay, "Debe mostrarse el resumen del periodo").toBe(true);
      |                                                        ^ Error: Debe mostrarse el resumen del periodo
  314 | });
  315 | 
  316 | test("CP16 - Reporte de inventario", async ({ page }, info) => {
  317 |   await ingresar(page, CUENTAS.admin);
  318 |   await irA(page, "Productos e inventario");
  319 |   const panel = page.locator('section[aria-label="Catálogo de productos"]');
  320 |   const texto = await panel.innerText();
  321 |   const total = Number(/(\d+) de (\d+) registros/.exec(texto)?.[2] ?? (await panel.locator("tbody tr").count()));
  322 |   await evidencia(page, info, "CP16", "01-catalogo", true);
  323 |   expect(total).toBe(9);
  324 |   obtenido(info, `El catálogo lista los ${total} productos registrados con stock, precio y disponibilidad.`);
  325 | });
  326 | 
  327 | /* ----------------------------------------------------------------------------- HU05 – Alertas */
  328 | async function alertas(page: Page) {
  329 |   const panel = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "Revisar existencias" }) });
  330 |   await expect(panel).toBeVisible();
  331 |   return (await panel.locator("li").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  332 | }
  333 | 
  334 | test("CP09 - Alerta de stock mínimo", async ({ page }, info) => {
  335 |   await ingresar(page, CUENTAS.admin);
  336 |   const lista = [...new Set(await alertas(page))];
  337 |   await evidencia(page, info, "CP09", "01-panel-alertas");
  338 |   expect(lista.some((t) => t.includes("PROD-005"))).toBe(true);
  339 |   expect(lista.some((t) => t.includes("PROD-008"))).toBe(true);
  340 |   obtenido(info, `El panel «Revisar existencias» muestra: ${lista.join(" · ")}.`);
  341 | });
  342 | 
  343 | test("CP10 - Orden de las alertas por urgencia", async ({ page }, info) => {
  344 |   await ingresar(page, CUENTAS.admin);
  345 |   const lista = [...new Set(await alertas(page))];
  346 |   await evidencia(page, info, "CP10", "01-orden-alertas");
  347 |   obtenido(info, `Orden mostrado: ${lista.map((t) => /PROD-\d+/.exec(t)?.[0]).join(" → ")}.`);
  348 |   expect(lista[0]).toContain("PROD-005");
  349 | });
  350 | 
  351 | /* ----------------------------------------------------------------------------- HU06 / HU10 – Compras */
  352 | /** Solicitud creada en CP11: la más reciente del seguimiento (la consulta ordena por fecha descendente). */
  353 | async function ultimaSolicitud(page: Page) {
  354 |   const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').first();
  355 |   await expect(fila).toBeVisible();
  356 |   return (await fila.locator("td").first().innerText()).trim();
  357 | }
  358 | 
  359 | test("CP11 - Crear solicitud de compra", async ({ page }, info) => {
  360 |   await ingresar(page, CUENTAS.admin);
  361 |   await irA(page, "Solicitudes de compra");
  362 |   await page.getByRole("button", { name: "Nueva solicitud" }).click();
  363 |   const modal = page.getByRole("dialog", { name: "Nueva solicitud de compra" });
  364 |   await modal.getByLabel("Prioridad").selectOption("ALTA");
  365 |   await modal.getByLabel("Fecha requerida").fill(new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10));
  366 |   const prov = modal.getByRole("combobox", { name: /Proveedor sugerido/ });
  367 |   await prov.click();
  368 |   await prov.fill("20123456789");
  369 |   await page.getByRole("option", { name: /Tecnologia Peru/ }).click();
  370 |   await modal.getByLabel("Justificación").fill("Reposición por stock mínimo de Power Bank 10000mAh");
  371 |   await modal.getByRole("group", { name: "Productos para solicitar" }).getByRole("searchbox").fill("PROD-005");
  372 |   await modal.getByRole("button", { name: "Agregar Power Bank 10000mAh" }).click();
  373 |   await modal.getByRole("spinbutton", { name: "Cantidad de Power Bank 10000mAh" }).fill("20");
  374 |   await evidencia(page, info, "CP11", "01-formulario");
  375 |   await modal.getByRole("button", { name: "Enviar a aprobación" }).click();
  376 |   await expect(modal).toHaveCount(0);
  377 |   const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').first();
  378 |   const solicitud = await ultimaSolicitud(page);
  379 |   await fila.getByRole("button", { name: /^Revisar / }).click();
  380 |   const det = page.getByRole("dialog", { name: solicitud });
  381 |   await expect(det).toContainText("Power Bank 10000mAh");
  382 |   await expect(det).toContainText("20");
  383 |   await expect(det).toContainText("Tecnologia Peru");
  384 |   await evidencia(page, info, "CP11", "02-detalle");
  385 |   obtenido(info, `Se registró ${solicitud} con PROD-005 × 20 y proveedor Tecnologia Peru S.A.C.`);
  386 | });
  387 | 
  388 | test("CP12 - Estado de la solicitud de compra", async ({ page }, info) => {
  389 |   await ingresar(page, CUENTAS.admin);
  390 |   await irA(page, "Solicitudes de compra");
  391 |   const solicitud = await ultimaSolicitud(page);
  392 |   const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').filter({ hasText: solicitud });
  393 |   await expect(fila).toContainText("Pendiente");
  394 |   await evidencia(page, info, "CP12", "01-estado-pendiente");
  395 |   obtenido(info, `${solicitud} figura con estado «Pendiente».`);
  396 | });
  397 | 
  398 | test("CP19 - Encargado de almacén visualiza solicitudes", async ({ page }, info) => {
  399 |   await ingresar(page, CUENTAS.almacen);
  400 |   await irA(page, "Solicitudes de compra");
  401 |   const solicitud = await ultimaSolicitud(page);
  402 |   const fila = page.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').filter({ hasText: solicitud });
  403 |   await fila.getByRole("button", { name: /^Revisar / }).click();
  404 |   const det = page.getByRole("dialog", { name: solicitud });
  405 |   await expect(det).toContainText("Power Bank 10000mAh");
  406 |   await expect(det).toContainText("Fecha requerida");
  407 |   await expect(det.getByRole("button", { name: "Confirmar decisión" })).toHaveCount(0);
  408 |   await evidencia(page, info, "CP19", "01-detalle-almacen");
  409 |   obtenido(info, "El encargado de almacén ve la solicitud con producto, cantidad y fecha requerida, sin opción de aprobar.");
  410 | });
  411 | 
  412 | /* ----------------------------------------------------------------------------- HU09 – Recepción */
  413 | test("CP17 - Recepción de mercadería suma stock", async ({ page, browser }, info) => {
```