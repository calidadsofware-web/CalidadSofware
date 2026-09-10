import { describe, expect, it } from "vitest";
import { hasAccess } from "./access";
import type { AppRole } from "./types";

const roles: AppRole[] = ["ADMINISTRADOR", "CAJERO", "ALMACEN", "ASISTENTE_COMPRAS"];

describe("matriz de acceso del frontend", () => {
  it("permite al administrador acceder a todos los módulos", () => {
    expect(hasAccess("ADMINISTRADOR", "sales")).toBe(true);
    expect(hasAccess("ADMINISTRADOR", "warehouse")).toBe(true);
    expect(hasAccess("ADMINISTRADOR", "procurement")).toBe(true);
    expect(hasAccess("ADMINISTRADOR", "quotations")).toBe(true);
  });

  it("limita al cajero a las operaciones de venta", () => {
    expect(hasAccess("CAJERO", "sales")).toBe(true);
    expect(hasAccess("CAJERO", "warehouse")).toBe(false);
    expect(hasAccess("CAJERO", "procurement")).toBe(false);
    expect(hasAccess("CAJERO", "quotations")).toBe(false);
  });

  it("mantiene una política definida para cada rol", () => {
    for (const role of roles) {
      expect([
        hasAccess(role, "sales"),
        hasAccess(role, "warehouse"),
        hasAccess(role, "procurement"),
        hasAccess(role, "quotations"),
      ]).toHaveLength(4);
    }
  });
});
