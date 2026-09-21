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
    const body: unknown = await request.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected object");
    return body as T;
  } catch {
    throw new HttpError(400, "El cuerpo JSON no es válido.");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ ok: false, message: error.message }, error.status);
  }
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : "";
  if (code === "23505")
    return json(
      {
        ok: false,
        message:
          "Ya existe un registro con ese documento, correo, SKU o código de barras. Revisa los datos antes de guardar.",
      },
      409,
    );
  if (code === "40001" || code === "40P01")
    return json(
      {
        ok: false,
        message: "Otra operación modificó estos datos. Actualiza la información e inténtalo nuevamente.",
      },
      409,
    );
  console.error("Unhandled DataCell function error", error);
  return json({ ok: false, message: "No se pudo completar la operación." }, 500);
}
