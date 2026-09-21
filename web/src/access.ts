import type { AppRole } from "./types";

export type AccessPolicy =
  "sales" | "warehouse" | "procurement" | "quotations" | "administration" | "catalog";

export const ROLE_ACCESS = {
  sales: ["ADMINISTRADOR", "CAJERO"],
  warehouse: ["ADMINISTRADOR", "ALMACEN"],
  procurement: ["ADMINISTRADOR", "ASISTENTE_COMPRAS", "ALMACEN"],
  quotations: ["ADMINISTRADOR", "ASISTENTE_COMPRAS"],
  administration: ["ADMINISTRADOR"],
  catalog: ["ADMINISTRADOR", "ALMACEN"],
} as const satisfies Record<AccessPolicy, readonly AppRole[]>;

export function hasAccess(role: AppRole, policy: AccessPolicy): boolean {
  return (ROLE_ACCESS[policy] as readonly AppRole[]).includes(role);
}
