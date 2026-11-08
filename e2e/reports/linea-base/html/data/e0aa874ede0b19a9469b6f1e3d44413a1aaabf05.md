# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-pruebas.spec.ts >> CP23 - Venta con efectivo insuficiente
- Location: tests/plan-pruebas.spec.ts:243:5

# Error details

```
Error: Debe mostrarse el mensaje de negocio en la página

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
        - strong [ref=e29]: Nueva venta
      - generic [ref=e30]:
        - generic [ref=e31]: Entorno local
        - button "Actualizar" [ref=e32] [cursor=pointer]
    - main [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e35]:
          - heading "Nueva venta" [level=1] [ref=e36]
          - paragraph [ref=e37]: Selecciona el cliente, agrega productos y confirma el cobro.
        - link "Historial de ventas" [ref=e38] [cursor=pointer]:
          - /url: /pagos
      - group [ref=e40]:
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]:
              - heading "1. Cliente" [level=2] [ref=e44]
              - button "Nuevo cliente" [ref=e45] [cursor=pointer]
            - generic [ref=e46]:
              - generic [ref=e47]: Buscar clienteObligatorio
              - combobox "Buscar cliente" [ref=e48]: Luis Herrera
              - generic [ref=e49]: 71234567 · 976543210
            - generic [ref=e50]:
              - generic [ref=e51]: "71234567"
              - generic [ref=e52]: Sin dirección registrada
          - generic [ref=e53]:
            - heading "2. Productos" [level=2] [ref=e55]
            - group "Productos de la venta" [ref=e56]:
              - generic [ref=e57]:
                - generic [ref=e58]:
                  - text: Buscar producto
                  - searchbox "Buscar producto" [ref=e59]: PROD-003
                - generic [ref=e60]:
                  - text: Categoría
                  - combobox "Categoría" [ref=e61]:
                    - option "Todas las categorías" [selected]
                    - option "Audio"
                    - option "Cables"
                    - option "Cargadores"
                    - option "Energia"
                    - option "Fundas"
                    - option "Protectores"
              - article [ref=e63]:
                - generic [ref=e64]:
                  - strong [ref=e65]: Audifonos Bluetooth
                  - generic [ref=e66]: PROD-003 · Generico
                  - generic [ref=e67]: 60 disponibles · S/ 45.00 sin IGV
                - button "Agregar Audifonos Bluetooth" [ref=e68] [cursor=pointer]: Agregar
              - generic [ref=e69]:
                - generic [ref=e70]: 1 producto disponible
                - generic [ref=e71]:
                  - button "Anteriores" [disabled] [ref=e72]
                  - generic [ref=e73]: 1 / 1
                  - button "Más productos" [disabled] [ref=e74]
              - generic [ref=e75]:
                - heading "Detalle de productos" [level=3] [ref=e76]
                - generic [ref=e77]: 1 seleccionado
              - generic [ref=e79]:
                - generic [ref=e80]:
                  - strong [ref=e81]: Audifonos Bluetooth
                  - generic [ref=e82]: PROD-003 · S/ 45.00 por unidad
                - generic [ref=e83]:
                  - text: Cantidad
                  - spinbutton "Cantidad de Audifonos Bluetooth" [ref=e84]: "1"
                - strong [ref=e85]: S/ 45.00
                - button "Quitar Audifonos Bluetooth" [ref=e86] [cursor=pointer]: Quitar
        - complementary "Cobro de la venta" [ref=e87]:
          - heading "3. Cobro" [level=2] [ref=e88]
          - generic [ref=e89]:
            - generic [ref=e90]:
              - text: Tipo de comprobante
              - combobox "Tipo de comprobante" [ref=e91]:
                - option "Boleta" [selected]
                - option "Factura"
            - generic [ref=e92]:
              - generic [ref=e93]:
                - term [ref=e94]: Subtotal
                - definition [ref=e95]: S/ 45.00
              - generic [ref=e96]:
                - term [ref=e97]: IGV (18%)
                - definition [ref=e98]: S/ 8.10
              - generic [ref=e99]:
                - term [ref=e100]: Total a cobrar
                - definition [ref=e101]: S/ 53.10
              - generic [ref=e102]:
                - term [ref=e103]: Vuelto
                - definition [ref=e104]: S/ 0.00
            - generic [ref=e105]:
              - text: Método de pago
              - combobox "Método de pago" [ref=e106]:
                - option "Efectivo" [selected]
                - option "Tarjeta"
                - option "Yape"
                - option "Transferencia"
            - generic [ref=e107]:
              - generic [ref=e108]:
                - text: Efectivo recibido (S/)
                - spinbutton "Efectivo recibido (S/)" [active] [ref=e109]: "10"
              - button "Importe exacto" [ref=e110] [cursor=pointer]
            - generic [ref=e111]:
              - text: Observación (opcional)
              - textbox "Observación (opcional)" [ref=e112]:
                - /placeholder: Entrega, garantía o indicaciones de la venta
            - button "Revisar y cobrar" [ref=e113] [cursor=pointer]
            - generic [ref=e114]: Registro comercial interno. No emite comprobantes electrónicos ante SUNAT.
```

# Test source

```ts
  164 |   await sale.abrirDesdeMenu();
  165 |   const antes = await sale.stockDisponible("PROD-004", "Mica templada 9H");
  166 |   await venderEfectivoExacto(page, ["45678912", "Maria Torres"], ["PROD-004", "Mica templada 9H"], 3);
  167 |   const despues = await sale.stockDisponible("PROD-004", "Mica templada 9H");
  168 |   expect(despues).toBe(antes - 3);
  169 |   await evidencia(page, info, "CP05", "01-stock-en-venta");
  170 |   const { ctx, page: admin } = await nuevaSesion(browser, CUENTAS.admin);
  171 |   await irA(admin, "Productos e inventario");
  172 |   await admin.getByRole("button", { name: "Movimientos de stock" }).click();
  173 |   const mov = admin.locator('section[aria-label="Movimientos de inventario"] tbody tr').filter({ hasText: "Mica templada 9H" }).first();
  174 |   await expect(mov).toContainText(/Venta/i);
  175 |   await expect(mov).toContainText(String(despues));
  176 |   await evidencia(admin, info, "CP05", "02-movimiento-venta");
  177 |   await ctx.close();
  178 |   obtenido(info, `Stock de PROD-004: ${antes} → ${despues}; se registró el movimiento de inventario tipo Venta.`);
  179 | });
  180 | 
  181 | test("CP06 - Inventario actualizado sin recarga manual", async ({ page, browser }, info) => {
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
> 264 |   expect(visible, "Debe mostrarse el mensaje de negocio en la página").toBe(true);
      |                                                                        ^ Error: Debe mostrarse el mensaje de negocio en la página
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
```