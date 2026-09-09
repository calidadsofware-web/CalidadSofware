import type { PoolClient } from "pg";
import type { AppUser } from "./auth.js";
import { HttpError } from "./http.js";
import { withTransaction } from "./db.js";

const MAX_QUANTITY = 10_000;
const IGV_RATE = 0.18;

interface ItemInput {
  code?: unknown;
  quantity?: unknown;
}

interface ProductRecord {
  id_producto: number;
  codigo: string;
  nombre: string;
  precio_compra: string;
  precio_venta: string;
  stock: number;
}

export interface SaleInput {
  receiptType?: unknown;
  clientName?: unknown;
  clientDocument?: unknown;
  paymentMethod?: unknown;
  items?: unknown;
}

export interface ReceiptInput {
  purchaseNumber?: unknown;
  guide?: unknown;
  entryDate?: unknown;
  notes?: unknown;
  items?: unknown;
}

export interface PurchaseRequestInput {
  supplierName?: unknown;
  priority?: unknown;
  requiredDate?: unknown;
  justification?: unknown;
  items?: unknown;
}

export interface QuotationInput {
  deadline?: unknown;
  notes?: unknown;
  supplierNames?: unknown;
  items?: unknown;
}

export interface ClaimInput {
  clientName?: unknown;
  receiptNumber?: unknown;
  reason?: unknown;
  channel?: unknown;
  priority?: unknown;
  description?: unknown;
}

function text(value: unknown, fallback = "", maxLength = 500): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

function optionalText(value: unknown, maxLength = 500): string | null {
  const normalized = text(value, "", maxLength);
  return normalized || null;
}

