import type { AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import { loadProducts, nextNumber, resolveClient } from "./shared.js";
import type { ProductRecord, SaleInput } from "./types.js";
import { allowedOption, commandItems, normalizeText, optionalText, roundMoney } from "./validation.js";

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

  return withTransaction(async (client) => {
    const products = await loadProducts(client, requested);
    const clientId = await resolveClient(client, clientName, clientDocument);
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
    const sale = await client.query<{ id_venta: number }>(
      `
      insert into public.ventas(fecha, id_cliente, id_usuario, tipo_comprobante, serie, numero, subtotal, igv, total)
      values (now(), $1, $2, $3, $4, $5, $6, $7, $8) returning id_venta`,
      [clientId, user.id, receiptType, series, number, subtotal, igv, total],
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
      "insert into public.pagos(id_venta, fecha, metodo, estado, monto) values ($1, now(), $2, 'PAGADO', $3)",
      [saleId, paymentMethod, total],
    );
    return `Comprobante ${series}-${number} generado. La venta, el pago y el inventario fueron actualizados.`;
  });
}
