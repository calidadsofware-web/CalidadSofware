import { describe, expect, it } from "vitest";
import { commandItems, isoDate, MAX_QUANTITY, roundMoney } from "./validation.js";

describe("validación de comandos", () => {
  it("combina códigos repetidos y normaliza las cantidades", () => {
    expect(
      commandItems([
        { code: " p-001 ", quantity: 2.9 },
        { code: "P-001", quantity: 3 },
        { code: "", quantity: 5 },
        { code: "P-002", quantity: -2 },
      ]),
    ).toEqual([{ code: "P-001", quantity: 5 }]);
  });

  it("limita una cantidad excesiva", () => {
    expect(commandItems([{ code: "P-001", quantity: MAX_QUANTITY + 500 }])).toEqual([
      { code: "P-001", quantity: MAX_QUANTITY },
    ]);
  });

  it("rechaza fechas inexistentes", () => {
    expect(isoDate("2026-02-29")).toBeNull();
    expect(isoDate("2026-13-01")).toBeNull();
    expect(isoDate("2026-09-09")).toBe("2026-09-09");
  });

  it("redondea los importes a dos decimales", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});
