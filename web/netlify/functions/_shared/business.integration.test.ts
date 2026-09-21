// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AppData } from "../../../src/types.js";

const state = vi.hoisted(() => ({ db: null as PGlite | null }));
vi.mock("./db.js", () => ({
  query: async (sql: string, values: unknown[] = []) => (await state.db!.query(sql, values)).rows,
  withTransaction: async (operation: (client: PoolClient) => Promise<unknown>) =>
    state.db!.transaction(async (tx) =>
      operation({
        query: async (sql: string, values: unknown[] = []) => {
          const result = await tx.query(sql, values);
          return { rows: result.rows, rowCount: result.rows.length || result.affectedRows || 0 };
        },
      } as unknown as PoolClient),
    ),
}));

import handler from "../datacell.js";
import { hashPassword } from "./auth.js";

const password = "Solo-pruebas-locales-2026";
let adminCookie = "",
  cashierCookie = "",
  warehouseCookie = "",
  purchasingCookie = "";
const clientFields = {
  firstName: "Cliente",
  lastName: "Integración",
  documentType: "DNI",
  document: "90001122",
  phone: "987654321",
  email: "cliente.integration@example.test",
  address: "Dirección ficticia 100",
  status: "ACTIVO",
};
const productFields = {
  code: "QA-INTEGRATION",
  name: "Cable de prueba integral",
  category: "Cables QA",
  brand: "Marca QA",
  cost: 10,
  price: 20,
  minStock: 2,
  initialStock: 10,
  status: "ACTIVO",
};

