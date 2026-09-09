export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new HttpError(403, "Origen de solicitud no permitido.");
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "El contenido debe enviarse como JSON.");
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "El cuerpo JSON no es válido.");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ ok: false, message: error.message }, error.status);
  }
  console.error("Unhandled DataCell function error", error);
  return json({ ok: false, message: "No se pudo completar la operación." }, 500);
}
