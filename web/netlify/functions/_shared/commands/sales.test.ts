import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "../auth.js";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("../db.js", () => ({
  withTransaction: async (operation: (client: { query: typeof mocks.query }) => Promise<unknown>) =>
    operation({ query: mocks.query }),
}));

import { registerSale } from "./sales.js";

const user: AppUser = {
  id: 1,
  email: "qa@datacell.local",
  fullName: "Usuario de Calidad",
  role: "ADMINISTRADOR",
  roleDisplay: "Administrador",
};

const product = {
  id_producto: 10,
  codigo: "P-001",
  nombre: "Cable USB",
  precio_compra: "10.00",
  precio_venta: "20.00",
  stock: 3,
};

describe("registro de ventas", () => {
  beforeEach(() => mocks.query.mockReset());

  it("rechaza toda la operación cuando el stock cambió", async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [product] })
      .mockResolvedValueOnce({ rows: [{ id_cliente: 7 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ numero: "00000005" }] });

    await expect(
      registerSale(
        {
          clientName: "Cliente de Prueba",
          receiptType: "BOLETA",
          paymentMethod: "EFECTIVO",
          items: [{ code: "P-001", quantity: 4 }],
        },
        user,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("registra venta, detalle, pago y movimiento de inventario", async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [product] })
      .mockResolvedValueOnce({ rows: [{ id_cliente: 7 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ numero: "00000005" }] })
      .mockResolvedValueOnce({ rows: [{ id_venta: 12 }] })
      .mockResolvedValue({ rows: [] });

    await expect(
      registerSale(
        {
          clientName: "Cliente de Prueba",
          receiptType: "BOLETA",
          paymentMethod: "YAPE",
          items: [{ code: "P-001", quantity: 2 }],
        },
        user,
      ),
    ).resolves.toContain("B001-00000006");

    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("insert into public.pagos"), [
      12,
      "YAPE",
      47.2,
    ]);
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("update public.productos"), [1, 10]);
  });
});
