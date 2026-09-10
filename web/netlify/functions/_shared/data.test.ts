import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "./auth.js";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("./db.js", () => ({ query: mocks.query }));

import { getAppData } from "./data.js";

function user(role: AppUser["role"]): AppUser {
  return {
    id: 1,
    email: "qa@datacell.local",
    fullName: "Usuario de Calidad",
    role,
    roleDisplay: role,
  };
}

describe("carga de datos según el rol", () => {
  beforeEach(() => mocks.query.mockReset().mockResolvedValue([]));

  it("no consulta compras ni proveedores para un cajero", async () => {
    const data = await getAppData(user("CAJERO"));
    expect(mocks.query).toHaveBeenCalledTimes(5);
    expect(data.suppliers).toEqual([]);
    expect(data.purchaseRequests).toEqual([]);
    expect(data.purchases).toEqual([]);
  });

  it("carga solicitudes y cotizaciones para compras", async () => {
    const data = await getAppData(user("ASISTENTE_COMPRAS"));
    expect(mocks.query).toHaveBeenCalledTimes(6);
    expect(data.user.role).toBe("ASISTENTE_COMPRAS");
  });
});
