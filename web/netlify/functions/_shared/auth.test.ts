import { scrypt } from "node:crypto";
import { describe, expect, it } from "vitest";
import { APP_ROLES, POLICIES, requireRole, verifyPassword } from "./auth.js";

async function storedHash(password: string): Promise<string> {
  const salt = Buffer.from("datacell-test-salt");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      {
        N: 16_384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
      },
      (error, value) => (error ? reject(error) : resolve(Buffer.from(value))),
    );
  });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

describe("verificación de contraseñas", () => {
  it("acepta la contraseña que corresponde al hash", async () => {
    const hash = await storedHash("Clave segura 2026");
    await expect(verifyPassword("Clave segura 2026", hash)).resolves.toBe(true);
  });

  it("rechaza una contraseña diferente y hashes mal formados", async () => {
    const hash = await storedHash("Clave segura 2026");
    await expect(verifyPassword("otra clave", hash)).resolves.toBe(false);
    await expect(verifyPassword("Clave segura 2026", "sha256$invalido")).resolves.toBe(false);
  });
});

describe("autorización por rol", () => {
  const user = {
    id: 7,
    email: "qa@datacell.local",
    fullName: "Usuario de calidad",
    roleDisplay: "Cajero",
    role: APP_ROLES.cashier,
  };

  it("mantiene la política esperada para cada dominio", () => {
    expect(POLICIES).toEqual({
      sales: [APP_ROLES.administrator, APP_ROLES.cashier],
      warehouse: [APP_ROLES.administrator, APP_ROLES.warehouse],
      procurement: [APP_ROLES.administrator, APP_ROLES.purchasing, APP_ROLES.warehouse],
      quotations: [APP_ROLES.administrator, APP_ROLES.purchasing],
      administration: [APP_ROLES.administrator],
    });
  });

  it("acepta un rol autorizado y rechaza uno ajeno", () => {
    expect(() => requireRole(user, POLICIES.sales)).not.toThrow();
    expect(() => requireRole(user, POLICIES.warehouse)).toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });
});
