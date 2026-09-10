import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { LineInput, Product } from "../types";
import { ProductLines } from "./ProductLines";

const product: Product = {
  code: "P-001",
  name: "Cable USB",
  description: "Cable de prueba",
  category: "Accesorios",
  brand: "Genérico",
  stock: 3,
  minStock: 1,
  price: 12.5,
};

function Harness({ limits }: { limits?: ReadonlyMap<string, number> }) {
  const [lines, setLines] = useState<LineInput[]>([]);
  return (
    <ProductLines
      products={[product]}
      value={lines}
      onChange={setLines}
      limits={limits}
      label="Productos de prueba"
    />
  );
}

describe("ProductLines", () => {
  it("permite solicitar una cantidad superior al stock cuando no existe un límite", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Cable USB/i }));
    const quantity = screen.getByRole("spinbutton", { name: "Cantidad" });
    fireEvent.change(quantity, { target: { value: "25" } });
    expect(quantity).toHaveValue(25);
    expect(quantity).not.toHaveAttribute("max");
  });

  it("respeta el saldo máximo en una recepción", () => {
    render(<Harness limits={new Map([[product.code, 3]])} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Cable USB/i }));
    const quantity = screen.getByRole("spinbutton", { name: "Cantidad" });
    fireEvent.change(quantity, { target: { value: "10" } });
    expect(quantity).toHaveValue(3);
    expect(quantity).toHaveAttribute("max", "3");
  });
});
