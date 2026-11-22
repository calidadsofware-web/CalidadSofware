# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-pruebas.spec.ts >> CP07 - Historial de ventas del día
- Location: tests/plan-pruebas.spec.ts:268:5

# Error details

```
Error: Cada venta debe mostrar fecha y hora

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
    - generic [ref=e21]:
      - strong [ref=e22]: caja Local
      - generic [ref=e23]: Cajero
      - button "Cerrar sesión" [ref=e24] [cursor=pointer]
  - generic [ref=e25]:
    - banner [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]: Espacio de trabajo
        - strong [ref=e29]: Ventas y pagos
      - generic [ref=e30]:
        - generic [ref=e31]: Entorno local
        - button "Actualizar" [ref=e32] [cursor=pointer]
    - main [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e35]:
          - heading "Ventas y pagos" [level=1] [ref=e36]
          - paragraph [ref=e37]: Consulta cobros, referencias y detalle de cada venta.
        - link "Nueva venta" [ref=e38] [cursor=pointer]:
          - /url: /ventas/nueva
      - region "Historial de ventas y pagos" [ref=e39]:
        - generic [ref=e40]:
          - generic [ref=e41]:
            - text: Buscar
            - searchbox "Buscar" [ref=e42]
          - generic [ref=e43]:
            - text: Método
            - combobox "Método" [ref=e44]:
              - option "Todos" [selected]
              - option "Efectivo"
              - option "Tarjeta"
              - option "Transferencia"
              - option "Yape"
          - generic [ref=e45]:
            - text: Estado
            - combobox "Estado" [ref=e46]:
              - option "Todos" [selected]
              - option "Observado"
              - option "Pagado"
          - generic [ref=e47]:
            - text: Desde
            - textbox "Desde" [ref=e48]: 2026-11-08
          - generic [ref=e49]:
            - text: Hasta
            - textbox "Hasta" [active] [ref=e50]: 2026-11-08
          - button "Limpiar filtros" [ref=e51] [cursor=pointer]
        - generic [ref=e52]:
          - region "Historial de ventas y pagos" [ref=e53]:
            - table [ref=e54]:
              - caption [ref=e55]: Historial de ventas y pagos
              - rowgroup [ref=e56]:
                - row [ref=e57]:
                  - columnheader [ref=e58]:
                    - button "Ordenar por Comprobante" [ref=e59] [cursor=pointer]: Comprobante
                  - columnheader [ref=e60]:
                    - button "Ordenar por Cliente" [ref=e61] [cursor=pointer]: Cliente
                  - columnheader [ref=e62]:
                    - button "Ordenar por Fecha" [ref=e63] [cursor=pointer]: Fecha
                  - columnheader [ref=e64]:
                    - button "Ordenar por Pago" [ref=e65] [cursor=pointer]: Pago
                  - columnheader [ref=e66]:
                    - button "Ordenar por Referencia" [ref=e67] [cursor=pointer]: Referencia
                  - columnheader [ref=e68]:
                    - button "Ordenar por Estado" [ref=e69] [cursor=pointer]: Estado
                  - columnheader [ref=e70]:
                    - button "Ordenar por Total" [ref=e71] [cursor=pointer]: Total
                  - columnheader "Acciones" [ref=e72]
              - rowgroup [ref=e73]:
                - row [ref=e74]:
                  - cell "B001-00000127" [ref=e75]
                  - cell "Camila Rojas" [ref=e76]
                  - cell "08/11/2026" [ref=e77]
                  - cell "Efectivo" [ref=e78]
                  - cell "-" [ref=e79]
                  - cell "Pagado" [ref=e80]
                  - cell "S/ 84.96" [ref=e82]
                  - cell [ref=e83]:
                    - button "Ver B001-00000127" [ref=e84] [cursor=pointer]: Ver detalle
                - row [ref=e85]:
                  - cell "B001-00000126" [ref=e86]
                  - cell "Maria Torres" [ref=e87]
                  - cell "08/11/2026" [ref=e88]
                  - cell "Efectivo" [ref=e89]
                  - cell "-" [ref=e90]
                  - cell "Pagado" [ref=e91]
                  - cell "S/ 42.48" [ref=e93]
                  - cell [ref=e94]:
                    - button "Ver B001-00000126" [ref=e95] [cursor=pointer]: Ver detalle
                - row [ref=e96]:
                  - cell "B001-00000125" [ref=e97]
                  - cell "Maria Torres" [ref=e98]
                  - cell "08/11/2026" [ref=e99]
                  - cell "Efectivo" [ref=e100]
                  - cell "-" [ref=e101]
                  - cell "Pagado" [ref=e102]
                  - cell "S/ 42.48" [ref=e104]
                  - cell [ref=e105]:
                    - button "Ver B001-00000125" [ref=e106] [cursor=pointer]: Ver detalle
                - row [ref=e107]:
                  - cell "F001-00000088" [ref=e108]
                  - cell "Luis Herrera" [ref=e109]
                  - cell "08/11/2026" [ref=e110]
                  - cell "Tarjeta" [ref=e111]
                  - cell "-" [ref=e112]
                  - cell "Pagado" [ref=e113]
                  - cell "S/ 145.00" [ref=e115]
                  - cell [ref=e116]:
                    - button "Ver F001-00000088" [ref=e117] [cursor=pointer]: Ver detalle
                - row [ref=e118]:
                  - cell "B001-00000124" [ref=e119]
                  - cell "Maria Torres" [ref=e120]
                  - cell "08/11/2026" [ref=e121]
                  - cell "Yape" [ref=e122]
                  - cell "-" [ref=e123]
                  - cell "Pagado" [ref=e124]
                  - cell "S/ 89.90" [ref=e126]
                  - cell [ref=e127]:
                    - button "Ver B001-00000124" [ref=e128] [cursor=pointer]: Ver detalle
          - generic [ref=e129]:
            - status [ref=e130]: 1–5 de 5 registros
            - generic [ref=e131]:
              - text: Por página
              - combobox "Por página" [ref=e132]:
                - option "10" [selected]
                - option "25"
                - option "50"
            - generic [ref=e133]:
              - button "Anterior" [disabled] [ref=e134]
              - generic [ref=e135]: 1 / 1
              - button "Siguiente" [disabled] [ref=e136]
```

