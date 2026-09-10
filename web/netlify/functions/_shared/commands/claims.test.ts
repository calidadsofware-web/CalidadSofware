import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "../auth.js";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("../db.js", () => ({
  withTransaction: async (operation: (client: { query: typeof mocks.query }) => Promise<unknown>) =>
    operation({ query: mocks.query }),
}));

import { registerClaim } from "./claims.js";

const user: AppUser = {
  id: 1,
  email: "qa@datacell.local",
  fullName: "Usuario de Calidad",
  role: "ADMINISTRADOR",
  roleDisplay: "Administrador",
};

describe("registro de reclamos", () => {
  beforeEach(() => mocks.query.mockReset());

  it("exige cliente y descripción", async () => {
    await expect(registerClaim({}, user)).rejects.toMatchObject({ status: 400 });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("rechaza un comprobante que no existe", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ id_cliente: 5 }] }).mockResolvedValueOnce({ rows: [] });

    await expect(
      registerClaim(
        {
          clientName: "Cliente de Prueba",
          description: "Producto defectuoso",
          receiptNumber: "B001-99999999",
        },
        user,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("registra un reclamo con valores controlados", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ id_cliente: 5 }] }).mockResolvedValueOnce({ rows: [] });

    await expect(
      registerClaim(
        {
          clientName: "Cliente de Prueba",
          description: "Producto defectuoso",
          reason: "Falla de fábrica",
          channel: "CORREO",
          priority: "ALTA",
        },
        user,
      ),
    ).resolves.toContain("Reclamo registrado");

    expect(mocks.query).toHaveBeenLastCalledWith(
      expect.stringContaining("insert into public.reclamos_cliente"),
      [5, null, "Falla de fábrica", "Producto defectuoso", "CORREO", "ALTA", 1],
    );
  });
});
