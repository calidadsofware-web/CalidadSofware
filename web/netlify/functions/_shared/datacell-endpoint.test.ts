import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAppData: vi.fn(),
  registerClaim: vi.fn(),
  registerPurchaseRequest: vi.fn(),
  registerQuotation: vi.fn(),
  registerReceipt: vi.fn(),
  registerSale: vi.fn(),
  requireAppUser: vi.fn(),
  requireRole: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("./auth.js", () => ({
  APP_ROLES: {
    administrator: "ADMINISTRADOR",
    cashier: "CAJERO",
    purchasing: "ASISTENTE_COMPRAS",
    warehouse: "ALMACEN",
  },
  POLICIES: {
    sales: ["ADMINISTRADOR", "CAJERO"],
    warehouse: ["ADMINISTRADOR", "ALMACEN"],
    procurement: ["ADMINISTRADOR", "ASISTENTE_COMPRAS", "ALMACEN"],
    quotations: ["ADMINISTRADOR", "ASISTENTE_COMPRAS"],
  },
  expiredSessionCookie: () => "datacell_session=; Max-Age=0",
  requireAppUser: mocks.requireAppUser,
  requireRole: mocks.requireRole,
  sessionCookie: () => "datacell_session=token; HttpOnly",
  signIn: mocks.signIn,
}));

vi.mock("./commands/index.js", () => ({
  registerClaim: mocks.registerClaim,
  registerPurchaseRequest: mocks.registerPurchaseRequest,
  registerQuotation: mocks.registerQuotation,
  registerReceipt: mocks.registerReceipt,
  registerSale: mocks.registerSale,
}));

vi.mock("./data.js", () => ({ getAppData: mocks.getAppData }));

import handler from "../datacell.js";
import { HttpError } from "./http.js";

const user = {
  id: 1,
  email: "qa@datacell.local",
  fullName: "Usuario de Calidad",
  role: "ADMINISTRADOR",
  roleDisplay: "Administrador",
};

function post(action: string, payload: object = {}) {
  return new Request("https://datacell.example/api/datacell", {
    method: "POST",
    headers: { origin: "https://datacell.example", "content-type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
}

describe("endpoint DataCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAppUser.mockResolvedValue(user);
  });

  it("carga los datos del usuario autenticado", async () => {
    mocks.getAppData.mockResolvedValue({ user, products: [] });
    const response = await handler(new Request("https://datacell.example/api/datacell"));
    expect(response.status).toBe(200);
    expect(mocks.getAppData).toHaveBeenCalledWith(user);
  });

  it("crea la sesión y devuelve una cookie segura", async () => {
    mocks.signIn.mockResolvedValue({ user, session: "token" });
    const response = await handler(post("sign-in", { email: user.email, password: "clave" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("informa una sesión ausente sin generar un error HTTP en la carga inicial", async () => {
    mocks.requireAppUser.mockRejectedValueOnce(new HttpError(401, "Debes iniciar sesión."));
    const response = await handler(post("session"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { user: null },
    });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it.each([
    ["register-sale", mocks.registerSale, ["ADMINISTRADOR", "CAJERO"]],
    ["register-receipt", mocks.registerReceipt, ["ADMINISTRADOR", "ALMACEN"]],
    [
      "register-purchase-request",
      mocks.registerPurchaseRequest,
      ["ADMINISTRADOR", "ASISTENTE_COMPRAS", "ALMACEN"],
    ],
    ["register-quotation", mocks.registerQuotation, ["ADMINISTRADOR", "ASISTENTE_COMPRAS"]],
    ["register-claim", mocks.registerClaim, ["ADMINISTRADOR", "CAJERO"]],
  ])("comprueba el rol antes de ejecutar %s", async (action, command, roles) => {
    command.mockResolvedValue("Operación registrada");
    const payload = { items: [{ code: "P-001", quantity: 1 }] };
    const response = await handler(post(action, payload));
    expect(response.status).toBe(200);
    expect(mocks.requireRole).toHaveBeenCalledWith(user, roles);
    expect(command).toHaveBeenCalledWith(payload, user);
  });

  it("rechaza métodos y acciones no permitidos", async () => {
    const deleteResponse = await handler(
      new Request("https://datacell.example/api/datacell", { method: "DELETE" }),
    );
    expect(deleteResponse.status).toBe(405);
    const actionResponse = await handler(post("unknown"));
    expect(actionResponse.status).toBe(400);
  });
});
