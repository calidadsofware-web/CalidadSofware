import type { AppData } from "./types";
import { getAccessToken } from "./supabase";

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
  const token = await getAccessToken();
  return parse<AppData>(await fetch("/api/datacell", {
    signal,
    credentials: "same-origin",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }));
}

export async function runCommand(action: string, payload: unknown): Promise<string> {
  const token = await getAccessToken();
  const response = await fetch("/api/datacell", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
  });
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope;
  if (!response.ok || !body.ok) throw new Error(body.message || "No se pudo completar la operación.");
  return body.message || "Operación completada.";
}
