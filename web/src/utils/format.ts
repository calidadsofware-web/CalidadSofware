export const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
export const normalized = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-PE");
export const isActive = (status?: string) => !status || normalized(status) === "activo";
export const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
export function dateKey(value: unknown): string {
  const text = String(value ?? "");
  const match = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
  return match ? `${match[3]}-${match[2]}-${match[1]}${text.slice(10)}` : text;
}
export function saleTotals(subtotal: number) {
  const base = Math.round((subtotal + Number.EPSILON) * 100) / 100;
  const tax = Math.round((base * 0.18 + Number.EPSILON) * 100) / 100;
  return { subtotal: base, tax, total: Math.round((base + tax) * 100) / 100 };
}
