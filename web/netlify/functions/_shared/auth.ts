import { createClient } from "@supabase/supabase-js";
import type { PoolClient } from "pg";
import { query } from "./db.js";
import { HttpError } from "./http.js";

export const APP_ROLES = {
  administrator: "ADMINISTRADOR",
  cashier: "CAJERO",
  warehouse: "ALMACEN",
  purchasing: "ASISTENTE_COMPRAS",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export interface AppUser {
  id: number;
  email: string;
  fullName: string;
  role: AppRole;
  roleDisplay: string;
}

interface UserRow {
  id_usuario: number;
  correo: string;
  nombre_completo: string;
  rol: AppRole;
}

const ROLE_DISPLAY: Record<AppRole, string> = {
  ADMINISTRADOR: "Administrador",
  CAJERO: "Cajero",
  ALMACEN: "Almacén",
  ASISTENTE_COMPRAS: "Asistente de compras",
};

function authClient() {
  const url = Netlify.env.get("VITE_SUPABASE_URL");
  const serviceRoleKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new HttpError(500, "Supabase Auth no está configurado.");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAppUser(request: Request, client?: PoolClient): Promise<AppUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Debes iniciar sesión.");
  const { data, error } = await authClient().auth.getUser(token);
  const identityUser = error ? null : data.user;
  if (!identityUser?.email) {
    throw new HttpError(401, "Debes iniciar sesión.");
  }

  const sql = `
    select u.id_usuario,
           u.correo,
           trim(concat(u.nombres, ' ', u.apellidos)) as nombre_completo,
           r.nombre as rol
      from public.usuarios u
      join public.roles r on r.id_rol = u.id_rol
     where lower(u.correo) = lower($1)
       and u.estado = 'ACTIVO'
     limit 1`;
  const rows = client
    ? (await client.query<UserRow>(sql, [identityUser.email])).rows
    : await query<UserRow>(sql, [identityUser.email]);
  const row = rows[0];
  if (!row || !Object.hasOwn(ROLE_DISPLAY, row.rol)) {
    throw new HttpError(403, "Tu cuenta no tiene un rol activo en DataCell.");
  }

  return {
    id: row.id_usuario,
    email: row.correo,
    fullName: row.nombre_completo,
    role: row.rol,
    roleDisplay: ROLE_DISPLAY[row.rol],
  };
}

export function requireRole(user: AppUser, roles: readonly AppRole[]): void {
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "No tienes permisos para esta operación.");
  }
}

export const POLICIES = {
  sales: [APP_ROLES.administrator, APP_ROLES.cashier],
  warehouse: [APP_ROLES.administrator, APP_ROLES.warehouse],
  procurement: [APP_ROLES.administrator, APP_ROLES.purchasing, APP_ROLES.warehouse],
  quotations: [APP_ROLES.administrator, APP_ROLES.purchasing],
  administration: [APP_ROLES.administrator],
} as const;
