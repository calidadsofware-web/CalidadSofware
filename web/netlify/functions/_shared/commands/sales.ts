import type { AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import { loadProducts, nextNumber, resolveClient } from "./shared.js";
import type { ProductRecord, SaleInput } from "./types.js";
import { allowedOption, commandItems, normalizeText, optionalText, roundMoney } from "./validation.js";
import { numberField, textField } from "./fields.js";

const IGV_RATE = 0.18;

export async function registerSale(input: SaleInput, user: AppUser): Promise<string> {
  const requested = commandItems(input.items);
  if (!requested.length) {
    throw new HttpError(400, "Agrega al menos un producto antes de registrar la venta.");
  }

  const receiptType = allowedOption(input.receiptType, "BOLETA", ["BOLETA", "FACTURA"]);
  const paymentMethod = allowedOption(input.paymentMethod, "EFECTIVO", [
    "EFECTIVO",
    "TARJETA",
    "YAPE",
    "TRANSFERENCIA",
  ]);
  const clientName = normalizeText(input.clientName, "Cliente venta rápida", 160);
  const clientDocument = optionalText(input.clientDocument, 20);
  const reference = textField(input.reference, "Referencia del pago", 80, paymentMethod !== "EFECTIVO");
  const notes = textField(input.notes, "Observaciones", 250);

  return withTransaction(async (client) => {
    const products = await loadProducts(client, requested);
    const customer = input.clientId
      ? (
          await client.query<{ id_cliente: number; documento: string; direccion: string }>(
            "select id_cliente,documento,direccion from public.clientes where id_cliente=$1 and estado='ACTIVO' for share",
            [numberField(input.clientId, "Cliente", 1, true)],
          )
        ).rows[0]
      : null;
    if (input.clientId && !customer)
      throw new HttpError(404, "El cliente seleccionado no está activo. Actualiza la selección.");
    if (
      receiptType === "FACTURA" &&
      (!/^\d{11}$/.test(customer?.documento ?? clientDocument ?? "") || (customer && !customer.direccion))
    )
      throw new HttpError(
        400,
        "Para una factura, selecciona un cliente con RUC de 11 dígitos y dirección fiscal.",
      );
    const clientId = customer?.id_cliente ?? (await resolveClient(client, clientName, clientDocument));
    const series = receiptType === "FACTURA" ? "F001" : "B001";
    const number = await nextNumber(client, "ventas", "", 8);
    const lines: Array<{
      product: ProductRecord;
      quantity: number;
      price: number;
      previousStock: number;
    }> = [];

    for (const item of requested) {
      const product = products.get(item.code)!;
      if (item.quantity > product.stock) {
        throw new HttpError(
          409,
          `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}. Actualiza la venta e inténtalo nuevamente.`,
        );
      }
      lines.push({
        product,
        quantity: item.quantity,
        price: Number(product.precio_venta),
        previousStock: product.stock,
      });
    }

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));
    const igv = roundMoney(subtotal * IGV_RATE);
    const total = roundMoney(subtotal + igv);
    if (total <= 0) throw new HttpError(400, "El total de la venta debe ser mayor que cero.");
    if (
      paymentMethod === "EFECTIVO" &&
      input.cashReceived !== undefined &&
      numberField(input.cashReceived, "Efectivo recibido") < total
    )
      throw new HttpError(400, "El efectivo recibido no cubre el total de la venta.");
    const sale = await client.query<{ id_venta: number }>(
      `
      insert into public.ventas(fecha, id_cliente, id_usuario, tipo_comprobante, serie, numero, subtotal, igv, total, observacion)
      values (now(), $1, $2, $3, $4, $5, $6, $7, $8, $9) returning id_venta`,
      [clientId, user.id, receiptType, series, number, subtotal, igv, total, notes || null],
    );
    const saleId = sale.rows[0].id_venta;

    for (const line of lines) {
      const newStock = line.previousStock - line.quantity;
      await client.query(
        `insert into public.detalles_venta(id_venta, id_producto, cantidad, precio_unitario) values ($1, $2, $3, $4)`,
        [saleId, line.product.id_producto, line.quantity, line.price],
      );
      await client.query("update public.productos set stock = $1 where id_producto = $2", [
        newStock,
        line.product.id_producto,
      ]);
      await client.query(
        `
        insert into public.movimientos_inventario
          (fecha, id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, id_venta, id_usuario)
        values (now(), $1, 'VENTA', $2, $3, $4, $5, $6)`,
        [line.product.id_producto, line.quantity, line.previousStock, newStock, saleId, user.id],
      );
    }

    await client.query(
      "insert into public.pagos(id_venta, fecha, metodo, estado, monto, referencia) values ($1, now(), $2, 'PAGADO', $3, $4)",
      [saleId, paymentMethod, total, reference || null],
    );
    return `Comprobante ${series}-${number} generado. La venta, el pago y el inventario fueron actualizados.`;
  });
}
