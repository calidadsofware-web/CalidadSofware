import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { CollectionTable } from "./CollectionTable";
import { SearchSelect } from "./SearchSelect";
import { ProductLines } from "./ProductLines";
import type { LineInput, Product } from "../types";

describe("listas de trabajo", () => {
  it("incluye todos los movimientos del día final del filtro", () => {
    render(
      <CollectionTable
        title="Movimientos"
        dateField="date"
        rows={[
          { id: 1, name: "Incluido", date: "20/09/2026 23:59" },
          { id: 2, name: "Excluido", date: "21/09/2026 00:01" },
        ]}
        columns={[
          ["name", "Nombre"],
          ["date", "Fecha"],
        ]}
      />,
    );
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-09-20" } });
    expect(screen.getByText("Incluido")).toBeInTheDocument();
    expect(screen.queryByText("Excluido")).not.toBeInTheDocument();
  });
  it("pagina, busca sin tildes y filtra por estado", () => {
    const rows = Array.from({ length: 35 }, (_, i) => ({
      id: i,
      name: `Artículo ${i}`,
      status: i % 2 ? "Activo" : "Inactivo",
    }));
    render(
      <CollectionTable
        title="Catálogo"
        rows={rows}
        columns={[
          ["name", "Nombre"],
          ["status", "Estado"],
        ]}
        filters={[["status", "Estado"]]}
      />,
    );
    expect(screen.getAllByRole("row")).toHaveLength(11);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Artículo 10")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "articulo 3" } });
    expect(screen.getByText("Artículo 3")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Estado" }), { target: { value: "Activo" } });
    expect(screen.queryByText("Artículo 30")).not.toBeInTheDocument();
    expect(screen.getByText("Artículo 31")).toBeInTheDocument();
  });
  it("limita un catálogo grande y conserva el carrito al cambiar de página", () => {
    const products: Product[] = Array.from({ length: 100 }, (_, i) => ({
      code: `SKU-${i}`,
      name: `Producto ${i}`,
      description: "",
      category: "Cables",
      brand: "Marca",
      stock: 5,
      minStock: 2,
      price: 10,
    }));
    function Harness() {
      const [lines, setLines] = useState<LineInput[]>([]);
      return <ProductLines products={products} value={lines} onChange={setLines} label="Catálogo" />;
    }
    render(<Harness />);
    expect(screen.getAllByRole("button", { name: /Agregar Producto/ })).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Producto 0" }));
    fireEvent.click(screen.getByRole("button", { name: "Más productos" }));
    expect(screen.getByRole("spinbutton", { name: "Cantidad de Producto 0" })).toHaveValue(1);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "SKU-99" } });
    expect(screen.getByRole("button", { name: "Agregar Producto 99" })).toBeInTheDocument();
  });
  it("permite seleccionar clientes por documento usando teclado", () => {
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <SearchSelect
          label="Cliente"
          value={value}
          onChange={setValue}
          options={[
            { value: "1", label: "José Pérez", detail: "70000001" },
            { value: "2", label: "José Pérez", detail: "70000002" },
          ]}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "70000002" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("José Pérez");
    expect(screen.getByText("70000002")).toBeInTheDocument();
  });
});
