import { HttpError } from "../http.js";
import { isoDate } from "./validation.js";

export type Fields = Record<string, unknown>;

export function moneyField(value: unknown, label: string, minimum = 0): number {
  const number = numberField(value, label, minimum);
  if (Math.abs(number * 100 - Math.round(number * 100)) > 0.000001)
    throw new HttpError(400, `${label}: admite como máximo dos decimales.`);
  return number;
}

export function dateField(value: unknown, label: string, direction: "future" | "past"): string | null {
  if (value === undefined || value === null || value === "") return null;
  const date = isoDate(value);
  const current = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (!date || (direction === "future" && date < current) || (direction === "past" && date > current))
    throw new HttpError(
      400,
      `${label}: ingresa una fecha válida ${direction === "future" ? "de hoy en adelante" : "no posterior a hoy"}.`,
    );
  return date;
}

export function textField(value: unknown, label: string, max: number, required = false): string {
  if (value !== undefined && value !== null && typeof value !== "string")
    throw new HttpError(400, `${label}: ingresa texto válido.`);
  const text = typeof value === "string" ? value.trim() : "";
  if ((required && !text) || text.length > max)
    throw new HttpError(
      400,
      `${label}: ${required ? "es obligatorio y admite" : "admite"} hasta ${max} caracteres.`,
    );
  return text;
}

export function numberField(value: unknown, label: string, minimum = 0, integer = false): number {
  const number =
    typeof value === "number" || (typeof value === "string" && value.trim()) ? Number(value) : NaN;
  if (
    !Number.isFinite(number) ||
    number < minimum ||
    number > 9_999_999 ||
    (integer && !Number.isInteger(number))
  ) {
    throw new HttpError(
      400,
      `${label}: ingresa ${integer ? "un entero" : "un número"} entre ${minimum} y 9999999.`,
    );
  }
  return number;
}

export function optionField(value: unknown, options: readonly string[], label: string): string {
  if (typeof value !== "string" || !options.includes(value))
    throw new HttpError(400, `${label}: selecciona una opción válida.`);
  return value;
}

export function emailField(value: unknown, required = false): string | null {
  const email = textField(value, "Correo", 120, required).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "Ingresa un correo electrónico válido.");
  return email || null;
}

export function phoneField(value: unknown): string | null {
  const phone = textField(value, "Teléfono", 20);
  if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone))
    throw new HttpError(400, "Ingresa un teléfono de contacto válido.");
  return phone || null;
}

export function documentField(value: unknown, type: unknown): string | null {
  const document = textField(value, "Documento", 20);
  const kind = optionField(type, ["DNI", "RUC", "OTRO", "SIN_DOCUMENTO"], "Tipo de documento");
  if (kind === "SIN_DOCUMENTO") return null;
  if (
    (kind === "DNI" && !/^\d{8}$/.test(document)) ||
    (kind === "RUC" && !/^\d{11}$/.test(document)) ||
    (kind === "OTRO" && !/^[a-zA-Z0-9-]{4,20}$/.test(document))
  ) {
    throw new HttpError(
      400,
      kind === "DNI"
        ? "El DNI debe tener 8 dígitos."
        : kind === "RUC"
          ? "El RUC debe tener 11 dígitos."
          : "Ingresa un documento válido (4 a 20 caracteres).",
    );
  }
  return document;
}
