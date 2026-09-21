import { useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import { DataTable } from "../../components/DataTable";
import { SearchSelect } from "../../components/SearchSelect";
import { hasAccess } from "../../access";
import { isActive, money } from "../../utils/format";
import type { AppCommand, AppData, PurchaseRequest } from "../../types";

export function RequestDetail({
  request,
  data,
  command,
  onClose,
}: {
  request: PurchaseRequest;
  data: AppData;
  command: AppCommand;
  onClose: () => void;
}) {
  const [decision, setDecision] = useState("APROBADA");
  const [supplierId, setSupplierId] = useState(String(request.supplierId ?? ""));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const allowed = hasAccess(data.user.role, "administration") && request.status === "Pendiente";
  const rows = (request.items ?? []).map((item) => ({
    ...item,
    name: data.products.find((product) => product.code === item.code)?.name ?? item.code,
  }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (decision === "APROBADA" && !supplierId) {
      setError("Selecciona un proveedor activo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await command("review-purchase", {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        id: request.id,
        decision,
        supplierId: Number(supplierId),
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo revisar la solicitud.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={request.number}
      onClose={onClose}
      busy={busy}
      warnOnClose={allowed}
      hasChanges={allowed && supplierId !== String(request.supplierId ?? "")}
    >
      <div className="detail-grid">
        <div>
          <small>Solicitante</small>
          <strong>{request.requestedBy}</strong>
        </div>
        <div>
          <small>Estado</small>
          <strong>{request.status}</strong>
        </div>
        <div>
          <small>Proveedor sugerido</small>
          <strong>{request.supplier}</strong>
        </div>
        <div>
          <small>Fecha requerida</small>
          <strong>{request.requiredDate || "No indicada"}</strong>
        </div>
        <div>
          <small>Estimado sin IGV</small>
          <strong>{money(request.estimatedTotal)}</strong>
        </div>
      </div>
      <DataTable
        caption="Productos solicitados"
        rows={rows}
        columns={[
          ["code", "SKU"],
          ["name", "Producto"],
          ["quantity", "Cantidad"],
        ]}
      />
      <p className="detail-note">{request.notes || "Sin observaciones."}</p>
      {allowed && (
        <form className="form-layout" onSubmit={submit}>
          <fieldset disabled={busy}>
            <legend>Revisión del administrador</legend>
            <label>
              Decisión
              <select value={decision} onChange={(event) => setDecision(event.target.value)}>
                <option value="APROBADA">Aprobar y crear orden de compra</option>
                <option value="RECHAZADA">Rechazar solicitud</option>
              </select>
            </label>
            {decision === "APROBADA" && (
              <SearchSelect
                label="Proveedor de la orden"
                required
                options={data.suppliers
                  .filter((item) => isActive(item.status))
                  .map((item) => ({ value: String(item.id), label: item.businessName, detail: item.ruc }))}
                value={supplierId}
                onChange={setSupplierId}
              />
            )}
            <label>
              Motivo de la decisión
              <textarea
                name="reason"
                required
                minLength={5}
                maxLength={250}
                placeholder="Sustento de la aprobación o motivo del rechazo."
              />
            </label>
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Guardando..." : "Confirmar decisión"}
          </button>
          <small className="field-hint">
            Aprobar crea una orden con los costos actuales. El stock se actualizará al recibir la mercadería.
          </small>
        </form>
      )}
    </Modal>
  );
}
