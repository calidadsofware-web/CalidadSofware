import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ getAccessToken: vi.fn(async () => "test-token") }));

import { loadAppData, runCommand } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("DataCell API client", () => {
  it("envía el token al consultar los datos", async () => {
    const data = { user: { id: 1 } };
    const fetchMock = vi.fn(async () => Response.json({ ok: true, data }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadAppData()).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith("/api/datacell", expect.objectContaining({
      headers: { Authorization: "Bearer test-token" },
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
