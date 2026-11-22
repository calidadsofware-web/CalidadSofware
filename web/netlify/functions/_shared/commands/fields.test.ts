import { afterEach, describe, expect, it, vi } from "vitest";
import { dateField, minTextField, moneyField } from "./fields.js";

afterEach(() => vi.useRealTimers());

describe("campos comerciales", () => {
  it("exige importes con dos decimales como máximo", () => {
    expect(moneyField("49.90", "Precio")).toBe(49.9);
    expect(() => moneyField("49.999", "Precio")).toThrow();
    expect(() => moneyField(-1, "Precio")).toThrow();
  });
  it("valida fechas según el día de Lima", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T02:00:00Z"));
    expect(dateField("2026-09-19", "Fecha", "past")).toBe("2026-09-19");
    expect(() => dateField("2026-09-20", "Fecha", "past")).toThrow();
    expect(() => dateField("2026-09-18", "Fecha", "future")).toThrow();
    expect(() => dateField("2026-02-31", "Fecha", "future")).toThrow();
    expect(() => dateField("2026-09-20extra", "Fecha", "future")).toThrow();
  });
});

describe("INC-09: longitudes mínimas validadas en el servidor", () => {
  it("rechaza una justificación más corta que el mínimo de la interfaz", () => {
    expect(() => minTextField("abc", "Justificación", 10, 500)).toThrow(
      "Justificación: ingresa al menos 10 caracteres.",
    );
  });
  it("rechaza un texto vacío o solo con espacios", () => {
    expect(() => minTextField("   ", "Motivo del ajuste", 5, 500)).toThrow(/obligatorio/);
  });
  it("acepta el texto que cumple el mínimo y lo devuelve sin espacios extremos", () => {
    expect(minTextField("  Conteo físico  ", "Motivo del ajuste", 5, 500)).toBe("Conteo físico");
  });
});
