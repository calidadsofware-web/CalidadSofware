/**
 * Datos de entrada del flujo crítico "Registrar venta".
 * Corresponden a las cuentas y semillas del entorno local (README del proyecto y supabase/schema.sql).
 */
export const usuarios = {
  cajero: { correo: "caja@local.test", clave: "Local-demo-2026!", rol: "Cajero" },
  invalido: { correo: "caja@local.test", clave: "ClaveIncorrecta-123" },
} as const;

export const venta = {
  cliente: { busqueda: "45678912", nombre: "Maria Torres" },
  productos: [
    { busqueda: "PROD-002", nombre: "Cargador USB-C 20W", cantidad: 2, precioSinIgv: 30.0 },
    { busqueda: "PROD-004", nombre: "Mica templada 9H", cantidad: 1, precioSinIgv: 12.0 },
  ],
  comprobante: "BOLETA",
  metodoPago: "EFECTIVO",
  efectivoRecibido: "100",
  observacion: "Venta automatizada con Playwright - Actividad 08",
  // Resultados esperados (IGV 18 % sobre precios sin IGV)
  esperado: { subtotal: "72.00", igv: "12.96", total: "84.96", vuelto: "15.04" },
} as const;

export const ventaEfectivoInsuficiente = {
  cliente: { busqueda: "71234567", nombre: "Luis Herrera" },
  producto: { busqueda: "PROD-003", nombre: "Audifonos Bluetooth", cantidad: 1 },
  efectivoRecibido: "10",
  esperado: { total: "53.10" },
} as const;

export const ventaSobreStock = {
  cliente: { busqueda: "70011223", nombre: "Camila Rojas" },
  producto: { busqueda: "PROD-005", nombre: "Power Bank 10000mAh" },
  cantidadSolicitada: 999,
} as const;
