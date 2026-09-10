import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "../auth.js";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("../db.js", () => ({
  withTransaction: async (operation: (client: { query: typeof mocks.query }) => Promise<unknown>) =>
    operation({ query: mocks.query }),
}));

import { registerPurchaseRequest, registerQuotation } from "./procurement.js";

const user: AppUser = {
  id: 1,
  email: "qa@datacell.local",
  fullName: "Usuario de Calidad",
  role: "ASISTENTE_COMPRAS",
  roleDisplay: "Asistente de compras",
};

const product = {
  id_producto: 10,
  codigo: "P-001",
  nombre: "Cable USB",
  precio_compra: "10.00",
  precio_venta: "20.00",
  stock: 3,
};

describe("operaciones de abastecimiento", () => {
  beforeEach(() => mocks.query.mockReset());

  it("rechaza una solicitud sin productos", async () => {
    await expect(registerPurchaseRequest({}, user)).rejects.toMatchObject({ status: 400 });
  });

  it("rechaza un proveedor que ya no está disponible", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [product] }).mockResolvedValueOnce({ rows: [] });

    await expect(
      registerPurchaseRequest(
        {
          supplierName: "Proveedor inexistente",
          items: [{ code: "P-001", quantity: 2 }],
        },
        user,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("registra una solicitud y calcula el total estimado", async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [product] })
      .mockResolvedValueOnce({ rows: [{ id_proveedor: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ numero: "SC-2026-0003" }] })
      .mockResolvedValueOnce({ rows: [{ id_solicitud_compra: 8 }] })
      .mockResolvedValue({ rows: [] });

    await expect(
      registerPurchaseRequest(
        {
          supplierName: "Proveedor Norte",
          priority: "ALTA",
          requiredDate: "2026-09-20",
          items: [{ code: "P-001", quantity: 12 }],
        },
        user,
      ),
    ).resolves.toContain("SC-");

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("insert into public.detalles_solicitud_compra"),
      [8, 10, 12],
    );
  });

  it("exige productos y proveedores para una cotización", async () => {
    await expect(registerQuotation({ items: [{ code: "P-001", quantity: 1 }] }, user)).rejects.toMatchObject({
      status: 400,
    });
  });
});
