import type { AppData, AppUser } from "./types";

interface ApiEnvelope<T = undefined> {
  ok: boolean;
  message?: string;
  data?: T;
}

interface SessionState {
  user: AppUser | null;
  appData: AppData | null;
}

declare global {
  interface Window {
    __DATACELL_BOOTSTRAP__?: Promise<Response>;
  }
}

const APP_STATE_URL = "/api/datacell?bootstrap=1";

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || !body.ok) {
    throw new Error(body.message || "No fue posible comunicarse con DataCell.");
  }
  if (body.data === undefined) throw new Error("La respuesta del servidor está incompleta.");
  return body.data;
}

async function requestAppState(signal?: AbortSignal): Promise<SessionState> {
  const earlyRequest = signal ? undefined : window.__DATACELL_BOOTSTRAP__;
  if (earlyRequest) delete window.__DATACELL_BOOTSTRAP__;

  return parse<SessionState>(
    await (earlyRequest ??
      fetch(APP_STATE_URL, {
        signal,
        credentials: "same-origin",
      })),
  );
}

export async function loadAppData(signal?: AbortSignal): Promise<AppData> {
  const state = await requestAppState(signal);
  if (!state.appData) throw new Error("Debes iniciar sesión.");
  return state.appData;
}

export async function getCurrentSession(): Promise<SessionState> {
  return requestAppState();
}

export async function runCommand(action: string, payload: unknown): Promise<string> {
  const response = await fetch("/api/datacell", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, payload }),
  });
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope;
  if (!response.ok || !body.ok) throw new Error(body.message || "No se pudo completar la operación.");
  return body.message || "Operación completada.";
}

async function sendSessionAction(
  action: "sign-in" | "sign-out",
  payload: object = {},
): Promise<{ user?: AppUser }> {
  const response = await fetch("/api/datacell", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return parse<{ user?: AppUser }>(response);
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const data = await sendSessionAction("sign-in", { email, password });
  if (!data.user) throw new Error("La respuesta de inicio de sesión está incompleta.");
  return data.user;
}

export async function signOut(): Promise<void> {
  await sendSessionAction("sign-out");
}
