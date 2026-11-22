import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { AppData } from "../../types";
import { PaymentsPage } from "./PaymentsPage";

const venta = (document: string, cashier: string, products: string, total: number) => ({
  document,
  client: "Cliente de Prueba",
  cashier,
  products,
  date: "22/11/2026 10:15",
  method: "Efectivo",
  status: "Pagado",
  reference: "",
  total,
  items: [],
});

const data = {
  payments: [
    venta("B001-00000001", "Ana Caja", "Cargador USB-C 20W, Mica templada 9H", 84.96),
    venta("B001-00000002", "Luis Caja", "Funda iPhone 14", 31.86),
    venta("B001-00000003", "Ana Caja", "Audifonos Bluetooth", 53.1),
  ],
} as unknown as AppData;

const filas = () =>
  within(screen.getByRole("region", { name: "Tabla: Historial de ventas y pagos" }))
    .getAllByRole("row")
    .slice(1);

describe("INC-14: historial de ventas por cajero y por producto (RF08)", () => {
  it("muestra el cajero de cada venta y permite filtrar por cajero", () => {
    render(
      <MemoryRouter>
        <PaymentsPage data={data} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("columnheader", { name: /Cajero/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Cajero"), { target: { value: "Ana Caja" } });
    expect(filas()).toHaveLength(2);
    expect(filas().every((fila) => fila.textContent?.includes("Ana Caja"))).toBe(true);
  });

  it("encuentra las ventas que incluyen un producto aunque no sea una columna de la tabla", () => {
    render(
      <MemoryRouter>
        <PaymentsPage data={data} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), {
      target: { value: "mica templada" },
    });
    expect(filas()).toHaveLength(1);
    expect(filas()[0]).toHaveTextContent("B001-00000001");
  });
});
