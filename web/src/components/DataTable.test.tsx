import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./DataTable";

describe("DataTable", () => {
  it("expone un nombre accesible y encabezados de columna", () => {
    render(
      <DataTable
        caption="Listado de productos"
        rows={[{ code: "P-001", name: "Cable USB", price: 12.5 }]}
        columns={[
          ["code", "Código"],
          ["name", "Producto"],
          ["price", "Precio"],
        ]}
        moneyKeys={["price"]}
      />,
    );

    expect(screen.getByRole("table", { name: "Listado de productos" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Código" })).toHaveAttribute("scope", "col");
    expect(screen.getByText(/12\.50/)).toHaveTextContent("S/ 12.50");
  });

  it("presenta un estado vacío comprensible", () => {
    render(<DataTable caption="Listado vacío" rows={[]} columns={[["code", "Código"]]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No hay información para mostrar");
  });
});
