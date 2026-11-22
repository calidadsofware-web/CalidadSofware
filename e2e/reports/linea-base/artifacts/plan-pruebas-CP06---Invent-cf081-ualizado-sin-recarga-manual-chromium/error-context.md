# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-pruebas.spec.ts >> CP06 - Inventario actualizado sin recarga manual
- Location: tests/plan-pruebas.spec.ts:181:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 144
Received: 147
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
    - generic [ref=e34]:
      - text: Comprobante B001-00000126 generado. La venta, el pago y el inventario fueron actualizados.
      - button "Cerrar notificación" [ref=e35] [cursor=pointer]: Cerrar
    - main [ref=e36]:
      - generic [ref=e37]:
        - generic [ref=e38]:
          - heading "Nueva venta" [level=1] [ref=e39]
          - paragraph [ref=e40]: Selecciona el cliente, agrega productos y confirma el cobro.
        - link "Historial de ventas" [ref=e41] [cursor=pointer]:
          - /url: /pagos
      - status [ref=e42]:
        - text: Venta registrada. El pago y el inventario están actualizados.
        - link "Ver comprobante interno" [ref=e43] [cursor=pointer]:
          - /url: /pagos
      - group [ref=e45]:
        - generic [ref=e46]:
          - generic [ref=e47]:
            - generic [ref=e48]:
              - heading "1. Cliente" [level=2] [ref=e49]
              - button "Nuevo cliente" [ref=e50] [cursor=pointer]
            - generic [ref=e51]:
              - generic [ref=e52]: Buscar clienteObligatorio
              - combobox "Buscar cliente" [ref=e53]
          - generic [ref=e54]:
            - heading "2. Productos" [level=2] [ref=e56]
            - group "Productos de la venta" [ref=e57]:
              - generic [ref=e58]:
                - generic [ref=e59]:
                  - text: Buscar producto
                  - searchbox "Buscar producto" [ref=e60]: PROD-004
                - generic [ref=e61]:
                  - text: Categoría
                  - combobox "Categoría" [ref=e62]:
                    - option "Todas las categorías" [selected]
                    - option "Audio"
                    - option "Cables"
                    - option "Cargadores"
                    - option "Energia"
                    - option "Fundas"
                    - option "Protectores"
              - article [ref=e64]:
                - generic [ref=e65]:
                  - strong [ref=e66]: Mica templada 9H
                  - generic [ref=e67]: PROD-004 · Samsung
                  - generic [ref=e68]: 144 disponibles · S/ 12.00 sin IGV
                - button "Agregar Mica templada 9H" [ref=e69] [cursor=pointer]: Agregar
              - generic [ref=e70]:
                - generic [ref=e71]: 1 producto disponible
                - generic [ref=e72]:
                  - button "Anteriores" [disabled] [ref=e73]
                  - generic [ref=e74]: 1 / 1
                  - button "Más productos" [disabled] [ref=e75]
              - generic [ref=e76]:
                - heading "Detalle de productos" [level=3] [ref=e77]
                - generic [ref=e78]: 0 seleccionados
              - paragraph [ref=e79]: Busca un producto y pulsa Agregar para empezar.
        - complementary "Cobro de la venta" [ref=e80]:
          - heading "3. Cobro" [level=2] [ref=e81]
          - generic [ref=e82]:
            - generic [ref=e83]:
              - text: Tipo de comprobante
              - combobox "Tipo de comprobante" [ref=e84]:
                - option "Boleta" [selected]
                - option "Factura"
            - generic [ref=e85]:
              - generic [ref=e86]:
                - term [ref=e87]: Subtotal
                - definition [ref=e88]: S/ 0.00
              - generic [ref=e89]:
                - term [ref=e90]: IGV (18%)
                - definition [ref=e91]: S/ 0.00
              - generic [ref=e92]:
                - term [ref=e93]: Total a cobrar
                - definition [ref=e94]: S/ 0.00
            - generic [ref=e95]:
              - text: Método de pago
              - combobox "Método de pago" [ref=e96]:
                - option "Efectivo" [selected]
                - option "Tarjeta"
                - option "Yape"
                - option "Transferencia"
            - generic [ref=e97]:
              - generic [ref=e98]:
                - text: Efectivo recibido (S/)
                - spinbutton "Efectivo recibido (S/)" [ref=e99]
              - button "Importe exacto" [ref=e100] [cursor=pointer]
            - generic [ref=e101]:
              - text: Observación (opcional)
              - textbox "Observación (opcional)" [ref=e102]:
                - /placeholder: Entrega, garantía o indicaciones de la venta
            - button "Revisar y cobrar" [disabled] [ref=e103]
            - generic [ref=e104]: Registro comercial interno. No emite comprobantes electrónicos ante SUNAT.
