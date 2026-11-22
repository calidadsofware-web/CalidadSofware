import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "../auth.js";

/**
 * Actividad 07 – Componente crítico 1: registerSale (sales.ts).
 * Registra la venta, su detalle, el pago y el movimiento de inventario en una sola transacción (RF03, RF04).
 * La base de datos se reemplaza por un doble de prueba que responde a las consultas en el orden en que se ejecutan.
 * Datos tomados de la semilla del sistema (precios sin IGV).
 */
const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("../db.js", () => ({
  withTransaction: async (operation: (client: { query: typeof mocks.query }) => Promise<unknown>) =>
    operation({ query: mocks.query }),
}));

import { registerSale } from "./sales.js";

const cajero: AppUser = {
  id: 2,
  email: "caja@local.test",
  fullName: "Cajero de prueba",
  role: "CAJERO",
  roleDisplay: "Cajero",
};

const producto = (id: number, codigo: string, nombre: string, precio: string, stock: number) => ({
  id_producto: id,
  codigo,
  nombre,
  precio_compra: "1.00",
  precio_venta: precio,
  stock,
});
const CARGADOR = producto(2, "PROD-002", "Cargador USB-C 20W", "30.00", 85);
const MICA = producto(4, "PROD-004", "Mica templada 9H", "12.00", 150);
const AUDIFONOS = producto(3, "PROD-003", "Audifonos Bluetooth", "45.00", 60);
const POWER_BANK = producto(5, "PROD-005", "Power Bank 10000mAh", "65.00", 7);

/** Respuestas en orden: productos, cliente, bloqueo del correlativo, último número, id de la venta y el resto vacías. */
function baseDeDatos(productos: object[], ultimoNumero = "00000127") {
  mocks.query
    .mockResolvedValueOnce({ rows: productos })
    .mockResolvedValueOnce({ rows: [{ id_cliente: 1 }] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ numero: ultimoNumero }] })
    .mockResolvedValueOnce({ rows: [{ id_venta: 500 }] })
    .mockResolvedValue({ rows: [] });
}
const llamadas = (texto: string) =>
  mocks.query.mock.calls.filter(([sql]) => typeof sql === "string" && sql.includes(texto));

describe("registerSale – escenarios normales", () => {
  beforeEach(() => mocks.query.mockReset());

  it("RS-N1: registra una boleta en efectivo con subtotal, IGV 18 % y total correctos", async () => {
    baseDeDatos([CARGADOR, MICA]);
    const mensaje = await registerSale(
      {
        clientName: "Maria Torres",
        clientDocument: "45678912",
        receiptType: "BOLETA",
        paymentMethod: "EFECTIVO",
        cashReceived: 100,
        items: [
          { code: "PROD-002", quantity: 2 },
          { code: "PROD-004", quantity: 1 },
        ],
      },
      cajero,
    );
    expect(mensaje).toContain("B001-00000128");
    const [, valores] = llamadas("insert into public.ventas")[0];
    expect(valores.slice(5, 8)).toEqual([72, 12.96, 84.96]); // subtotal, IGV, total
    expect(llamadas("insert into public.pagos")[0][1]).toEqual([500, "EFECTIVO", 84.96, null]);
  });

  it("RS-N2: descuenta el stock y registra un movimiento de inventario por cada producto vendido", async () => {
    baseDeDatos([CARGADOR, MICA]);
    await registerSale(
      {
        clientName: "Maria Torres",
        paymentMethod: "EFECTIVO",
        items: [
          { code: "PROD-002", quantity: 2 },
          { code: "PROD-004", quantity: 1 },
        ],
      },
      cajero,
    );
    expect(llamadas("update public.productos").map(([, v]) => v)).toEqual([
      [83, 2],
      [149, 4],
    ]);
    const movimientos = llamadas("insert into public.movimientos_inventario").map(([, v]) => v);
    expect(movimientos).toEqual([
      [2, 2, 85, 83, 500, 2],
      [4, 1, 150, 149, 500, 2],
    ]);
  });

  it("RS-N3: emite una factura con serie F001 para un cliente con RUC y dirección fiscal", async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [AUDIFONOS] })
      .mockResolvedValueOnce({
        rows: [{ id_cliente: 9, documento: "20123456789", direccion: "Av. Arequipa 123" }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ numero: "00000127" }] })
      .mockResolvedValueOnce({ rows: [{ id_venta: 501 }] })
      .mockResolvedValue({ rows: [] });
    const mensaje = await registerSale(
      {
        clientId: 9,
        receiptType: "FACTURA",
        paymentMethod: "TARJETA",
        reference: "VOUCHER-001",
        items: [{ code: "PROD-003", quantity: 1 }],
      },
      cajero,
    );
    expect(mensaje).toContain("F001-00000128");
    expect(llamadas("insert into public.pagos")[0][1]).toEqual([501, "TARJETA", 53.1, "VOUCHER-001"]);
  });
});

