import { useMemo, useState, type FormEvent } from "react";
import { FormActions } from "../../components/FormActions";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import type { AppCommand, AppData, LineInput } from "../../types";

interface ReceiptPageProps {
  data: AppData;
  command: AppCommand;
}

export function ReceiptPage({ data, command }: ReceiptPageProps) {
  const [purchaseNumber, setPurchaseNumber] = useState("");
  const [lines, setLines] = useState<LineInput[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const purchase = data.purchases.find((item) => item.number === purchaseNumber);
  const pendingQuantities = useMemo(
    () => new Map(purchase?.items.map((item) => [item.code, item.pending]) ?? []),
    [purchase],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      await command("register-receipt", {
        purchaseNumber,
        guide: form.get("guide"),
        entryDate: form.get("entryDate"),
        notes: form.get("notes"),
        items: lines,
      });
      setLines([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar la recepción.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Recepción de compra"
        description="Confirma los productos recibidos y actualiza el inventario con trazabilidad."
      />
      <form
        className="panel form-layout"
        onSubmit={submit}
        aria-describedby={error ? "receipt-error" : undefined}
      >
        <fieldset>
          <legend>Orden y recepción</legend>
          <div className="form-grid">
            <label>
              Orden de compra
              <select
                required
                value={purchaseNumber}
                onChange={(event) => {
                  setPurchaseNumber(event.target.value);
                  setLines([]);
                }}
              >
                <option value="">Selecciona una orden</option>
                {data.purchases.map((item) => (
                  <option key={item.number} value={item.number}>
                    {item.number} · {item.supplier}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha de recepción
              <input type="date" name="entryDate" />
            </label>
            <label>
              Número de guía <span className="optional-text">Opcional</span>
              <input name="guide" maxLength={50} />
            </label>
            <label>
              Observación <span className="optional-text">Opcional</span>
              <input name="notes" maxLength={500} />
            </label>
          </div>
        </fieldset>
        {purchase && (
          <fieldset>
            <legend>Productos pendientes de recepción</legend>
            <ProductLines
              products={data.products}
              value={lines}
              onChange={setLines}
              limits={pendingQuantities}
              label="Productos pendientes de la orden de compra"
            />
          </fieldset>
        )}
        {error && (
          <p id="receipt-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <FormActions busy={busy} disabled={!purchaseNumber || !lines.length} label="Registrar recepción" />
      </form>
    </>
  );
}
