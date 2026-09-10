import type { CommandLine, ItemInput } from "./types.js";

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
  const normalized = normalizeText(value, fallback, 40).toUpperCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

export function isoDate(value: unknown): string | null {
  const normalized = normalizeText(value, "", 10);
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
  const totals = new Map<string, number>();

  for (const raw of value as ItemInput[]) {
    const code = normalizeText(raw?.code, "", 30).toUpperCase();
    const parsed = Number(raw?.quantity);
    const quantity = Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 0), MAX_QUANTITY) : 0;

    if (code && quantity > 0) {
      totals.set(code, Math.min((totals.get(code) ?? 0) + quantity, MAX_QUANTITY));
    }
  }

  return [...totals].map(([code, quantity]) => ({ code, quantity }));
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
