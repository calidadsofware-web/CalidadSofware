import type { AppData, AppUser } from "./types";

interface ApiEnvelope<T = undefined> {
  ok: boolean;
  message?: string;
  data?: T;
}

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || !body.ok) {
    throw new Error(body.message || "No fue posible comunicarse con DataCell.");
  }
  if (body.data === undefined) throw new Error("La respuesta del servidor está incompleta.");
  return body.data;
}

export async function loadAppData(signal?: AbortSignal): Promise<AppData> {
  return parse<AppData>(
    await fetch("/api/datacell", {
      signal,
      credentials: "same-origin",
    }),
  );
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
  action: "sign-in" | "sign-out" | "session",
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

export async function getCurrentSession(): Promise<AppUser | null> {
  try {
    return (await sendSessionAction("session")).user ?? null;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  await sendSessionAction("sign-out");
}