# Test source

```ts
  182 |   const { ctx, page: admin } = await nuevaSesion(browser, CUENTAS.admin);
  183 |   await irA(admin, "Productos e inventario");
  184 |   const antes = await stockCatalogo(admin, "PROD-004");
  185 |   await ingresar(page, CUENTAS.cajero);
  186 |   await venderEfectivoExacto(page, ["45678912", "Maria Torres"], ["PROD-004", "Mica templada 9H"], 3);
  187 |   await irA(admin, "Inicio");
  188 |   await irA(admin, "Productos e inventario");
  189 |   const visto = await stockCatalogo(admin, "PROD-004");
  190 |   await evidencia(admin, info, "CP06", "01-inventario-admin");
  191 |   obtenido(info, `El cajero vendió 3 unidades. Sin pulsar «Actualizar», el administrador ve ${visto} unidades de PROD-004 (antes ${antes}, esperado ${antes - 3}).`);
  192 |   await ctx.close();
  193 |   expect(visto).toBe(antes - 3);
  194 | });
  195 | 
  196 | /* ----------------------------------------------------------------------------- HU02 – Venta */
  197 | test("CP03 - Cálculo de subtotal, IGV y total de la venta", async ({ page }, info) => {
  198 |   await ingresar(page, CUENTAS.cajero);
  199 |   const sale = new SalePage(page);
  200 |   await sale.abrirDesdeMenu();
  201 |   await sale.seleccionarCliente("70011223", "Camila Rojas");
  202 |   await sale.agregarProducto("PROD-002", "Cargador USB-C 20W", 2);
  203 |   await sale.agregarProducto("PROD-004", "Mica templada 9H", 1);
  204 |   await sale.tipoComprobante.selectOption("BOLETA");
  205 |   await sale.metodoPago.selectOption("EFECTIVO");
  206 |   await sale.efectivo.fill("100");
  207 |   await sale.revisarYCobrar.click();
  208 |   await expect(sale.modalConfirmacion).toBeVisible();
  209 |   const m = sale.modalConfirmacion;
  210 |   const [sub, igv, tot] = await Promise.all(
  211 |     (["Subtotal", "IGV (18%)", "Total a cobrar"] as const).map(async (c) => montoDe(await sale.valorResumen(c, m).first().innerText())),
  212 |   );
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
> 282 |   expect(conHora, "Cada venta debe mostrar fecha y hora").toBe(true);
      |                                                           ^ Error: Cada venta debe mostrar fecha y hora
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
  313 |   expect(hay, "Debe mostrarse el resumen del periodo").toBe(true);
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
```