import { useMemo, useState, type FormEvent } from "react";
import { FormActions } from "../../components/FormActions";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import type { AppCommand, AppData, LineInput } from "../../types";

interface SalePageProps {
  data: AppData;
  command: AppCommand;
}

export function SalePage({ data, command }: SalePageProps) {
  const [lines, setLines] = useState<LineInput[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const productsInStock = data.products.filter((product) => product.stock > 0);
  const stockLimits = useMemo(
    () => new Map(productsInStock.map((product) => [product.code, product.stock])),
    [productsInStock],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      await command("register-sale", {
        receiptType: form.get("receiptType"),
        clientName: form.get("clientName"),
        clientDocument: form.get("clientDocument"),
        paymentMethod: form.get("paymentMethod"),
        items: lines,
      });
      setLines([]);
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar la venta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Registrar venta"
        description="Registra el comprobante de pago, el cobro y la salida de inventario en una sola operación."
      />
      <form
        className="panel form-layout"
        onSubmit={submit}
        aria-describedby={error ? "sale-error" : undefined}
      >
        <fieldset>
          <legend>Datos del comprobante de pago</legend>
          <div className="form-grid">
            <label>
              Tipo de comprobante
              <select name="receiptType">
                <option value="BOLETA">Boleta</option>
                <option value="FACTURA">Factura</option>
              </select>
            </label>
            <label>
              Método de pago
              <select name="paymentMethod">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="YAPE">Yape</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </label>
            <label>
              Cliente
              <input name="clientName" list="sale-clients" placeholder="Nombre completo" required />
            </label>
            <label>
              Documento del cliente <span className="optional-text">Opcional</span>
              <input name="clientDocument" maxLength={20} autoComplete="off" />
            </label>
          </div>
          <datalist id="sale-clients">
            {data.clients.map((client) => (
              <option key={client.document} value={client.fullName} />
            ))}
          </datalist>
        </fieldset>
        <fieldset>
          <legend>Productos vendidos</legend>
          <ProductLines
            products={productsInStock}
            value={lines}
            onChange={setLines}
            limits={stockLimits}
            label="Productos disponibles para la venta"
          />
        </fieldset>
        {error && (
          <p id="sale-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <FormActions busy={busy} disabled={!lines.length} label="Registrar venta" />
      </form>
    </>
  );
}
