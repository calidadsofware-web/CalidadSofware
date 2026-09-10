import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "./http.js";

afterEach(() => vi.restoreAllMocks());

describe("utilidades HTTP", () => {
  it("crea respuestas JSON sin caché", async () => {
    const response = json({ ok: true }, 201);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("acepta solicitudes del mismo origen", () => {
    const request = new Request("https://datacell.example/api/datacell", {
      headers: { origin: "https://datacell.example" },
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rechaza solicitudes de otro origen", () => {
    const request = new Request("https://datacell.example/api/datacell", {
      headers: { origin: "https://attacker.example" },
    });
    expect(() => assertSameOrigin(request)).toThrowError(HttpError);
  });

  it("lee JSON válido y rechaza tipos de contenido incorrectos", async () => {
    const valid = new Request("https://datacell.example/api/datacell", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "session" }),
    });
    await expect(readJson(valid)).resolves.toEqual({ action: "session" });

    const invalid = new Request("https://datacell.example/api/datacell", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "session",
    });
    await expect(readJson(invalid)).rejects.toMatchObject({ status: 415 });
  });

  it("oculta los detalles de errores inesperados", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = errorResponse(new Error("detalle interno"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "No se pudo completar la operación.",
    });
  });
});
