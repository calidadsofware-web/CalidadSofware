import { dateField, minTextField, numberField } from "./fields.js";
import type { AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import { currentYearInLima, loadProducts, nextNumber } from "./shared.js";
import type { PurchaseRequestInput, QuotationInput } from "./types.js";
import { allowedOption, commandItems, normalizeText, optionalText, roundMoney } from "./validation.js";

export async function registerPurchaseRequest(input: PurchaseRequestInput, user: AppUser): Promise<string> {
  const requested = commandItems(input.items);
  if (!requested.length) {
    throw new HttpError(400, "Agrega al menos un producto antes de guardar la solicitud.");
  }

  return withTransaction(async (client) => {
    const products = await loadProducts(client, requested);
    const supplierName = optionalText(input.supplierName, 150);
    const supplier = input.supplierId
      ? await client.query<{ id_proveedor: number }>(
          "select id_proveedor from public.proveedores where id_proveedor=$1 and estado='ACTIVO'",
          [numberField(input.supplierId, "Proveedor", 1, true)],
        )
      : supplierName
        ? await client.query<{ id_proveedor: number }>(
            "select id_proveedor from public.proveedores where razon_social = $1 and estado = 'ACTIVO' limit 1",
            [supplierName],
          )
        : null;

    if ((input.supplierId || supplierName) && !supplier?.rows[0]) {
      throw new HttpError(404, "El proveedor seleccionado no está disponible.");
    }

    const valid = requested.map((item) => ({ product: products.get(item.code)!, quantity: item.quantity }));
    const prefix = `SC-${currentYearInLima()}-`;
    const number = await nextNumber(client, "solicitudes_compra", prefix, 4);
    const total = roundMoney(
      valid.reduce((sum, line) => sum + Number(line.product.precio_compra) * line.quantity, 0),
    );
    const inserted = await client.query<{ id_solicitud_compra: number }>(
      `
      insert into public.solicitudes_compra
        (numero, fecha, fecha_requerida, id_proveedor, id_usuario, prioridad, total_estimado, observacion)
      values ($1, now(), $2, $3, $4, $5, $6, $7) returning id_solicitud_compra`,
      [
        number,
        dateField(input.requiredDate, "Fecha requerida", "future"),
        supplier?.rows[0]?.id_proveedor ?? null,
        user.id,
        allowedOption(input.priority, "MEDIA", ["BAJA", "MEDIA", "ALTA"]),
        total,
        minTextField(input.justification, "Justificación", 10, 500),
      ],
    );

    for (const line of valid) {
      await client.query(
        "insert into public.detalles_solicitud_compra(id_solicitud_compra, id_producto, cantidad) values ($1, $2, $3)",
        [inserted.rows[0].id_solicitud_compra, line.product.id_producto, line.quantity],
      );
    }
    return `Solicitud ${number} registrada y agregada al seguimiento.`;
  });
}

export async function registerQuotation(input: QuotationInput, user: AppUser): Promise<string> {
  const requested = commandItems(input.items);
  const supplierIds = Array.isArray(input.supplierIds)
    ? [...new Set(input.supplierIds.map((value) => numberField(value, "Proveedor", 1, true)))]
    : [];
  const supplierNames = Array.isArray(input.supplierNames)
    ? [...new Set(input.supplierNames.map((value) => normalizeText(value, "", 150)).filter(Boolean))]
    : [];
  if (!requested.length || (!supplierIds.length && !supplierNames.length)) {
    throw new HttpError(400, "Selecciona al menos un producto y un proveedor.");
  }

  return withTransaction(async (client) => {
    const products = await loadProducts(client, requested);
    const suppliers = supplierIds.length
      ? await client.query<{ id_proveedor: number }>(
          "select id_proveedor from public.proveedores where estado='ACTIVO' and id_proveedor=any($1::int[])",
          [supplierIds],
        )
      : await client.query<{ id_proveedor: number }>(
          "select id_proveedor from public.proveedores where estado = 'ACTIVO' and razon_social = any($1::varchar[])",
          [supplierNames],
        );
    if (suppliers.rowCount !== (supplierIds.length || supplierNames.length)) {
      throw new HttpError(400, "Uno o más proveedores ya no están disponibles.");
    }

    const valid = requested.map((item) => ({ product: products.get(item.code)!, quantity: item.quantity }));
    const prefix = `COT-${currentYearInLima()}-`;
    const number = await nextNumber(client, "solicitudes_cotizacion", prefix, 4);
    const quotation = await client.query<{ id_solicitud_cotizacion: number }>(
      `
      insert into public.solicitudes_cotizacion(numero, fecha, fecha_limite, id_usuario, observacion)
      values ($1, now(), $2, $3, $4) returning id_solicitud_cotizacion`,
      [
        number,
        dateField(input.deadline, "Fecha límite", "future"),
        user.id,
        minTextField(input.notes, "Condiciones y observaciones", 10, 500),
      ],
    );
    const quotationId = quotation.rows[0].id_solicitud_cotizacion;

    for (const supplier of suppliers.rows) {
      await client.query(
        "insert into public.solicitudes_cotizacion_proveedores(id_solicitud_cotizacion, id_proveedor) values ($1, $2)",
        [quotationId, supplier.id_proveedor],
      );
    }
    for (const line of valid) {
      await client.query(
        "insert into public.detalles_solicitud_cotizacion(id_solicitud_cotizacion, id_producto, cantidad) values ($1, $2, $3)",
        [quotationId, line.product.id_producto, line.quantity],
      );
    }
    return `Solicitud ${number} registrada para ${suppliers.rowCount} proveedor(es). No se envían correos automáticamente.`;
  });
}