```

# Test source

```ts
  93  | /* ----------------------------------------------------------------------------- HU01 – Búsqueda */
  94  | test("CP01 - Búsqueda de producto con resultados", async ({ page }, info) => {
  95  |   await ingresar(page, CUENTAS.cajero);
  96  |   const sale = new SalePage(page);
  97  |   await sale.abrirDesdeMenu();
  98  |   await sale.buscarProducto.fill("iPhone 14");
  99  |   const tarjeta = sale.tarjetaProducto("Funda iPhone 14");
  100 |   await expect(tarjeta).toContainText("PROD-001");
  101 |   await expect(tarjeta).toContainText("120 disponibles");
  102 |   await evidencia(page, info, "CP01", "01-resultado-iphone14");
  103 |   obtenido(info, "Se lista «Funda iPhone 14» (PROD-001) con 120 disponibles.");
  104 | });
  105 | 
  106 | test("CP02 - Búsqueda de producto sin resultados", async ({ page }, info) => {
  107 |   await ingresar(page, CUENTAS.cajero);
  108 |   const sale = new SalePage(page);
  109 |   await sale.abrirDesdeMenu();
  110 |   await sale.buscarProducto.fill("Nokia 3310");
  111 |   await expect(page.locator("article.catalog-product")).toHaveCount(0);
  112 |   const msg = page.getByText("No hay productos que coincidan con la búsqueda o el saldo disponible.");
  113 |   await expect(msg).toBeVisible();
  114 |   await evidencia(page, info, "CP02", "01-sin-resultados");
  115 |   obtenido(info, "Lista vacía y mensaje «No hay productos que coincidan con la búsqueda o el saldo disponible.».");
  116 | });
  117 | 
  118 | /* ----------------------------------------------------------------------------- HU07 – Catálogo */
  119 | test("CP13 - Registrar producto nuevo", async ({ page }, info) => {
  120 |   await ingresar(page, CUENTAS.admin);
  121 |   await irA(page, "Productos e inventario");
  122 |   await page.getByRole("button", { name: "Nuevo producto" }).click();
  123 |   const modal = page.getByRole("dialog", { name: "Nuevo producto" });
  124 |   await modal.getByLabel("SKU / Código interno").fill("PROD-009");
  125 |   await modal.getByLabel("Nombre comercial").fill("Funda Galaxy A55");
  126 |   await modal.getByLabel("Categoría").fill("Fundas");
  127 |   await modal.getByLabel("Marca").fill("Samsung");
  128 |   await modal.getByLabel("Descripción y compatibilidad (opcional)").fill("Compatible con Samsung Galaxy A55");
  129 |   await modal.getByLabel("Costo de compra (S/)").fill("12");
  130 |   await modal.getByLabel("Precio de venta sin IGV (S/)").fill("25");
  131 |   await modal.getByLabel("Stock mínimo").fill("5");
  132 |   await modal.getByLabel("Stock inicial").fill("30");
  133 |   await evidencia(page, info, "CP13", "01-formulario");
  134 |   await modal.getByRole("button", { name: /Guardar/ }).click();
  135 |   await expect(modal).toHaveCount(0);
  136 |   const sale = new SalePage(page);
  137 |   await sale.abrirDesdeMenu();
  138 |   await sale.buscarProducto.fill("Galaxy A55");
  139 |   await expect(sale.tarjetaProducto("Funda Galaxy A55")).toContainText("30 disponibles");
  140 |   await evidencia(page, info, "CP13", "02-disponible-en-venta");
  141 |   obtenido(info, "PROD-009 «Funda Galaxy A55» se guardó y aparece en la búsqueda de ventas con 30 disponibles.");
  142 | });
  143 | 
  144 | test("CP14 - Editar precio de producto", async ({ page }, info) => {
  145 |   await ingresar(page, CUENTAS.admin);
  146 |   await irA(page, "Productos e inventario");
  147 |   const panel = page.locator('section[aria-label="Catálogo de productos"]');
  148 |   await panel.getByRole("searchbox").fill("PROD-001");
  149 |   await page.getByRole("button", { name: "Editar Funda iPhone 14" }).click();
  150 |   const modal = page.getByRole("dialog", { name: "Editar producto" });
  151 |   await modal.getByLabel("Precio de venta sin IGV (S/)").fill("27");
  152 |   await modal.getByRole("button", { name: /Guardar/ }).click();
  153 |   await expect(modal).toHaveCount(0);
  154 |   const fila = panel.locator("tbody tr").filter({ hasText: "PROD-001" });
  155 |   await expect(fila).toContainText("27.00");
  156 |   await evidencia(page, info, "CP14", "01-precio-actualizado");
  157 |   obtenido(info, "El catálogo muestra el nuevo precio de PROD-001: S/ 27.00 sin IGV.");
  158 | });
  159 | 
  160 | /* ----------------------------------------------------------------------------- HU03 – Stock */
  161 | test("CP05 - Descuento automático de stock al vender", async ({ page, browser }, info) => {
  162 |   await ingresar(page, CUENTAS.cajero);
  163 |   const sale = new SalePage(page);
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
> 193 |   expect(visto).toBe(antes - 3);
      |                 ^ Error: expect(received).toBe(expected) // Object.is equality
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
```