async function command(action: string, payload: object, cookie = adminCookie) {
  return handler(
    new Request("https://local.example/api/datacell", {
      method: "POST",
      headers: { origin: "https://local.example", "content-type": "application/json", cookie },
      body: JSON.stringify({ action, payload }),
    }),
  );
}
async function data(cookie = adminCookie): Promise<AppData> {
  const response = await handler(new Request("https://local.example/api/datacell", { headers: { cookie } }));
  expect(response.status).toBe(200);
  return (await response.json()).data.appData;
}
async function signIn(email: string) {
  const response = await command("sign-in", { email, password }, "");
  expect(response.status).toBe(200);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeAll(async () => {
  vi.stubGlobal("Netlify", {
    env: {
      get: (name: string) =>
        name === "APP_SESSION_SECRET" ? "integration-only-session-secret-at-least-32-characters" : undefined,
    },
  });
  state.db = await PGlite.create();
  await state.db.exec("create role anon; create role authenticated;");
  await state.db.exec(await readFile(new URL("../../../../supabase/schema.sql", import.meta.url), "utf8"));
  const hash = await hashPassword(password);
  for (const [name, role] of [
    ["admin", "ADMINISTRADOR"],
    ["cashier", "CAJERO"],
    ["warehouse", "ALMACEN"],
    ["purchasing", "ASISTENTE_COMPRAS"],
  ]) {
    await state.db.query(
      "insert into public.usuarios(nombres,apellidos,correo,password_hash,id_rol) values($1,'QA',$2,$3,(select id_rol from public.roles where nombre=$4))",
      [name, `${name}@integration.test`, hash, role],
    );
  }
  adminCookie = await signIn("admin@integration.test");
  cashierCookie = await signIn("cashier@integration.test");
  warehouseCookie = await signIn("warehouse@integration.test");
  purchasingCookie = await signIn("purchasing@integration.test");
}, 30000);
afterAll(async () => {
  await state.db?.close();
  vi.unstubAllGlobals();
});

describe("operación comercial con PostgreSQL local real", () => {
  it("carga todos los módulos sin exponer contraseñas ni KPIs", async () => {
    const app = await data();
    expect(app.products.length).toBeGreaterThan(0);
    expect(app.users?.length).toBeGreaterThan(0);
    expect(app.metrics).toEqual([]);
    expect(JSON.stringify(app)).not.toContain("scrypt$");
    const cashier = await data(cashierCookie);
    expect(cashier.users).toEqual([]);
    expect(cashier.suppliers).toEqual([]);
    expect(cashier.products.every((product) => product.cost === null)).toBe(true);
  });
  it("registra cliente y producto y audita el stock inicial", async () => {
    expect((await command("save-client", clientFields, cashierCookie)).status).toBe(200);
    expect((await command("save-product", productFields, warehouseCookie)).status).toBe(200);
    const app = await data();
    expect(app.clients.find((client) => client.document === clientFields.document)?.address).toBe(
      clientFields.address,
    );
    expect(app.products.find((product) => product.code === productFields.code)?.stock).toBe(10);
    expect(app.movements?.find((movement) => movement.code === productFields.code)?.after).toBe(10);
  });
  it("rechaza duplicados y documentos inválidos sin crear registros", async () => {
    expect((await command("save-client", clientFields)).status).toBe(409);
    expect((await command("save-client", { ...clientFields, document: "123" })).status).toBe(400);
    expect((await command("save-product", productFields)).status).toBe(409);
  });
  it("bloquea modificaciones fuera del rol", async () => {
    expect((await command("save-product", productFields, cashierCookie)).status).toBe(403);
    expect((await command("save-client", clientFields, warehouseCookie)).status).toBe(403);
    expect((await command("save-user", {}, cashierCookie)).status).toBe(403);
    expect((await command("review-purchase", {}, purchasingCookie)).status).toBe(403);
  });
  it("calcula IGV, registra pago y descuenta inventario en una transacción", async () => {
    const app = await data();
    const customer = app.clients.find((client) => client.document === clientFields.document)!;
    const response = await command(
      "register-sale",
      {
        clientId: customer.id,
        receiptType: "BOLETA",
        paymentMethod: "EFECTIVO",
        cashReceived: 50,
        items: [{ code: productFields.code, quantity: 2 }],
      },
      cashierCookie,
    );
    expect(response.status).toBe(200);
    const after = await data();
    expect(after.products.find((product) => product.code === productFields.code)?.stock).toBe(8);
    const payment = after.payments.find((payment) => payment.clientId === customer.id)!;
    expect(payment.total).toBe(47.2);
    expect(payment.tax).toBe(7.2);
    expect(payment.items?.[0].quantity).toBe(2);
  });
  it("rechaza stock insuficiente, efectivo insuficiente y factura sin RUC", async () => {
    const app = await data();
    const customer = app.clients.find((client) => client.document === clientFields.document)!;
    const base = {
      clientId: customer.id,
      receiptType: "BOLETA",
      paymentMethod: "EFECTIVO",
      cashReceived: 1000,
      items: [{ code: productFields.code, quantity: 1 }],
    };
    expect(
      (await command("register-sale", { ...base, items: [{ code: productFields.code, quantity: 99 }] }))
        .status,
    ).toBe(409);
    expect((await command("register-sale", { ...base, cashReceived: 1 })).status).toBe(400);
    expect((await command("register-sale", { ...base, receiptType: "FACTURA" })).status).toBe(400);
    expect((await data()).products.find((product) => product.code === productFields.code)?.stock).toBe(8);
  });
  it("conserva trazabilidad del ajuste y rechaza conteos obsoletos", async () => {
    expect(
      (
        await command(
          "adjust-stock",
          { code: productFields.code, stock: 7, expectedStock: 8, notes: "Conteo físico de prueba" },
          warehouseCookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await command(
          "adjust-stock",
          { code: productFields.code, stock: 6, expectedStock: 8, notes: "Conteo obsoleto" },
          warehouseCookie,
        )
      ).status,
    ).toBe(409);
    expect((await data()).products.find((product) => product.code === productFields.code)?.stock).toBe(7);
  });
  it("crea cuenta subordinada, impide elevación y aplica inactivación a sesiones existentes", async () => {
    const fields = {
      firstName: "Cajero",
      lastName: "Pruebas",
      email: "new-user@integration.test",
      role: "CAJERO",
      password,
      status: "ACTIVO",
    };
    expect((await command("save-user", { ...fields, role: "ADMINISTRADOR" })).status).toBe(400);
    expect((await command("save-user", fields)).status).toBe(200);
    const session = await signIn(fields.email);
    const user = (await data()).users!.find((user) => user.email === fields.email)!;
    expect((await command("save-user", { ...fields, id: user.id, status: "INACTIVO" })).status).toBe(200);
    expect((await command("save-client", { ...clientFields, document: "90002233" }, session)).status).toBe(
      401,
    );
    const admin = (await data()).users!.find((user) => user.email === "admin@integration.test")!;
    expect((await command("save-user", { ...fields, id: admin.id })).status).toBe(403);
  });
  it("completa solicitud, aprobación, orden y recepción parcial/total", async () => {
    const requestResponse = await command(
      "register-purchase-request",
      {
        priority: "MEDIA",
        justification: "Reposición de pruebas",
        items: [{ code: productFields.code, quantity: 5 }],
      },
      purchasingCookie,
    );
    expect(requestResponse.status).toBe(200);
    let app = await data();
    const request = app.purchaseRequests.find((item) => item.notes === "Reposición de pruebas")!;
    expect(
      (
        await command("review-purchase", {
          id: request.id,
          decision: "APROBADA",
          supplierId: app.suppliers[0].id,
          reason: "Autorizado para prueba",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await command("review-purchase", {
          id: request.id,
          decision: "APROBADA",
          supplierId: app.suppliers[0].id,
          reason: "Reintento duplicado",
        })
      ).status,
    ).toBe(409);
    app = await data();
    const purchase = app.purchases.find((purchase) =>
      purchase.items.some((item) => item.code === productFields.code),
    )!;
    expect(
      (
        await command(
          "register-receipt",
          {
            purchaseNumber: purchase.number,
            guide: "QA-GUIA-1",
            items: [{ code: productFields.code, quantity: 2 }],
          },
          warehouseCookie,
        )
      ).status,
    ).toBe(200);
    expect((await data()).purchases.find((item) => item.number === purchase.number)?.status).toBe("Parcial");
    expect(
      (
        await command(
          "register-receipt",
          {
            purchaseNumber: purchase.number,
            entryDate: "2000-01-01",
            guide: "INVALIDA",
            items: [{ code: productFields.code, quantity: 1 }],
          },
          warehouseCookie,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await command(
          "register-receipt",
          {
            purchaseNumber: purchase.number,
            guide: "QA-GUIA-2",
            entryDate: new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/Lima",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date()),
            items: [{ code: productFields.code, quantity: 3 }],
          },
          warehouseCookie,
        )
      ).status,
    ).toBe(200);
    app = await data();
    expect(app.purchaseRequests.find((item) => item.id === request.id)?.status).toBe("Atendida");
    expect(app.products.find((item) => item.code === productFields.code)?.stock).toBe(12);
    expect(app.movements?.[0]).toMatchObject({ code: productFields.code, quantity: 3, after: 12 });
    const timing = (
      await state.db!.query<{ recent: boolean }>(
        "select now()-fecha < interval '1 minute' as recent from public.movimientos_inventario order by id_movimiento desc limit 1",
      )
    ).rows[0];
    expect(timing.recent).toBe(true);
  });
  it("vincula reclamos a su cliente y exige transiciones válidas", async () => {
    let app = await data();
    const customer = app.clients.find((client) => client.document === clientFields.document)!;
    const payment = app.payments.find((payment) => payment.clientId === customer.id)!;
    const fields = {
      clientId: customer.id,
      receiptNumber: payment.document,
      reason: "Producto defectuoso",
      description: "Reclamo integral de prueba",
      priority: "MEDIA",
      channel: "PRESENCIAL",
    };
    const other = app.clients.find((client) => client.id !== customer.id)!;
    expect((await command("register-claim", { ...fields, clientId: other.id })).status).toBe(404);
    expect((await command("register-claim", fields)).status).toBe(200);
    app = await data();
    const claim = app.claims.find((claim) => claim.description === fields.description)!;
    expect(
      (await command("update-claim", { id: claim.id, status: "CERRADO", resolution: "Cierre sin revisar" }))
        .status,
    ).toBe(409);
    for (const status of ["EN_REVISION", "ATENDIDO", "CERRADO"])
      expect(
        (await command("update-claim", { id: claim.id, status, resolution: `Seguimiento: ${status}` }))
          .status,
      ).toBe(200);
    expect((await data()).claims.find((item) => item.id === claim.id)?.status).toBe("Cerrado");
  });

  it("distingue proveedores por su identificador y permite cancelar cotizaciones", async () => {
    const supplier = {
      businessName: "Proveedor de integración",
      contact: "Contacto ficticio",
      phone: "987654321",
      email: "proveedor@example.test",
      address: "Dirección ficticia 201",
      status: "ACTIVO",
    };
    for (const ruc of ["20900001111", "20900002222"])
      expect(
        (await command("save-supplier", { ...supplier, ruc, email: `${ruc}@example.test` }, purchasingCookie))
          .status,
      ).toBe(200);
    const providers = (await data()).suppliers.filter((item) => item.businessName === supplier.businessName);
    expect(providers).toHaveLength(2);
    expect(
      (
        await command(
          "register-quotation",
          {
            supplierIds: providers.map((item) => item.id),
            notes: "Cotización de prueba integral",
            items: [{ code: productFields.code, quantity: 5 }],
          },
          purchasingCookie,
        )
      ).status,
    ).toBe(200);
    const quotation = (await data()).quotationRequests.find(
      (item) => item.notes === "Cotización de prueba integral",
    )!;
    const links = (
      await state.db!.query<{ count: number }>(
        "select count(*)::int as count from public.solicitudes_cotizacion_proveedores where id_solicitud_cotizacion=$1",
        [quotation.id],
      )
    ).rows[0];
    expect(links.count).toBe(2);
    expect(
      (
        await command(
          "cancel-quotation",
          { id: quotation.id, reason: "Necesidad ya cubierta" },
          purchasingCookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await command(
          "cancel-quotation",
          { id: quotation.id, reason: "Reintento duplicado" },
          purchasingCookie,
        )
      ).status,
    ).toBe(409);
    expect((await data()).quotationRequests.find((item) => item.id === quotation.id)?.status).toBe(
      "Cancelada",
    );
  });

  it("actualiza fichas conservando datos e historial de venta", async () => {
    const customer = (await data()).clients.find((item) => item.document === clientFields.document)!;
    expect(
      (await command("save-client", { ...clientFields, id: customer.id, phone: "999111222" })).status,
    ).toBe(200);
    expect(
      (
        await command("save-product", {
          ...productFields,
          originalCode: productFields.code,
          price: 22.5,
          initialStock: 999,
        })
      ).status,
    ).toBe(200);
    const updated = await data();
    expect(updated.clients.find((item) => item.id === customer.id)?.phone).toBe("999111222");
    expect(updated.products.find((item) => item.code === productFields.code)?.stock).toBe(12);
    expect(updated.payments.find((item) => item.clientId === customer.id)?.total).toBe(47.2);
    const pendingProduct = updated.purchases.find((item) => item.status === "Pendiente")?.items[0];
    if (!pendingProduct) throw new Error("El escenario debe contener una orden pendiente");
    const original = updated.products.find((item) => item.code === pendingProduct.code)!;
    expect(
      (await command("save-product", { ...original, originalCode: original.code, status: "INACTIVO" }))
        .status,
    ).toBe(409);
  });

  it("trata una cookie malformada como sesión ausente sin error interno", async () => {
    const response = await handler(
      new Request("https://local.example/api/datacell", { headers: { cookie: "datacell_session=%ZZ" } }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.user).toBeNull();
  });
});
