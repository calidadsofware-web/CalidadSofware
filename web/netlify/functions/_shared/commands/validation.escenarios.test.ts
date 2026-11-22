import { describe, expect, it } from "vitest";
import { commandItems, MAX_QUANTITY } from "./validation.js";

/**
 * Actividad 07 – Componente crítico 2: commandItems (validation.ts).
 * Valida y normaliza las líneas de productos que llegan al backend en ventas, solicitudes y recepciones:
 * código obligatorio (máx. 30 caracteres), cantidad entera entre 1 y 10 000 y como máximo 500 líneas.
 */
const linea = (code: unknown, quantity: unknown) => ({ code, quantity });
const lineas = (n: number) => Array.from({ length: n }, (_, i) => linea(`P-${i}`, 1));

describe("commandItems – escenarios normales", () => {
  it("CI-N1: normaliza el código (espacios y minúsculas) y conserva la cantidad", () => {
    expect(commandItems([linea(" prod-002 ", 2)])).toEqual([{ code: "PROD-002", quantity: 2 }]);
  });

  it("CI-N2: devuelve varias líneas distintas en el mismo orden en que se ingresaron", () => {
    expect(commandItems([linea("PROD-002", 2), linea("PROD-004", 1)])).toEqual([
      { code: "PROD-002", quantity: 2 },
      { code: "PROD-004", quantity: 1 },
    ]);
  });
});

describe("commandItems – escenarios alternativos", () => {
  it("CI-A1: acepta una cantidad enviada como texto numérico («5»)", () => {
    expect(commandItems([linea("PROD-004", "5")])).toEqual([{ code: "PROD-004", quantity: 5 }]);
  });

  it("CI-A2: suma las cantidades de un mismo producto ingresado dos veces", () => {
    expect(commandItems([linea("PROD-004", 1), linea("prod-004", 2)])).toEqual([
      { code: "PROD-004", quantity: 3 },
    ]);
  });

  it("CI-A3: devuelve una lista vacía si no recibe un arreglo", () => {
    expect(commandItems(undefined)).toEqual([]);
    expect(commandItems({ code: "PROD-002", quantity: 1 })).toEqual([]);
  });

  it("CI-A4: rechaza una línea sin código con un mensaje que explica la regla", () => {
    expect(() => commandItems([linea("   ", 1)])).toThrow(
      `Cada producto necesita un código y una cantidad entera entre 1 y ${MAX_QUANTITY}.`,
    );
  });
});

describe("commandItems – casos límite", () => {
  it.each([
    ["en el mínimo válido", 1, "aceptada"],
    ["por debajo del mínimo", 0, "rechazada"],
    ["en el máximo válido", MAX_QUANTITY, "aceptada"],
    ["por encima del máximo", MAX_QUANTITY + 1, "rechazada"],
  ])("CI-L1: cantidad %s (%s) → %s", (_caso, cantidad, resultado) => {
    const ejecutar = () => commandItems([linea("PROD-004", cantidad)]);
    if (resultado === "aceptada") expect(ejecutar()).toEqual([{ code: "PROD-004", quantity: cantidad }]);
    else expect(ejecutar).toThrow();
  });

  it("CI-L2: la cantidad acumulada de un producto puede llegar a 10 000, pero no superarla", () => {
    expect(commandItems([linea("PROD-004", 9_999), linea("PROD-004", 1)])).toEqual([
      { code: "PROD-004", quantity: 10_000 },
    ]);
    expect(() => commandItems([linea("PROD-004", 9_999), linea("PROD-004", 2)])).toThrow(
      "La cantidad acumulada de PROD-004 supera 10000.",
    );
  });

  it("CI-L3: acepta un código de 30 caracteres y rechaza uno de 31", () => {
    expect(commandItems([linea("A".repeat(30), 1)])).toHaveLength(1);
    expect(() => commandItems([linea("A".repeat(31), 1)])).toThrow();
  });

  it("CI-L4: acepta 500 líneas de productos y rechaza 501", () => {
    expect(commandItems(lineas(500))).toHaveLength(500);
    expect(() => commandItems(lineas(501))).toThrow("Una operación admite hasta 500 líneas de productos.");
  });
});
