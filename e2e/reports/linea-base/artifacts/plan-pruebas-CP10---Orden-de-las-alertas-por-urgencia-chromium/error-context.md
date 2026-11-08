# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-pruebas.spec.ts >> CP10 - Orden de las alertas por urgencia
- Location: tests/plan-pruebas.spec.ts:343:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "PROD-005"
Received string:    "Mica templada Galaxy A55 PROD-008 · 8 unidades · Mínimo 10"
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
        - strong [ref=e36]: Inicio
      - generic [ref=e37]:
        - generic [ref=e38]: Entorno local
        - button "Actualizar" [ref=e39] [cursor=pointer]
    - main [ref=e40]:
      - generic [ref=e42]:
        - heading "Hola, admin" [level=1] [ref=e43]
        - paragraph [ref=e44]: Tu espacio para resolver las tareas del día.
      - generic [ref=e45]:
        - heading "Acciones frecuentes" [level=2] [ref=e47]
        - generic [ref=e48]:
          - link "Registrar una venta Cliente, productos y cobro en un mismo flujo." [ref=e49] [cursor=pointer]:
            - /url: /ventas/nueva
            - strong [ref=e50]: Registrar una venta
            - generic [ref=e51]: Cliente, productos y cobro en un mismo flujo.
          - link "Recibir mercadería Confirma cantidades contra una orden de compra." [ref=e52] [cursor=pointer]:
            - /url: /recepciones/nueva
            - strong [ref=e53]: Recibir mercadería
            - generic [ref=e54]: Confirma cantidades contra una orden de compra.
          - link "Solicitar abastecimiento Indica qué hace falta y para cuándo lo necesitas." [ref=e55] [cursor=pointer]:
            - /url: /solicitudes
            - strong [ref=e56]: Solicitar abastecimiento
            - generic [ref=e57]: Indica qué hace falta y para cuándo lo necesitas.
          - link "Consultar productos Busca precios, existencias y disponibilidad." [ref=e58] [cursor=pointer]:
            - /url: /productos
            - strong [ref=e59]: Consultar productos
            - generic [ref=e60]: Busca precios, existencias y disponibilidad.
          - link "Atender un reclamo Registra el caso y da seguimiento a su solución." [ref=e61] [cursor=pointer]:
            - /url: /reclamos
            - strong [ref=e62]: Atender un reclamo
            - generic [ref=e63]: Registra el caso y da seguimiento a su solución.
          - link "Gestionar proveedores Mantén el directorio comercial al día." [ref=e64] [cursor=pointer]:
            - /url: /proveedores
            - strong [ref=e65]: Gestionar proveedores
            - generic [ref=e66]: Mantén el directorio comercial al día.
          - link "Administrar equipo Crea usuarios y asigna sus permisos." [ref=e67] [cursor=pointer]:
            - /url: /usuarios
            - strong [ref=e68]: Administrar equipo
            - generic [ref=e69]: Crea usuarios y asigna sus permisos.
      - generic [ref=e70]:
        - generic [ref=e71]:
          - heading "Pendientes de trabajo" [level=2] [ref=e72]
          - list [ref=e73]:
            - listitem [ref=e74]:
              - link "SC-2026-0007 Revisar solicitud y decidir su aprobación." [ref=e75] [cursor=pointer]:
                - /url: /solicitudes
                - strong [ref=e76]: SC-2026-0007
                - generic [ref=e77]: Revisar solicitud y decidir su aprobación.
            - listitem [ref=e78]:
              - 'link "Reclamo #1 · Camila Rojas Producto defectuoso · Registrado" [ref=e79] [cursor=pointer]':
                - /url: /reclamos
                - strong [ref=e80]: "Reclamo #1 · Camila Rojas"
                - generic [ref=e81]: Producto defectuoso · Registrado
            - listitem [ref=e82]:
              - 'link "Reclamo #2 · Maria Torres Cambio solicitado · Registrado" [ref=e83] [cursor=pointer]':
                - /url: /reclamos
                - strong [ref=e84]: "Reclamo #2 · Maria Torres"
                - generic [ref=e85]: Cambio solicitado · Registrado
            - listitem [ref=e86]:
              - 'link "Reclamo #3 · Luis Herrera Atencion recibida · Registrado" [ref=e87] [cursor=pointer]':
                - /url: /reclamos
                - strong [ref=e88]: "Reclamo #3 · Luis Herrera"
                - generic [ref=e89]: Atencion recibida · Registrado
            - listitem [ref=e90]:
              - link "OC-2026-0006 Mercadería pendiente · CompuSolutions S.A.C." [ref=e91] [cursor=pointer]:
                - /url: /recepciones/nueva
                - strong [ref=e92]: OC-2026-0006
                - generic [ref=e93]: Mercadería pendiente · CompuSolutions S.A.C.
            - listitem [ref=e94]:
              - link "OC-2026-0005 Mercadería pendiente · Importaciones Movil E.I.R.L." [ref=e95] [cursor=pointer]:
                - /url: /recepciones/nueva
                - strong [ref=e96]: OC-2026-0005
                - generic [ref=e97]: Mercadería pendiente · Importaciones Movil E.I.R.L.
        - generic [ref=e98]:
          - generic [ref=e99]:
            - heading "Revisar existencias" [level=2] [ref=e100]
            - link "Ver inventario" [ref=e101] [cursor=pointer]:
              - /url: /productos
          - list [ref=e102]:
            - listitem [ref=e103]:
              - link "Mica templada Galaxy A55 PROD-008 · 8 unidades · Mínimo 10" [ref=e104] [cursor=pointer]:
                - /url: /productos
                - strong [ref=e105]: Mica templada Galaxy A55
                - generic [ref=e106]: PROD-008 · 8 unidades · Mínimo 10
            - listitem [ref=e107]:
              - link "Power Bank 10000mAh PROD-005 · 7 unidades · Mínimo 10" [ref=e108] [cursor=pointer]:
                - /url: /productos
                - strong [ref=e109]: Power Bank 10000mAh
                - generic [ref=e110]: PROD-005 · 7 unidades · Mínimo 10
