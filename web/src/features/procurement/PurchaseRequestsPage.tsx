import { useState, type FormEvent } from "react";
import { CollectionTable } from "../../components/CollectionTable";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import { Modal } from "../../components/Modal";
import { SearchSelect } from "../../components/SearchSelect";
import { RequestDetail } from "./RequestDetail";
import { isActive, money, today } from "../../utils/format";
import type { AppCommand, AppData, LineInput, PurchaseRequest } from "../../types";

export function PurchaseRequestsPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [lines, setLines] = useState<LineInput[]>([]),
    [supplierId, setSupplierId] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const estimate = lines.reduce(
    (sum, item) =>
      sum + (data.products.find((product) => product.code === item.code)?.cost ?? 0) * item.quantity,
    0,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await command("register-purchase-request", {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        supplierId,
        items: lines,
      });
      setOpen(false);
      setLines([]);
      setSupplierId("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la solicitud.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Solicitudes de compra"
        description="Planifica la reposición y sigue su aprobación hasta la recepción."
        action={
          <button
            className="primary"
            type="button"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            Nueva solicitud
          </button>
        }
      />
      <CollectionTable
        title="Seguimiento de solicitudes"
        rows={data.purchaseRequests}
        dateField="createdAt"
        filters={[
          ["status", "Estado"],
          ["priority", "Prioridad"],
        ]}
        placeholder="Solicitud o proveedor"
        columns={[
          ["number", "Solicitud"],
          ["supplier", "Proveedor"],
          ["createdAt", "Creación"],
          ["requiredDate", "Fecha requerida"],
          ["priority", "Prioridad"],
          ["status", "Estado"],
          ["estimatedTotal", "Estimado sin IGV"],
        ]}
        moneyKeys={["estimatedTotal"]}
        actions={(row) => (
          <button
            className="quiet"
            type="button"
            onClick={() => setSelected(row as unknown as PurchaseRequest)}
            aria-label={`Revisar ${row.number}`}
          >
            Ver / revisar
          </button>
        )}
      />
      {open && (
        <Modal
          title="Nueva solicitud de compra"
          onClose={() => {
            setOpen(false);
            setLines([]);
            setSupplierId("");
          }}
          busy={busy}
          warnOnClose
          hasChanges={lines.length > 0 || Boolean(supplierId)}
        >
          <form className="form-layout" onSubmit={submit}>
            <fieldset disabled={busy}>
              <legend>Necesidad de abastecimiento</legend>
              <div className="form-grid">
                <label>
                  Prioridad
                  <select name="priority">
                    <option value="MEDIA">Media · reposición habitual</option>
                    <option value="ALTA">Alta · operación comprometida</option>
                    <option value="BAJA">Baja · compra planificada</option>
                  </select>
                </label>
                <label>
                  Fecha requerida
                  <input type="date" name="requiredDate" min={today()} required />
                </label>
              </div>
              <SearchSelect
                label="Proveedor sugerido (opcional)"
                options={data.suppliers
                  .filter((item) => isActive(item.status))
                  .map((item) => ({ value: String(item.id), label: item.businessName, detail: item.ruc }))}
                value={supplierId}
                onChange={setSupplierId}
              />
              <label>
                Justificación
                <textarea
                  name="justification"
                  required
                  minLength={10}
                  maxLength={500}
                  placeholder="Explica la necesidad: reposición por stock mínimo, pedido de un cliente o demanda prevista."
                />
              </label>
            </fieldset>
            <fieldset disabled={busy}>
              <legend>Productos y cantidades</legend>
              <ProductLines
                products={data.products}
                value={lines}
                onChange={setLines}
                label="Productos para solicitar"
                priceMode="cost"
              />
              <p className="estimate-note">
                Estimado de compra sin IGV: <strong>{money(estimate)}</strong>
              </p>
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button type="submit" className="primary" disabled={busy || !lines.length}>
                {busy ? "Guardando..." : "Enviar a aprobación"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {selected && (
        <RequestDetail request={selected} data={data} command={command} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
