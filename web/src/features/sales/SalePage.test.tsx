import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
      id: 7,
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
  it("conserva el carrito y explica el error cuando no se guarda la venta", async () => {
    const command = vi.fn().mockRejectedValue(new Error("El stock cambió. Actualiza la venta."));
    render(
      <MemoryRouter>
        <SalePage data={data} command={command} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: /Buscar cliente/ }), {
      target: { value: "Cliente de Prueba" },
    });
    fireEvent.click(screen.getByRole("option", { name: /Cliente de Prueba/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Cable USB" }));
    fireEvent.click(screen.getByRole("button", { name: "Importe exacto" }));
    fireEvent.click(screen.getByRole("button", { name: "Revisar y cobrar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar venta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El stock cambió");
    expect(screen.getByRole("spinbutton", { name: "Cantidad de Cable USB" })).toHaveValue(1);
    expect(screen.queryByText(/Venta registrada/)).not.toBeInTheDocument();
    expect(command).toHaveBeenCalledOnce();
  });
  it("envía una venta válida al controlador de comandos", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <MemoryRouter>
        <SalePage data={data} command={command} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: /Buscar cliente/ }), {
      target: { value: "Cliente de Prueba" },
    });
    fireEvent.click(screen.getByRole("option", { name: /Cliente de Prueba/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Cable USB" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cantidad de Cable USB" }), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Importe exacto" }));
    fireEvent.click(screen.getByRole("button", { name: "Revisar y cobrar" }));
    expect(command).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar venta" }));

    await waitFor(() =>
      expect(command).toHaveBeenCalledWith(
        "register-sale",
        expect.objectContaining({
          clientId: 7,
          cashReceived: 47.2,
          items: [{ code: "P-001", quantity: 2 }],
        }),
      ),
    );
    expect(await screen.findByText(/Venta registrada/)).toBeInTheDocument();
  });

  it("INC-01: explica en la página que el efectivo no cubre el total y marca el campo", () => {
    const command = vi.fn();
    render(
      <MemoryRouter>
        <SalePage data={data} command={command} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: /Buscar cliente/ }), {
      target: { value: "Cliente de Prueba" },
    });
    fireEvent.click(screen.getByRole("option", { name: /Cliente de Prueba/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Cable USB" }));
    const efectivo = screen.getByLabelText("Efectivo recibido (S/)");
    expect(efectivo).toHaveAttribute("min", "0"); // sin bloqueo nativo: decide la regla de negocio
    fireEvent.change(efectivo, { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar y cobrar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("El efectivo recibido no cubre el total.");
    expect(efectivo).toHaveAttribute("aria-invalid", "true");
    expect(efectivo).toHaveAttribute("aria-describedby", "sale-form-error");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(command).not.toHaveBeenCalled();
  });
  it("INC-10: con el efectivo vacío muestra el mensaje en la página y no la burbuja nativa del navegador", () => {
    const command = vi.fn();
    render(
      <MemoryRouter>
        <SalePage data={data} command={command} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: /Buscar cliente/ }), {
      target: { value: "Cliente de Prueba" },
    });
    fireEvent.click(screen.getByRole("option", { name: /Cliente de Prueba/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Cable USB" }));
    const efectivo = screen.getByLabelText("Efectivo recibido (S/)");
    expect(efectivo).not.toBeRequired();
    fireEvent.click(screen.getByRole("button", { name: "Revisar y cobrar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("El efectivo recibido no cubre el total.");
    expect(efectivo).toHaveAttribute("aria-invalid", "true");
    expect(command).not.toHaveBeenCalled();
  });
});
