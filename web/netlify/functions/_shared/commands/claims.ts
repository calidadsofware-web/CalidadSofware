import type { AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import type { ClaimInput } from "./types.js";
import { allowedOption, normalizeText, optionalText } from "./validation.js";

export async function registerClaim(input: ClaimInput, user: AppUser): Promise<string> {
  const clientName = normalizeText(input.clientName, "", 160);
  const description = normalizeText(input.description, "", 500);
  if (!clientName || !description) {
    throw new HttpError(400, "Ingresa el cliente y la descripción del reclamo.");
  }

  return withTransaction(async (client) => {
    const customer = await client.query<{ id_cliente: number }>(
      `
      select id_cliente
        from public.clientes
       where lower(trim(concat(nombres, ' ', apellidos))) = lower($1)
       limit 1`,
      [clientName],
    );
    if (!customer.rows[0]) throw new HttpError(404, "El cliente indicado no existe.");

    const receiptNumber = optionalText(input.receiptNumber, 20);
    const sale = receiptNumber
      ? await client.query<{ id_venta: number }>(
          "select id_venta from public.ventas where concat(serie, '-', numero) = $1 limit 1",
          [receiptNumber.toUpperCase()],
        )
      : null;
    if (receiptNumber && !sale?.rows[0]) {
      throw new HttpError(404, "El comprobante indicado no existe.");
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
