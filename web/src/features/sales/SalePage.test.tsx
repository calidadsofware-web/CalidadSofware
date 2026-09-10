import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AppData } from "../../types";
import { SalePage } from "./SalePage";

const data = {
  user: {
    id: 1,
    email: "qa@datacell.local",
    fullName: "Usuario QA",
    role: "ADMINISTRADOR",
    roleDisplay: "Administrador",
  },
  metrics: [],
  products: [
    {
      code: "P-001",
      name: "Cable USB",
      description: "",
      category: "Accesorios",
      brand: "Genérico",
      stock: 3,
      minStock: 1,
      price: 20,
    },
  ],
  clients: [
    {
      document: "70000001",
      fullName: "Cliente de Prueba",
      phone: "-",
      email: "-",
      lastPurchase: "-",
      status: "Activo",
    },
  ],
  suppliers: [],
  purchaseRequests: [],
  quotationRequests: [],
  payments: [],
  claims: [],
  purchases: [],
} satisfies AppData;

describe("SalePage", () => {
  it("envía una venta válida al controlador de comandos", async () => {
    const command = vi.fn(async () => undefined);
    render(<SalePage data={data} command={command} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Cliente" }), {
      target: { value: "Cliente de Prueba" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Cable USB/i }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cantidad" }), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar venta" }));

    expect(command).toHaveBeenCalledWith(
      "register-sale",
      expect.objectContaining({
        clientName: "Cliente de Prueba",
        items: [{ code: "P-001", quantity: 2 }],
      }),
    );
  });
});
