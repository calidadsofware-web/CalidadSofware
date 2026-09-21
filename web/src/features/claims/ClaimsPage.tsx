import { useState, type FormEvent } from "react";
import { CollectionTable } from "../../components/CollectionTable";
import { PageHeader } from "../../components/PageHeader";
import { SearchSelect } from "../../components/SearchSelect";
import { Modal } from "../../components/Modal";
import { isActive } from "../../utils/format";
import type { AppCommand, AppData, Claim } from "../../types";
const nextStatus: Record<string, { value: string; label: string }> = {
  Registrado: { value: "EN_REVISION", label: "Pasar a revisión" },
  "En Revision": { value: "ATENDIDO", label: "Marcar como atendido" },
  Atendido: { value: "CERRADO", label: "Cerrar reclamo" },
};

export function ClaimsPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState<Claim | null>(null);
  const [clientId, setClientId] = useState(""),
    [receipt, setReceipt] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!clientId) {
      setError("Selecciona el cliente del reclamo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await command("register-claim", {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        clientId: Number(clientId),
        receiptNumber: receipt,
      });
      setOpen(false);
      setClientId("");
      setReceipt("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar el reclamo.");
    } finally {
      setBusy(false);
    }
  }
  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !selected || !nextStatus[selected.status]) return;
    setBusy(true);
    setError("");
    try {
      await command("update-claim", {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        id: selected.id,
        status: nextStatus[selected.status].value,
      });
      setSelected(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar el reclamo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Reclamos y atención"
        description="Registra incidencias y documenta su solución hasta el cierre."
        action={
          <button
            type="button"
            className="primary"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            Nuevo reclamo
          </button>
        }
      />
      <CollectionTable
        title="Bandeja de reclamos"
        rows={data.claims}
        dateField="date"
        filters={[
          ["status", "Estado"],
          ["priority", "Prioridad"],
        ]}
        placeholder="Cliente, motivo o número del caso"
        columns={[
          ["id", "Caso"],
          ["client", "Cliente"],
          ["date", "Fecha"],
          ["reason", "Motivo"],
          ["priority", "Prioridad"],
          ["status", "Estado"],
        ]}
        actions={(row) => (
          <button
            type="button"
            className="quiet"
            onClick={() => {
              setSelected(row as unknown as Claim);
              setError("");
            }}
            aria-label={`Atender reclamo ${row.id}`}
          >
            Ver / atender
          </button>
        )}
      />
      {open && (
        <Modal
          title="Nuevo reclamo"
          onClose={() => {
            setOpen(false);
            setClientId("");
            setReceipt("");
          }}
          busy={busy}
          warnOnClose
          hasChanges={Boolean(clientId || receipt)}
        >
          <form className="form-layout" onSubmit={submit}>
            <fieldset disabled={busy}>
              <legend>Cliente y venta relacionada</legend>
              <SearchSelect
                label="Cliente"
                required
                value={clientId}
                onChange={(value) => {
                  setClientId(value);
                  setReceipt("");
                }}
                options={data.clients
                  .filter((client) => isActive(client.status))
                  .map((client) => ({
                    value: String(client.id),
                    label: client.fullName,
                    detail: client.document,
                  }))}
                placeholder="Nombre o documento del cliente"
              />
              <SearchSelect
                label="Comprobante relacionado (opcional)"
                value={receipt}
                onChange={setReceipt}
                options={data.payments
                  .filter((payment) => String(payment.clientId) === clientId)
                  .map((payment) => ({
                    value: payment.document,
                    label: payment.document,
                    detail: payment.date,
                  }))}
                placeholder="Selecciona primero un cliente"
              />
            </fieldset>
            <fieldset disabled={busy}>
              <legend>Detalle de la incidencia</legend>
              <div className="form-grid">
                <label>
                  Motivo
                  <select name="reason" required>
                    <option value="">Selecciona un motivo</option>
                    <option>Producto defectuoso</option>
                    <option>Incompatibilidad del producto</option>
                    <option>Diferencia en el cobro</option>
                    <option>Problema con la atención</option>
                    <option>Garantía o devolución</option>
                    <option>Otro</option>
                  </select>
                </label>
                <label>
                  Canal
                  <select name="channel">
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="TELEFONO">Teléfono</option>
                    <option value="CORREO">Correo electrónico</option>
                  </select>
                </label>
                <label>
                  Prioridad
                  <select name="priority">
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </label>
                <label className="span-2">
                  Descripción y solución solicitada
                  <textarea
                    name="description"
                    required
                    minLength={10}
                    maxLength={500}
                    placeholder="Qué ocurrió, producto afectado y qué solución solicita el cliente."
                  />
                </label>
              </div>
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button type="submit" className="primary" disabled={busy || !clientId}>
                {busy ? "Guardando..." : "Registrar reclamo"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {selected && (
        <Modal
          title={`Reclamo #${selected.id}`}
          onClose={() => setSelected(null)}
          busy={busy}
          warnOnClose={Boolean(nextStatus[selected.status])}
        >
          <div className="detail-grid">
            <div>
              <small>Cliente</small>
              <strong>{selected.client}</strong>
            </div>
            <div>
              <small>Comprobante</small>
              <strong>{selected.receiptNumber || "No vinculado"}</strong>
            </div>
            <div>
              <small>Estado</small>
              <strong>{selected.status}</strong>
            </div>
            <div>
              <small>Motivo</small>
              <strong>{selected.reason}</strong>
            </div>
          </div>
          <p className="detail-note">{selected.description}</p>
          {selected.resolution && (
            <div className="permission-note">
              <strong>Último seguimiento</strong>
              <p>{selected.resolution}</p>
            </div>
          )}
          {nextStatus[selected.status] && (
            <form className="form-layout" onSubmit={advance}>
              <label>
                Seguimiento o solución
                <textarea
                  name="resolution"
                  required
                  minLength={10}
                  maxLength={250}
                  placeholder="Describe la revisión, acción realizada o acuerdo de cierre."
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Guardando..." : nextStatus[selected.status].label}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