```

# Test source

```ts
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
> 348 |   expect(lista[0]).toContain("PROD-005");
      |                    ^ Error: expect(received).toContain(expected) // indexOf
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
  414 |   // Precondición: el administrador aprueba la solicitud de CP11 y se genera la orden de compra.
  415 |   const { ctx, page: admin } = await nuevaSesion(browser, CUENTAS.admin);
  416 |   await irA(admin, "Solicitudes de compra");
  417 |   const solicitud = await ultimaSolicitud(admin);
  418 |   await admin.locator('section[aria-label="Seguimiento de solicitudes"] tbody tr').filter({ hasText: solicitud }).getByRole("button", { name: /^Revisar / }).click();
  419 |   const det = admin.getByRole("dialog", { name: solicitud });
  420 |   await det.locator("fieldset select").first().selectOption("APROBADA");
  421 |   const prov = det.getByRole("combobox", { name: /Proveedor de la orden/ });
  422 |   if (!(await prov.inputValue())) {
  423 |     await prov.click();
  424 |     await prov.fill("20123456789");
  425 |     await admin.getByRole("option", { name: /Tecnologia Peru/ }).click();
  426 |   }
  427 |   await det.getByLabel("Motivo de la decisión").fill("Aprobada por stock mínimo");
  428 |   await det.getByRole("button", { name: "Confirmar decisión" }).click();
  429 |   await expect(det).toHaveCount(0);
  430 |   await ctx.close();
  431 | 
  432 |   await ingresar(page, CUENTAS.almacen);
  433 |   await irA(page, "Recepciones");
  434 |   const orden = page.getByRole("combobox", { name: /Orden de compra pendiente/ });
  435 |   await orden.click();
  436 |   await orden.fill("Tecnologia");
  437 |   const opcion = page.getByRole("option", { name: /Tecnologia Peru/ }).first();
  438 |   const numeroOrden = (/OC-\d{4}-\d{4}/.exec(await opcion.innerText()) ?? [""])[0];
  439 |   await opcion.click();
  440 |   await page.getByLabel("Guía / Documento de entrega").fill("T001-00009001");
  441 |   await page.getByRole("group", { name: "Productos pendientes de la orden" }).getByRole("searchbox").fill("PROD-005");
  442 |   await page.getByRole("button", { name: "Agregar Power Bank 10000mAh" }).click();
  443 |   await page.getByRole("spinbutton", { name: "Cantidad de Power Bank 10000mAh" }).fill("20");
  444 |   await evidencia(page, info, "CP17", "01-recepcion");
  445 |   await page.getByRole("button", { name: "Registrar recepción" }).click();
  446 |   await expect(page.getByRole("status").filter({ hasText: "Recepción registrada" })).toBeVisible();
  447 |   await irA(page, "Productos e inventario");
  448 |   const stock = await stockCatalogo(page, "PROD-005");
```