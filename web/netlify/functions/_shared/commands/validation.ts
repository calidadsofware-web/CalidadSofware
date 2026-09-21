import type { CommandLine, ItemInput } from "./types.js";
import { HttpError } from "../http.js";

export const MAX_QUANTITY = 10_000;

export function normalizeText(value: unknown, fallback = "", maxLength = 500): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

export function optionalText(value: unknown, maxLength = 500): string | null {
  const normalized = normalizeText(value, "", maxLength);
  return normalized || null;
}

export function allowedOption(value: unknown, fallback: string, allowed: readonly string[]): string {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = normalizeText(value, fallback, 40).toUpperCase();
  if (typeof value !== "string" || !allowed.includes(normalized))
    throw new HttpError(400, "Selecciona una opción válida.");
  return normalized;
}

export function isoDate(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day;
  return isValid ? normalized : null;
}

export function commandItems(value: unknown): CommandLine[] {
  if (!Array.isArray(value)) return [];
  if (value.length > 500) throw new HttpError(400, "Una operación admite hasta 500 líneas de productos.");
  const totals = new Map<string, number>();

  for (const raw of value as ItemInput[]) {
    const code = typeof raw?.code === "string" ? raw.code.trim().toUpperCase() : "";
    const quantity =
      typeof raw?.quantity === "number" || typeof raw?.quantity === "string" ? Number(raw.quantity) : NaN;
    if (!code || code.length > 30 || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY)
      throw new HttpError(
        400,
        `Cada producto necesita un código y una cantidad entera entre 1 y ${MAX_QUANTITY}.`,
      );
    const combined = (totals.get(code) ?? 0) + quantity;
    if (combined > MAX_QUANTITY)
      throw new HttpError(400, `La cantidad acumulada de ${code} supera ${MAX_QUANTITY}.`);
    totals.set(code, combined);
  }

  return [...totals].map(([code, quantity]) => ({ code, quantity }));
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