function option(value: unknown, fallback: string, allowed: readonly string[]): string {
  const normalized = text(value, fallback, 40).toUpperCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function date(value: unknown): string | null {
  const normalized = text(value, "", 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function items(value: unknown): Array<{ code: string; quantity: number }> {
  if (!Array.isArray(value)) return [];
  const totals = new Map<string, number>();
  for (const raw of value as ItemInput[]) {
    const code = text(raw?.code, "", 30).toUpperCase();
    const parsed = Number(raw?.quantity);
    const quantity = Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 0), MAX_QUANTITY) : 0;
    if (code && quantity > 0) {
      totals.set(code, Math.min((totals.get(code) ?? 0) + quantity, MAX_QUANTITY));
    }
  }
  return [...totals].map(([code, quantity]) => ({ code, quantity }));
}

async function loadProducts(client: PoolClient, requested: Array<{ code: string; quantity: number }>): Promise<Map<string, ProductRecord>> {
  const codes = requested.map((item) => item.code);
  const result = await client.query<ProductRecord>(`
    select id_producto, codigo, nombre, precio_compra, precio_venta, stock
      from public.productos
     where estado = 'ACTIVO' and codigo = any($1::varchar[])
     for update`, [codes]);
  return new Map(result.rows.map((product) => [product.codigo.toUpperCase(), product]));
}

async function nextNumber(
  client: PoolClient,
  table: "ventas" | "recepciones" | "solicitudes_compra" | "solicitudes_cotizacion",
  prefix: string,
  width: number,
): Promise<string> {
  await client.query("select pg_advisory_xact_lock(hashtext($1))", [`datacell:${table}:${prefix}`]);
  const result = await client.query<{ numero: string | null }>(
    `select numero from public.${table} where numero is not null and numero like $1 order by numero desc limit 1`,
    [`${prefix}%`],
  );
  const current = result.rows[0]?.numero?.slice(prefix.length) ?? "0";
  const parsed = Number.parseInt(current, 10);
  return `${prefix}${String(Number.isFinite(parsed) ? parsed + 1 : 1).padStart(width, "0")}`;
}

async function resolveClient(client: PoolClient, name: string, document: string | null): Promise<number> {
  const existing = await client.query<{ id_cliente: number }>(`
    select id_cliente from public.clientes
     where ($1::varchar is not null and documento = $1)
        or trim(concat(nombres, ' ', apellidos)) = $2
     limit 1`, [document, name]);
  if (existing.rows[0]) return existing.rows[0].id_cliente;

  const [firstName, ...surnameParts] = name.split(/\s+/).filter(Boolean);
  const inserted = await client.query<{ id_cliente: number }>(`
    insert into public.clientes(nombres, apellidos, documento, fecha_registro)
    values ($1, $2, $3, now()) returning id_cliente`, [firstName || "Cliente", surnameParts.join(" ") || null, document]);
  return inserted.rows[0].id_cliente;
}

export async function registerSale(input: SaleInput, user: AppUser): Promise<string> {
  const requested = items(input.items);
  if (!requested.length) throw new HttpError(400, "Agrega al menos un producto antes de generar el CDP.");
  const receiptType = option(input.receiptType, "BOLETA", ["BOLETA", "FACTURA"]);
  const paymentMethod = option(input.paymentMethod, "EFECTIVO", ["EFECTIVO", "TARJETA", "YAPE", "TRANSFERENCIA"]);
  const clientName = text(input.clientName, "Cliente venta rápida", 160);
  const clientDocument = optionalText(input.clientDocument, 20);

  return withTransaction(async (client) => {
    const products = await loadProducts(client, requested);
    const clientId = await resolveClient(client, clientName, clientDocument);
    const series = receiptType === "FACTURA" ? "F001" : "B001";
    const number = await nextNumber(client, "ventas", "", 8);
    const lines: Array<{ product: ProductRecord; quantity: number; price: number; previousStock: number }> = [];
    let adjusted = false;
    for (const item of requested) {
      const product = products.get(item.code);
      if (!product) continue;
      const quantity = Math.min(item.quantity, product.stock);
      adjusted ||= quantity !== item.quantity;
      if (quantity > 0) lines.push({ product, quantity, price: Number(product.precio_venta), previousStock: product.stock });
    }
    if (!lines.length) throw new HttpError(400, "Los productos seleccionados no tienen stock disponible.");

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const igv = Math.round(subtotal * IGV_RATE * 100) / 100;
    const total = subtotal + igv;
    const sale = await client.query<{ id_venta: number }>(`
      insert into public.ventas(fecha, id_cliente, id_usuario, tipo_comprobante, serie, numero, subtotal, igv, total)
      values (now(), $1, $2, $3, $4, $5, $6, $7, $8) returning id_venta`,
      [clientId, user.id, receiptType, series, number, subtotal, igv, total]);
    const saleId = sale.rows[0].id_venta;

    for (const line of lines) {
      const newStock = line.previousStock - line.quantity;
      await client.query(`insert into public.detalles_venta(id_venta, id_producto, cantidad, precio_unitario) values ($1, $2, $3, $4)`,
        [saleId, line.product.id_producto, line.quantity, line.price]);
      await client.query(`update public.productos set stock = $1 where id_producto = $2`, [newStock, line.product.id_producto]);
      await client.query(`
        insert into public.movimientos_inventario
          (fecha, id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, id_venta, id_usuario)
        values (now(), $1, 'VENTA', $2, $3, $4, $5, $6)`,
        [line.product.id_producto, line.quantity, line.previousStock, newStock, saleId, user.id]);
    }
    await client.query(`insert into public.pagos(id_venta, fecha, metodo, estado, monto) values ($1, now(), $2, 'PAGADO', $3)`,
      [saleId, paymentMethod, total]);
    const document = `${series}-${number}`;
    return adjusted
      ? `CDP ${document} generado; las cantidades se ajustaron al stock disponible.`
      : `CDP ${document} generado correctamente. Venta, pago e inventario fueron actualizados.`;
  });
}

export async function registerReceipt(input: ReceiptInput, user: AppUser): Promise<string> {
  const requested = items(input.items);
  if (!requested.length) throw new HttpError(400, "Agrega al menos un producto recibido.");
  const purchaseNumber = text(input.purchaseNumber, "", 20);
  if (!purchaseNumber) throw new HttpError(400, "Selecciona una orden de compra.");

  return withTransaction(async (client) => {
    const purchase = await client.query<{ id_compra: number }>(
      `select id_compra from public.compras where numero = $1 and estado <> 'ANULADA' for update`, [purchaseNumber]);
    if (!purchase.rows[0]) throw new HttpError(404, "La orden de compra indicada no existe.");
    const purchaseId = purchase.rows[0].id_compra;
    const products = await loadProducts(client, requested);
    const ordered = await client.query<{ id_producto: number; cantidad: number; recibido: number }>(`
      select dc.id_producto, dc.cantidad,
             coalesce((select sum(dr.cantidad)::int
                         from public.recepciones r
                         join public.detalles_recepcion dr on dr.id_recepcion = r.id_recepcion
                        where r.id_compra = dc.id_compra and dr.id_producto = dc.id_producto), 0) as recibido
        from public.detalles_compra dc where dc.id_compra = $1`, [purchaseId]);
    const balances = new Map(ordered.rows.map((row) => [row.id_producto, row.cantidad - row.recibido]));
    const valid = requested.flatMap((item) => {
      const product = products.get(item.code);
      if (!product) return [];
      if (item.quantity > (balances.get(product.id_producto) ?? 0)) {
        throw new HttpError(400, `La cantidad de ${product.nombre} supera el saldo pendiente.`);
      }
      return [{ product, quantity: item.quantity }];
    });
    if (!valid.length) throw new HttpError(400, "Ningún producto recibido pertenece a la orden.");

    const entryDate = date(input.entryDate);
    const year = Number((entryDate ?? new Date().toISOString().slice(0, 10)).slice(0, 4));
    const number = await nextNumber(client, "recepciones", `REC-${year}-`, 4);
    const receipt = await client.query<{ id_recepcion: number }>(`
      insert into public.recepciones(numero, fecha, id_compra, id_usuario, guia, observacion)
      values ($1, coalesce($2::date::timestamptz, now()), $3, $4, $5, $6) returning id_recepcion`,
      [number, entryDate, purchaseId, user.id, optionalText(input.guide, 50), optionalText(input.notes)]);
    const receiptId = receipt.rows[0].id_recepcion;
    for (const line of valid) {
      const newStock = line.product.stock + line.quantity;
      await client.query(`insert into public.detalles_recepcion(id_recepcion, id_producto, cantidad) values ($1, $2, $3)`,
        [receiptId, line.product.id_producto, line.quantity]);
      await client.query(`update public.productos set stock = $1 where id_producto = $2`, [newStock, line.product.id_producto]);
      await client.query(`
        insert into public.movimientos_inventario
          (fecha, id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, id_recepcion, id_usuario)
        values (coalesce($1::date::timestamptz, now()), $2, 'COMPRA', $3, $4, $5, $6, $7)`,
        [entryDate, line.product.id_producto, line.quantity, line.product.stock, newStock, receiptId, user.id]);
    }
    const [status] = (await client.query<{ completed: boolean }>(`
      select bool_and(dc.cantidad <= coalesce(received.quantity, 0)) as completed
        from public.detalles_compra dc
        left join lateral (
          select sum(dr.cantidad)::int as quantity
            from public.recepciones r
            join public.detalles_recepcion dr on dr.id_recepcion = r.id_recepcion
           where r.id_compra = dc.id_compra and dr.id_producto = dc.id_producto
        ) received on true
       where dc.id_compra = $1`, [purchaseId])).rows;
    await client.query(`update public.compras set estado = $1 where id_compra = $2`,
      [status?.completed ? "RECIBIDA" : "PARCIAL", purchaseId]);
    return `Ingreso ${number} registrado. Stock y trazabilidad fueron actualizados.`;
  });
}

export async function registerPurchaseRequest(input: PurchaseRequestInput, user: AppUser): Promise<string> {
  const requested = items(input.items);
  if (!requested.length) throw new HttpError(400, "Agrega al menos un producto antes de guardar la solicitud.");
  return withTransaction(async (client) => {
    const products = await loadProducts(client, requested);
    const supplierName = optionalText(input.supplierName, 150);
    const supplier = supplierName
      ? await client.query<{ id_proveedor: number }>(`select id_proveedor from public.proveedores where razon_social = $1 and estado = 'ACTIVO' limit 1`, [supplierName])
      : null;
    const valid = requested.flatMap((item) => {
      const product = products.get(item.code);
      return product ? [{ product, quantity: item.quantity }] : [];
    });
    if (!valid.length) throw new HttpError(400, "No se encontraron productos válidos.");
    const prefix = `SC-${new Date().getUTCFullYear()}-`;
    const number = await nextNumber(client, "solicitudes_compra", prefix, 4);
    const total = valid.reduce((sum, line) => sum + Number(line.product.precio_compra) * line.quantity, 0);
    const inserted = await client.query<{ id_solicitud_compra: number }>(`
      insert into public.solicitudes_compra
        (numero, fecha, fecha_requerida, id_proveedor, id_usuario, prioridad, total_estimado, observacion)
      values ($1, now(), $2, $3, $4, $5, $6, $7) returning id_solicitud_compra`,
      [number, date(input.requiredDate), supplier?.rows[0]?.id_proveedor ?? null, user.id,
        option(input.priority, "MEDIA", ["BAJA", "MEDIA", "ALTA"]), total, optionalText(input.justification)]);
    for (const line of valid) {
      await client.query(`insert into public.detalles_solicitud_compra(id_solicitud_compra, id_producto, cantidad) values ($1, $2, $3)`,
        [inserted.rows[0].id_solicitud_compra, line.product.id_producto, line.quantity]);
    }
    return `Solicitud ${number} registrada y agregada al seguimiento.`;
  });
}

export async function registerQuotation(input: QuotationInput, user: AppUser): Promise<string> {
  const requested = items(input.items);
  const supplierNames = Array.isArray(input.supplierNames)
    ? [...new Set(input.supplierNames.map((value) => text(value, "", 150)).filter(Boolean))]
    : [];
  if (!requested.length || !supplierNames.length) throw new HttpError(400, "Selecciona al menos un producto y un proveedor.");
  return withTransaction(async (client) => {
    const products = await loadProducts(client, requested);
    const suppliers = await client.query<{ id_proveedor: number }>(
      `select id_proveedor from public.proveedores where estado = 'ACTIVO' and razon_social = any($1::varchar[])`, [supplierNames]);
    if (!suppliers.rowCount) throw new HttpError(400, "No se encontraron proveedores válidos.");
    const valid = requested.flatMap((item) => {
      const product = products.get(item.code);
      return product ? [{ product, quantity: item.quantity }] : [];
    });
    if (!valid.length) throw new HttpError(400, "No se encontraron productos válidos para cotizar.");
    const prefix = `COT-${new Date().getUTCFullYear()}-`;
    const number = await nextNumber(client, "solicitudes_cotizacion", prefix, 4);
    const quotation = await client.query<{ id_solicitud_cotizacion: number }>(`
      insert into public.solicitudes_cotizacion(numero, fecha, fecha_limite, id_usuario, observacion)
      values ($1, now(), $2, $3, $4) returning id_solicitud_cotizacion`,
      [number, date(input.deadline), user.id, optionalText(input.notes)]);
    const id = quotation.rows[0].id_solicitud_cotizacion;
    for (const supplier of suppliers.rows) {
      await client.query(`insert into public.solicitudes_cotizacion_proveedores(id_solicitud_cotizacion, id_proveedor) values ($1, $2)`,
        [id, supplier.id_proveedor]);
    }
    for (const line of valid) {
      await client.query(`insert into public.detalles_solicitud_cotizacion(id_solicitud_cotizacion, id_producto, cantidad) values ($1, $2, $3)`,
        [id, line.product.id_producto, line.quantity]);
    }
    return `Solicitud ${number} enviada a ${suppliers.rowCount} proveedor(es).`;
  });
}

export async function registerClaim(input: ClaimInput, user: AppUser): Promise<string> {
  const clientName = text(input.clientName, "", 160);
  const description = text(input.description, "", 500);
  if (!clientName || !description) throw new HttpError(400, "Ingresa el cliente y la descripción del reclamo.");
  return withTransaction(async (client) => {
    const customer = await client.query<{ id_cliente: number }>(`
      select id_cliente from public.clientes where trim(concat(nombres, ' ', apellidos)) = $1 limit 1`, [clientName]);
    if (!customer.rows[0]) throw new HttpError(404, "El cliente indicado no existe.");
    const receiptNumber = optionalText(input.receiptNumber, 20);
    const sale = receiptNumber
      ? await client.query<{ id_venta: number }>(`select id_venta from public.ventas where concat(serie, '-', numero) = $1 limit 1`, [receiptNumber])
      : null;
    await client.query(`
      insert into public.reclamos_cliente
        (fecha, id_cliente, id_venta, motivo, descripcion, canal, prioridad, id_usuario)
      values (now(), $1, $2, $3, $4, $5, $6, $7)`,
      [customer.rows[0].id_cliente, sale?.rows[0]?.id_venta ?? null, text(input.reason, "RECLAMO", 120), description,
        text(input.channel, "PRESENCIAL", 30).toUpperCase(), option(input.priority, "MEDIA", ["BAJA", "MEDIA", "ALTA"]), user.id]);
    return "Reclamo registrado y agregado a la bandeja de seguimiento.";
  });
}