describe("registerSale – escenarios alternativos", () => {
  beforeEach(() => mocks.query.mockReset());

  it("RS-A1: rechaza la venta cuando el efectivo recibido no cubre el total", async () => {
    baseDeDatos([AUDIFONOS]);
    await expect(
      registerSale(
        {
          clientName: "Luis Herrera",
          paymentMethod: "EFECTIVO",
          cashReceived: 10,
          items: [{ code: "PROD-003", quantity: 1 }],
        },
        cajero,
      ),
    ).rejects.toMatchObject({ status: 400, message: "El efectivo recibido no cubre el total de la venta." });
    expect(llamadas("insert into public.ventas")).toHaveLength(0);
  });

  it("RS-A2: exige la referencia del pago cuando el medio no es efectivo", async () => {
    await expect(
      registerSale(
        { clientName: "Luis Herrera", paymentMethod: "YAPE", items: [{ code: "PROD-003", quantity: 1 }] },
        cajero,
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("Referencia del pago") });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("RS-A3: impide una factura si el cliente no tiene RUC de 11 dígitos", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [AUDIFONOS] });
    await expect(
      registerSale(
        {
          clientName: "Camila Rojas",
          clientDocument: "70011223",
          receiptType: "FACTURA",
          paymentMethod: "EFECTIVO",
          items: [{ code: "PROD-003", quantity: 1 }],
        },
        cajero,
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("RUC de 11 dígitos") });
  });

  it("RS-A4: rechaza un carrito vacío antes de abrir la transacción", async () => {
    await expect(registerSale({ clientName: "Cliente", items: [] }, cajero)).rejects.toMatchObject({
      status: 400,
      message: "Agrega al menos un producto antes de registrar la venta.",
    });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("RS-A5: informa los códigos de productos inexistentes o inactivos", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    await expect(
      registerSale({ clientName: "Cliente", items: [{ code: "PROD-999", quantity: 1 }] }, cajero),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("PROD-999") });
  });
});

describe("registerSale – casos límite", () => {
  beforeEach(() => mocks.query.mockReset());

  it("RS-L1: permite vender exactamente todo el stock disponible (7 de 7) y deja el stock en 0", async () => {
    baseDeDatos([POWER_BANK]);
    await registerSale({ clientName: "Jorge Salas", items: [{ code: "PROD-005", quantity: 7 }] }, cajero);
    expect(llamadas("update public.productos")[0][1]).toEqual([0, 5]);
  });

  it("RS-L2: rechaza una unidad por encima del stock (8 de 7) sin registrar nada", async () => {
    baseDeDatos([POWER_BANK]);
    await expect(
      registerSale({ clientName: "Jorge Salas", items: [{ code: "PROD-005", quantity: 8 }] }, cajero),
    ).rejects.toMatchObject({ status: 409, message: expect.stringContaining("Disponible: 7") });
    expect(llamadas("insert into public.ventas")).toHaveLength(0);
    expect(llamadas("update public.productos")).toHaveLength(0);
  });

  it("RS-L3: acepta un pago en efectivo exactamente igual al total (S/ 53.10)", async () => {
    baseDeDatos([AUDIFONOS]);
    await expect(
      registerSale(
        {
          clientName: "Luis Herrera",
          paymentMethod: "EFECTIVO",
          cashReceived: "53.10",
          items: [{ code: "PROD-003", quantity: 1 }],
        },
        cajero,
      ),
    ).resolves.toContain("B001-00000128");
  });

  it("RS-L4: rechaza un pago en efectivo un céntimo menor al total (S/ 53.09)", async () => {
    baseDeDatos([AUDIFONOS]);
    await expect(
      registerSale(
        {
          clientName: "Luis Herrera",
          paymentMethod: "EFECTIVO",
          cashReceived: 53.09,
          items: [{ code: "PROD-003", quantity: 1 }],
        },
        cajero,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("RS-L5: rechaza una venta cuyo total es cero (producto con precio S/ 0.00)", async () => {
    baseDeDatos([producto(20, "PROD-020", "Producto sin precio", "0.00", 10)]);
    await expect(
      registerSale({ clientName: "Cliente", items: [{ code: "PROD-020", quantity: 1 }] }, cajero),
    ).rejects.toMatchObject({ status: 400, message: "El total de la venta debe ser mayor que cero." });
  });
});
