import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "../auth.js";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("../db.js", () => ({
  withTransaction: async (operation: (client: { query: typeof mocks.query }) => Promise<unknown>) =>
    operation({ query: mocks.query }),
}));

import { registerReceipt } from "./receipts.js";

const user: AppUser = {
  id: 1,
  email: "qa@datacell.local",
  fullName: "Usuario de Calidad",
  role: "ALMACEN",
  roleDisplay: "Almacén",
};

const product = {
  id_producto: 10,
  codigo: "P-001",
  nombre: "Cable USB",
  precio_compra: "10.00",
  precio_venta: "20.00",
  stock: 3,
};

describe("recepción de compras", () => {
  beforeEach(() => mocks.query.mockReset());

  it("exige una orden y productos", async () => {
    await expect(registerReceipt({}, user)).rejects.toMatchObject({ status: 400 });
    await expect(registerReceipt({ items: [{ code: "P-001", quantity: 1 }] }, user)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rechaza una cantidad mayor al saldo pendiente", async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [{ id_compra: 3 }] })
      .mockResolvedValueOnce({ rows: [product] })
      .mockResolvedValueOnce({ rows: [{ id_producto: 10, cantidad: 5, recibido: 4 }] });

    await expect(
      registerReceipt(
        {
          purchaseNumber: "OC-2026-0001",
          items: [{ code: "P-001", quantity: 2 }],
        },
        user,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
