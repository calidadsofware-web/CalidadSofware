import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("formularios en ventana", () => {
  it("pide confirmar antes de descartar productos agregados con botones", () => {
    const close = vi.fn();
    render(
      <Modal title="Solicitud" onClose={close} warnOnClose hasChanges>
        <p>Productos seleccionados</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cerrar ventana" }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("cambios sin guardar");
    fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it("impide cerrar mientras se guarda", () => {
    const close = vi.fn();
    render(
      <Modal title="Guardando" onClose={close} busy>
        <p>En proceso</p>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Cerrar ventana" })).toBeDisabled();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
    expect(close).not.toHaveBeenCalled();
  });
});
