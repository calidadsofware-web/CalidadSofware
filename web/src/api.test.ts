import { afterEach, describe, expect, it, vi } from "vitest";

import { loadAppData, runCommand } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("DataCell API client", () => {
  it("incluye las cookies de sesión al consultar los datos", async () => {
    const data = { user: { id: 1 } };
    const fetchMock = vi.fn(async () => Response.json({ ok: true, data }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadAppData()).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith("/api/datacell", expect.objectContaining({
      credentials: "same-origin",
    }));
  });

  it("propaga el mensaje seguro de un comando rechazado", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(
      { ok: false, message: "No tienes permisos para esta operación." },
      { status: 403 },
    )));

    await expect(runCommand("register-sale", {})).rejects.toThrow("No tienes permisos");
  });
});
