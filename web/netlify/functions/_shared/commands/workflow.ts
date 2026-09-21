import { POLICIES, requireRole, type AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import { numberField, optionField, textField, type Fields } from "./fields.js";
import { currentYearInLima, nextNumber } from "./shared.js";
import { roundMoney } from "./validation.js";

export async function reviewPurchase(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.administration);
  const id = numberField(input.id, "Solicitud", 1, true);
  const decision = optionField(input.decision, ["APROBADA", "RECHAZADA"], "Decisión");
  const reason = textField(input.reason, "Motivo de la decisión", 250, true);
  return withTransaction(async (client) => {
    const row = (
      await client.query<{ id_proveedor: number | null; estado: string; observacion: string | null }>(
        "select id_proveedor,estado,observacion from public.solicitudes_compra where id_solicitud_compra=$1 for update",
        [id],
      )
    ).rows[0];
    if (!row) throw new HttpError(404, "Solicitud no encontrada.");
    if (row.estado !== "PENDIENTE") throw new HttpError(409, "Esta solicitud ya fue revisada.");
    let supplierId = row.id_proveedor;
    let number = "";
    if (decision === "APROBADA") {
      supplierId = numberField(input.supplierId ?? supplierId, "Proveedor", 1, true);
      const supplier = await client.query(
        "select id_proveedor from public.proveedores where id_proveedor=$1 and estado='ACTIVO'",
        [supplierId],
      );
      if (!supplier.rowCount)
        throw new HttpError(400, "Selecciona un proveedor activo para emitir la orden.");
      const lines = (
        await client.query<{ id_producto: number; cantidad: number; precio_compra: string }>(
          "select d.id_producto,d.cantidad,p.precio_compra from public.detalles_solicitud_compra d join public.productos p on p.id_producto=d.id_producto where d.id_solicitud_compra=$1 and p.estado='ACTIVO' for share of p",
          [id],
        )
      ).rows;
      const count = (
        await client.query<{ count: number }>(
          "select count(*)::int as count from public.detalles_solicitud_compra where id_solicitud_compra=$1",
          [id],
        )
      ).rows[0]?.count;
      if (!lines.length || lines.length !== count)
        throw new HttpError(
          400,
          "Revisa los productos de la solicitud; hay productos inactivos o faltantes.",
        );
      const subtotal = roundMoney(
        lines.reduce((sum, line) => sum + Number(line.precio_compra) * line.cantidad, 0),
      );
      const tax = roundMoney(subtotal * 0.18);
      number = await nextNumber(client, "compras", `OC-${currentYearInLima()}-`, 4);
      const purchaseId = (
        await client.query<{ id_compra: number }>(
          "insert into public.compras(numero,id_proveedor,id_usuario,id_solicitud_compra,subtotal,igv,total,observacion) values($1,$2,$3,$4,$5,$6,$7,$8) returning id_compra",
          [number, supplierId, user.id, id, subtotal, tax, roundMoney(subtotal + tax), reason],
        )
      ).rows[0].id_compra;
      for (const line of lines)
        await client.query(
          "insert into public.detalles_compra(id_compra,id_producto,cantidad,precio_compra) values($1,$2,$3,$4)",
          [purchaseId, line.id_producto, line.cantidad, line.precio_compra],
        );
    }
    const note = `${row.observacion ?? ""}\n${decision} por ${user.fullName}: ${reason}`.slice(-500);
    await client.query(
      "update public.solicitudes_compra set estado=$1,id_proveedor=$2,observacion=$3 where id_solicitud_compra=$4",
      [decision, supplierId, note, id],
    );
    return decision === "APROBADA"
      ? `Solicitud aprobada. Orden ${number} creada para recepción.`
      : "Solicitud rechazada con su motivo.";
  });
}

export async function updateClaim(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.sales);
  const id = numberField(input.id, "Reclamo", 1, true);
  const status = optionField(input.status, ["EN_REVISION", "ATENDIDO", "CERRADO"], "Estado");
  const resolution = textField(input.resolution, "Seguimiento o solución", 250, true);
  const previous: Record<string, string> = {
    EN_REVISION: "REGISTRADO",
    ATENDIDO: "EN_REVISION",
    CERRADO: "ATENDIDO",
  };
  return withTransaction(async (client) => {
    const result = await client.query(
      "update public.reclamos_cliente set estado=$1,observacion=$2 where id_reclamo=$3 and estado=$4 returning id_reclamo",
      [status, resolution, id, previous[status]],
    );
    if (!result.rowCount)
      throw new HttpError(
        409,
        "El estado del reclamo cambió o la transición no es válida. Actualiza la bandeja.",
      );
    return "Seguimiento del reclamo actualizado.";
  });
}

export async function cancelQuotation(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.quotations);
  const id = numberField(input.id, "Cotización", 1, true);
  const reason = textField(input.reason, "Motivo de cancelación", 250, true);
  return withTransaction(async (client) => {
    const result = await client.query(
      "update public.solicitudes_cotizacion set estado='CANCELADA',observacion=left(coalesce(observacion,'') || $1,500) where id_solicitud_cotizacion=$2 and estado='PENDIENTE' returning id_solicitud_cotizacion",
      [`\nCancelada por ${user.fullName}: ${reason}`, id],
    );
    if (!result.rowCount)
      throw new HttpError(409, "Solo se pueden cancelar solicitudes de cotización pendientes.");
    return "Solicitud de cotización cancelada.";
  });
}
