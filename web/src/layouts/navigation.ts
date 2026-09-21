import { hasAccess, type AccessPolicy } from "../access";
import type { AppRole } from "../types";

export const navigation = [
  { to: "/", label: "Inicio", group: "Trabajo diario" },
  { to: "/ventas/nueva", label: "Nueva venta", group: "Comercial", policy: "sales" },
  { to: "/pagos", label: "Ventas y pagos", group: "Comercial", policy: "sales" },
  { to: "/clientes", label: "Clientes", group: "Comercial" },
  { to: "/reclamos", label: "Reclamos", group: "Comercial", policy: "sales" },
  { to: "/productos", label: "Productos e inventario", group: "Abastecimiento" },
  { to: "/recepciones/nueva", label: "Recepciones", group: "Abastecimiento", policy: "warehouse" },
  { to: "/solicitudes", label: "Solicitudes de compra", group: "Abastecimiento", policy: "procurement" },
  { to: "/proveedores", label: "Proveedores", group: "Abastecimiento", policy: "procurement" },
  { to: "/cotizaciones", label: "Cotizaciones", group: "Abastecimiento", policy: "quotations" },
  { to: "/usuarios", label: "Equipo y permisos", group: "Administración", policy: "administration" },
] satisfies { to: string; label: string; group: string; policy?: AccessPolicy }[];
export const navigationFor = (role: AppRole) =>
  navigation.filter((item) => !item.policy || hasAccess(role, item.policy));
