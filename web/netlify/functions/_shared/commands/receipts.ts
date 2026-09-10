import type { AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import { loadProducts, nextNumber } from "./shared.js";
import type { ReceiptInput } from "./types.js";
import { commandItems, isoDate, normalizeText, optionalText } from "./validation.js";

export async function registerReceipt(input: ReceiptInput, user: AppUser): Promise<string> {
  const requested = commandItems(input.items);
  if (!requested.length) throw new HttpError(400, "Agrega al menos un producto recibido.");
  const purchaseNumber = normalizeText(input.purchaseNumber, "", 20);
  if (!purchaseNumber) throw new HttpError(400, "Selecciona una orden de compra.");

  return withTransaction(async (client) => {
    const purchase = await client.query<{ id_compra: number }>(
      "select id_compra from public.compras where numero = $1 and estado <> 'ANULADA' for update",
      [purchaseNumber],
    );
    if (!purchase.rows[0]) throw new HttpError(404, "La orden de compra indicada no existe.");
    const purchaseId = purchase.rows[0].id_compra;
    const products = await loadProducts(client, requested);
    const ordered = await client.query<{ id_producto: number; cantidad: number; recibido: number }>(
      `
      select dc.id_producto, dc.cantidad,
             coalesce((select sum(dr.cantidad)::int
                         from public.recepciones r
                         join public.detalles_recepcion dr on dr.id_recepcion = r.id_recepcion
                        where r.id_compra = dc.id_compra and dr.id_producto = dc.id_producto), 0) as recibido
        from public.detalles_compra dc where dc.id_compra = $1`,
      [purchaseId],
    );
    const balances = new Map(ordered.rows.map((row) => [row.id_producto, row.cantidad - row.recibido]));
    const valid = requested.map((item) => {
      const product = products.get(item.code)!;
      if (item.quantity > (balances.get(product.id_producto) ?? 0)) {
        throw new HttpError(400, `La cantidad de ${product.nombre} supera el saldo pendiente.`);
      }
      return { product, quantity: item.quantity };
    });

    const entryDate = isoDate(input.entryDate);
    const year = (entryDate ?? new Date().toISOString().slice(0, 10)).slice(0, 4);
    const number = await nextNumber(client, "recepciones", `REC-${year}-`, 4);
    const receipt = await client.query<{ id_recepcion: number }>(
      `
      insert into public.recepciones(numero, fecha, id_compra, id_usuario, guia, observacion)
      values (
        $1,
        coalesce($2::date::timestamp at time zone 'America/Lima', now()),
        $3,
        $4,
        $5,
        $6
      )
      returning id_recepcion`,
      [number, entryDate, purchaseId, user.id, optionalText(input.guide, 50), optionalText(input.notes)],
    );
    const receiptId = receipt.rows[0].id_recepcion;

    for (const line of valid) {
      const newStock = line.product.stock + line.quantity;
      await client.query(
        "insert into public.detalles_recepcion(id_recepcion, id_producto, cantidad) values ($1, $2, $3)",
        [receiptId, line.product.id_producto, line.quantity],
      );
      await client.query("update public.productos set stock = $1 where id_producto = $2", [
        newStock,
        line.product.id_producto,
      ]);
      await client.query(
        `
        insert into public.movimientos_inventario
          (fecha, id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, id_recepcion, id_usuario)
        values (
          coalesce($1::date::timestamp at time zone 'America/Lima', now()),
          $2,
          'COMPRA',
          $3,
          $4,
          $5,
          $6,
          $7
        )`,
        [
          entryDate,
          line.product.id_producto,
          line.quantity,
          line.product.stock,
          newStock,
          receiptId,
          user.id,
        ],
      );
    }

    const [status] = (
      await client.query<{ completed: boolean }>(
        `
      select bool_and(dc.cantidad <= coalesce(received.quantity, 0)) as completed
        from public.detalles_compra dc
        left join lateral (
          select sum(dr.cantidad)::int as quantity
            from public.recepciones r
            join public.detalles_recepcion dr on dr.id_recepcion = r.id_recepcion
           where r.id_compra = dc.id_compra and dr.id_producto = dc.id_producto
        ) received on true
       where dc.id_compra = $1`,
        [purchaseId],
      )
    ).rows;
    await client.query("update public.compras set estado = $1 where id_compra = $2", [
      status?.completed ? "RECIBIDA" : "PARCIAL",
      purchaseId,
    ]);
    return `Recepción ${number} registrada. El stock y la trazabilidad fueron actualizados.`;
  });
}
