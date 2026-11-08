import { useState, type FormEvent } from "react";
import { CollectionTable } from "../../components/CollectionTable";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import { SearchSelect } from "../../components/SearchSelect";
import { dateKey, today } from "../../utils/format";
import type { AppCommand, AppData, LineInput } from "../../types";

export function ReceiptPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [tab, setTab] = useState("new");
  const [purchaseNumber, setPurchaseNumber] = useState(""),
    [lines, setLines] = useState<LineInput[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const pending = data.purchases.filter((item) => item.items.some((line) => line.pending > 0));
  const purchase = pending.find((item) => item.number === purchaseNumber);
  const limits = new Map(purchase?.items.map((item) => [item.code, item.pending]) ?? []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !purchase) return;
    setBusy(true);
    setError("");
    setSaved(false);
    const form = event.currentTarget;
    try {
      await command("register-receipt", {
        ...Object.fromEntries(new FormData(form)),
        purchaseNumber,
        items: lines,
      });
      setLines([]);
      setPurchaseNumber("");
      form.reset();
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar la recepción.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Recepciones"
        description="Contrasta la entrega con la orden y registra solo lo recibido."
      />
      <div className="segmented" role="group" aria-label="Vista de recepciones">
        <button type="button" aria-pressed={tab === "new"} onClick={() => setTab("new")}>
          Recibir mercadería
        </button>
        <button type="button" aria-pressed={tab === "history"} onClick={() => setTab("history")}>
          Historial de recepciones
        </button>
      </div>
      {tab === "history" ? (
        <CollectionTable
          title="Recepciones registradas"
          rows={data.receipts ?? []}
          dateField="date"
          placeholder="Recepción, orden, proveedor o guía"
          columns={[
            ["number", "Recepción"],
            ["purchase", "Orden"],
            ["supplier", "Proveedor"],
            ["date", "Fecha"],
            ["guide", "Guía"],
            ["notes", "Observación"],
          ]}
        />
      ) : (
        <>
          {saved && (
            <p className="success-notice" role="status">
              Recepción registrada. El inventario y el saldo de la orden están actualizados.
            </p>
          )}
          <form className="panel form-layout" onSubmit={submit}>
            <fieldset disabled={busy}>
              <legend>Orden y documento de entrega</legend>
              <SearchSelect
                label="Orden de compra pendiente"
                required
                options={pending.map((item) => ({
                  value: item.number,
                  label: item.number,
                  detail: item.supplier,
                }))}
                value={purchaseNumber}
                onChange={(value) => {
                  setPurchaseNumber(value);
                  setLines([]);
                }}
                placeholder="Número de orden o proveedor"
              />
              {!pending.length && (
                <p className="field-hint">
                  No hay órdenes pendientes. Una solicitud aprobada por el administrador genera una orden de
                  compra.
                </p>
              )}
              {purchase && (
                <div className="permission-note">
                  <strong>{purchase.supplier}</strong>
                  <p>
                    Estado: {purchase.status}. Puedes registrar entregas parciales; el saldo restante seguirá
                    pendiente.
                  </p>
                </div>
              )}
              <div className="form-grid">
                <label>
                  Fecha de recepción
                  <input
                    type="date"
                    name="entryDate"
                    required
                    min={purchase ? dateKey(purchase.date).slice(0, 10) : undefined}
                    max={today()}
                    defaultValue={today()}
                  />
                </label>
                <label>
                  Guía / Documento de entrega
                  <input name="guide" required maxLength={50} placeholder="Ej. T001-00001234" />
                </label>
                <label className="span-2">
                  Observación de la recepción (opcional)
                  <textarea
                    name="notes"
                    maxLength={500}
                    placeholder="Estado del empaque, diferencias, entregas parciales o incidencias detectadas."
                  />
                </label>
              </div>
            </fieldset>
            {purchase && (
              <fieldset disabled={busy}>
                <legend>Cantidades recibidas</legend>
                <ProductLines
                  products={data.products}
                  value={lines}
                  onChange={setLines}
                  limits={limits}
                  label="Productos pendientes de la orden"
                />
                <small className="field-hint">
                  El máximo de cada producto corresponde al saldo pendiente, no al stock del almacén.
                </small>
              </fieldset>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button type="submit" className="primary" disabled={busy || !purchase || !lines.length}>
                {busy ? "Registrando..." : "Registrar recepción"}
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}
