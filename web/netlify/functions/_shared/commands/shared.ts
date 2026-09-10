import type { PoolClient } from "pg";
import { HttpError } from "../http.js";
import type { CommandLine, ProductRecord } from "./types.js";

export async function loadProducts(
  client: PoolClient,
  requested: CommandLine[],
): Promise<Map<string, ProductRecord>> {
  const codes = requested.map((item) => item.code);
  const result = await client.query<ProductRecord>(
    `
    select id_producto, codigo, nombre, precio_compra, precio_venta, stock
      from public.productos
     where estado = 'ACTIVO' and codigo = any($1::varchar[])
     for update`,
    [codes],
  );
  const products = new Map(result.rows.map((product) => [product.codigo.toUpperCase(), product]));
  const missing = codes.filter((code) => !products.has(code));

  if (missing.length) {
    throw new HttpError(400, `No se encontraron productos activos para los códigos: ${missing.join(", ")}.`);
  }

  return products;
}

export async function nextNumber(
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

export async function resolveClient(
  client: PoolClient,
  name: string,
  document: string | null,
): Promise<number> {
  const existing = await client.query<{ id_cliente: number }>(
    `
    select id_cliente from public.clientes
     where ($1::varchar is not null and documento = $1)
        or lower(trim(concat(nombres, ' ', apellidos))) = lower($2)
     limit 1`,
    [document, name],
  );
  if (existing.rows[0]) return existing.rows[0].id_cliente;

  const [firstName, ...surnameParts] = name.split(/\s+/).filter(Boolean);
  const inserted = await client.query<{ id_cliente: number }>(
    `
    insert into public.clientes(nombres, apellidos, documento, fecha_registro)
    values ($1, $2, $3, now()) returning id_cliente`,
    [firstName || "Cliente", surnameParts.join(" ") || null, document],
  );
  return inserted.rows[0].id_cliente;
}

export function currentYearInLima(now = new Date()): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: "America/Lima",
    year: "numeric",
  }).format(now);
}
