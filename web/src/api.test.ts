import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentSession, loadAppData, runCommand, signIn, signOut } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.__DATACELL_BOOTSTRAP__;
});

describe("DataCell API client", () => {
  it("incluye las cookies de sesión al consultar los datos", async () => {
    const data = { user: { id: 1 } };
    const fetchMock = vi.fn(async () =>
      Response.json({ ok: true, data: { user: data.user, appData: data } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadAppData()).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/datacell?bootstrap=1",
      expect.objectContaining({
        credentials: "same-origin",
      }),
    );
  });

  it("propaga el mensaje seguro de un comando rechazado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ ok: false, message: "No tienes permisos para esta operación." }, { status: 403 }),
      ),
    );

    await expect(runCommand("register-sale", {})).rejects.toThrow("No tienes permisos");
  });

  it("devuelve el usuario autenticado al iniciar sesión", async () => {
    const user = { id: 1, email: "qa@datacell.local", role: "ADMINISTRADOR" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ok: true, data: { user } })),
    );

    await expect(signIn("qa@datacell.local", "clave-segura")).resolves.toEqual(user);
    expect(fetch).toHaveBeenCalledWith(
      "/api/datacell",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          action: "sign-in",
          payload: { email: "qa@datacell.local", password: "clave-segura" },
        }),
      }),
    );
  });

  it("trata la ausencia de sesión como usuario no autenticado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ok: true, data: { user: null, appData: null } })),
    );
    await expect(getCurrentSession()).resolves.toEqual({ user: null, appData: null });
  });

  it("reutiliza la solicitud iniciada por el HTML sin duplicar la consulta", async () => {
    const state = { user: null, appData: null };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.__DATACELL_BOOTSTRAP__ = Promise.resolve(Response.json({ ok: true, data: state }));

    await expect(getCurrentSession()).resolves.toEqual(state);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envía la acción de cierre de sesión", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true, data: {} }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(signOut()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/datacell",
      expect.objectContaining({ body: JSON.stringify({ action: "sign-out", payload: {} }) }),
    );
  });
});
