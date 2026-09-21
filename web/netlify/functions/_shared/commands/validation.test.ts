import { describe, expect, it } from "vitest";
import { commandItems, isoDate, MAX_QUANTITY, roundMoney } from "./validation.js";

describe("validación de comandos", () => {
  it("combina códigos repetidos sin cambiar las cantidades", () => {
    expect(
      commandItems([
        { code: " p-001 ", quantity: 2 },
        { code: "P-001", quantity: 3 },
      ]),
    ).toEqual([{ code: "P-001", quantity: 5 }]);
  });

  it("rechaza cantidades excesivas en vez de alterarlas silenciosamente", () => {
    expect(() => commandItems([{ code: "P-001", quantity: MAX_QUANTITY + 500 }])).toThrow();
    expect(() =>
      commandItems([
        { code: "P-001", quantity: MAX_QUANTITY },
        { code: "P-001", quantity: 1 },
      ]),
    ).toThrow();
  });

  it.each([0, -1, 2.9, "no válido", null, true])("rechaza una cantidad inválida: %s", (quantity) => {
    expect(() => commandItems([{ code: "P-001", quantity }])).toThrow();
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
