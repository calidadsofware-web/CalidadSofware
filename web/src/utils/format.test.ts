import { describe, expect, it } from "vitest";
import { isActive, normalized, saleTotals } from "./format";

/**
 * PC10 – Pruebas unitarias del cálculo de la venta (HU02 / RF03).
 * Los precios se registran sin IGV; el sistema agrega el 18 % y redondea a dos decimales.
 */
describe("saleTotals: subtotal, IGV (18 %) y total", () => {
  it.each([
    // [descripción, subtotal sin IGV, IGV esperado, total esperado]
    ["venta válida del caso CP03 (2 × S/ 30 + 1 × S/ 12)", 72, 12.96, 84.96],
    ["venta válida de un producto (Audífonos S/ 45)", 45, 8.1, 53.1],
    ["precio con decimales (Cargador S/ 59.90)", 59.9, 10.78, 70.68],
  ])("calcula %s", (_caso, subtotal, igv, total) => {
    const resultado = saleTotals(subtotal);
    expect(resultado.subtotal).toBe(subtotal);
    expect(resultado.tax).toBe(igv);
    expect(resultado.total).toBe(total);
  });

  it("caso límite: un carrito vacío da subtotal, IGV y total en cero", () => {
    expect(saleTotals(0)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it("caso límite: el menor importe (S/ 0.01) no genera IGV por redondeo", () => {
    expect(saleTotals(0.01)).toEqual({ subtotal: 0.01, tax: 0, total: 0.01 });
  });

  it("caso límite: redondea el IGV al céntimo más cercano (0.5 hacia arriba)", () => {
    // 0.25 × 0.18 = 0.045 → 0.05
    expect(saleTotals(0.25).tax).toBe(0.05);
  });

  it("dato inválido: redondea un subtotal con más de dos decimales antes de calcular", () => {
    expect(saleTotals(10.005)).toEqual({ subtotal: 10.01, tax: 1.8, total: 11.81 });
  });

  it("caso límite: soporta el importe máximo permitido por el formulario (S/ 9 999 999)", () => {
    expect(saleTotals(9_999_999)).toEqual({ subtotal: 9_999_999, tax: 1_799_999.82, total: 11_799_998.82 });
  });
});

describe("normalized e isActive: búsqueda y estado de productos (HU01)", () => {
  it("ignora tildes y mayúsculas para que «Audífonos» coincida con «audifonos»", () => {
    expect(normalized("Audífonos Bluetooth")).toBe("audifonos bluetooth");
  });

  it("dato inválido: convierte null o undefined en texto vacío sin lanzar errores", () => {
    expect(normalized(null)).toBe("");
    expect(normalized(undefined)).toBe("");
  });

  it("considera activo un producto sin estado o con estado «Activo» y excluye «Inactivo»", () => {
    expect(isActive(undefined)).toBe(true);
    expect(isActive("ACTIVO")).toBe(true);
    expect(isActive("Inactivo")).toBe(false);
  });
});
