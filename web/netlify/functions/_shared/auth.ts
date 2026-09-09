import { createHmac, scrypt, timingSafeEqual } from "node:crypto";
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
  password_hash: string;
}

interface SessionPayload {
  sub: number;
  email: string;
  exp: number;
}

const SESSION_COOKIE = "datacell_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;

const ROLE_DISPLAY: Record<AppRole, string> = {
  ADMINISTRADOR: "Administrador",
  CAJERO: "Cajero",
  ALMACEN: "Almacén",
  ASISTENTE_COMPRAS: "Asistente de compras",
};

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: 64 * 1024 * 1024,
    }, (error, derived) => error ? reject(error) : resolve(Buffer.from(derived)));
  });
}

function activeUserSql(includePassword = false): string {
  return `
    select u.id_usuario,
           u.correo,
           trim(concat(u.nombres, ' ', u.apellidos)) as nombre_completo,
           r.nombre as rol${includePassword ? ", u.password_hash" : ""}
      from public.usuarios u
      join public.roles r on r.id_rol = u.id_rol
     where lower(u.correo) = lower($1)
       and u.estado = 'ACTIVO'
     limit 1`;
}

function toAppUser(row: UserRow): AppUser {
  if (!Object.hasOwn(ROLE_DISPLAY, row.rol)) {
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

function sessionSecret(): string {
  const value = Netlify.env.get("APP_SESSION_SECRET");
  if (!value || value.length < 32) {
    throw new HttpError(500, "La sesión segura no está configurada.");
  }
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(user: AppUser): string {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): SessionPayload {
  const [payload, signature, ...extra] = token.split(".");
  if (!payload || !signature || extra.length || !constantTimeEqual(signature, sign(payload))) {
    throw new HttpError(401, "Debes iniciar sesión.");
  }
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (!Number.isInteger(value.sub) || typeof value.email !== "string" || !Number.isInteger(value.exp) || value.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("invalid session");
    }
    return value;
  } catch {
    throw new HttpError(401, "Debes iniciar sesión.");
  }
}

function sessionFromRequest(request: Request): string {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!value) throw new HttpError(401, "Debes iniciar sesión.");
  return decodeURIComponent(value.slice(SESSION_COOKIE.length + 1));
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, costText, blockSizeText, parallelismText, saltText, hashText, ...extra] = storedHash.split("$");
  if (algorithm !== "scrypt" || extra.length || !saltText || !hashText) return false;
  const cost = Number(costText);
  const blockSize = Number(blockSizeText);
  const parallelism = Number(parallelismText);
  if (cost !== SCRYPT_N || blockSize !== SCRYPT_R || parallelism !== SCRYPT_P) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    if (!salt.length || expected.length !== SCRYPT_KEY_LENGTH) return false;
    const actual = await deriveKey(password, salt);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function signIn(emailInput: unknown, passwordInput: unknown): Promise<{ user: AppUser; session: string }> {
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  const password = typeof passwordInput === "string" ? passwordInput : "";
  if (!email || email.length > 120 || !password || password.length > 256) {
    throw new HttpError(401, "Correo o contraseña incorrectos.");
  }
  const rows = await query<UserRow>(activeUserSql(true), [email]);
  const row = rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new HttpError(401, "Correo o contraseña incorrectos.");
  }
  const user = toAppUser(row);
  return { user, session: encodeSession(user) };
}

export async function requireAppUser(request: Request, client?: PoolClient): Promise<AppUser> {
  const session = decodeSession(sessionFromRequest(request));
  const rows = client
    ? (await client.query<UserRow>(activeUserSql(false), [session.email])).rows
    : await query<UserRow>(activeUserSql(false), [session.email]);
  const row = rows[0];
  if (!row || row.id_usuario !== session.sub) {
    throw new HttpError(401, "Debes iniciar sesión.");
  }
  return toAppUser(row);
}

export function sessionCookie(session: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(session)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function expiredSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
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
