import type { AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import type { ClaimInput } from "./types.js";
import { allowedOption, normalizeText, optionalText } from "./validation.js";
import { minTextField, numberField } from "./fields.js";

export async function registerClaim(input: ClaimInput, user: AppUser): Promise<string> {
  const clientName = normalizeText(input.clientName, "", 160);
  if (!clientName && !input.clientId)
    throw new HttpError(400, "Ingresa el cliente y la descripción del reclamo.");
  const description = minTextField(input.description, "Descripción del reclamo", 10, 500);

  return withTransaction(async (client) => {
    const customer = await client.query<{ id_cliente: number }>(
      `
      select id_cliente
        from public.clientes
       where estado = 'ACTIVO' and (($2::int is not null and id_cliente=$2) or ($2::int is null and lower(trim(concat(nombres, ' ', apellidos))) = lower($1)))
       limit 1`,
      [clientName, input.clientId ? numberField(input.clientId, "Cliente", 1, true) : null],
    );
    if (!customer.rows[0]) throw new HttpError(404, "El cliente indicado no existe.");

    const receiptNumber = optionalText(input.receiptNumber, 20);
    const sale = receiptNumber
      ? await client.query<{ id_venta: number }>(
          "select id_venta from public.ventas where concat(serie, '-', numero) = $1 and id_cliente=$2 and estado='REGISTRADA' limit 1",
          [receiptNumber.toUpperCase(), customer.rows[0].id_cliente],
        )
      : null;
    if (receiptNumber && !sale?.rows[0]) {
      throw new HttpError(404, "El comprobante no existe o no pertenece al cliente seleccionado.");
    }

    await client.query(
      `
      insert into public.reclamos_cliente
        (fecha, id_cliente, id_venta, motivo, descripcion, canal, prioridad, id_usuario)
      values (now(), $1, $2, $3, $4, $5, $6, $7)`,
      [
        customer.rows[0].id_cliente,
        sale?.rows[0]?.id_venta ?? null,
        normalizeText(input.reason, "RECLAMO", 120),
        description,
        allowedOption(input.channel, "PRESENCIAL", ["PRESENCIAL", "TELEFONO", "CORREO"]),
        allowedOption(input.priority, "MEDIA", ["BAJA", "MEDIA", "ALTA"]),
        user.id,
      ],
    );
    return "Reclamo registrado y agregado a la bandeja de seguimiento.";
  });
}
