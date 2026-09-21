import { useRef, useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import type { AppCommand, Client } from "../../types";
import { isActive } from "../../utils/format";

export function ClientEditor({
  client,
  command,
  onClose,
  onSaved,
}: {
  client?: Client;
  command: AppCommand;
  onClose: () => void;
  onSaved?: (document: string) => void;
}) {
  const [type, setType] = useState(
    client?.document?.length === 11
      ? "RUC"
      : client?.document?.length === 8
        ? "DNI"
        : client?.document
          ? "OTRO"
          : "DNI",
  );
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await command("save-client", { ...fields, id: client?.id, documentType: type });
      onSaved?.(String(fields.document ?? ""));
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el cliente.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title={client ? "Editar cliente" : "Nuevo cliente"} onClose={onClose} busy={busy} warnOnClose>
      <form onSubmit={submit} className="form-layout">
        <fieldset disabled={busy}>
          <legend>Identificación</legend>
          <div className="form-grid">
            <label>
              Tipo de documento
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="OTRO">CE / Pasaporte</option>
                <option value="SIN_DOCUMENTO">Sin documento</option>
              </select>
            </label>
            <label>
              Número de documento
              <input
                name="document"
                defaultValue={client?.document === "-" ? "" : client?.document}
                required={type !== "SIN_DOCUMENTO"}
                disabled={type === "SIN_DOCUMENTO"}
                inputMode={type === "DNI" || type === "RUC" ? "numeric" : "text"}
                pattern={type === "DNI" ? "[0-9]{8}" : type === "RUC" ? "[0-9]{11}" : "[A-Za-z0-9\\-]{4,20}"}
                maxLength={type === "DNI" ? 8 : type === "RUC" ? 11 : 20}
                placeholder={
                  type === "DNI" ? "8 dígitos" : type === "RUC" ? "11 dígitos" : "Documento de identidad"
                }
              />
            </label>
            <label>
              {type === "RUC" ? "Razón social" : "Nombres"}
              <input
                name="firstName"
                required
                maxLength={80}
                defaultValue={client?.firstName ?? client?.fullName}
                autoComplete="given-name"
              />
            </label>
            <label>
              {type === "RUC" ? "Complemento de razón social (opcional)" : "Apellidos"}
              <input
                name="lastName"
                required={type !== "RUC"}
                maxLength={80}
                defaultValue={client?.lastName}
                autoComplete="family-name"
              />
            </label>
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Contacto</legend>
          <div className="form-grid">
            <label>
              Teléfono (opcional)
              <input
                type="tel"
                name="phone"
                maxLength={20}
                defaultValue={client?.phone === "-" ? "" : client?.phone}
                placeholder="Ej. 987 654 321"
                autoComplete="tel"
                pattern={"\\+?[0-9 \\(\\)\\-]{7,20}"}
              />
            </label>
            <label>
              Correo electrónico (opcional)
              <input
                type="email"
                name="email"
                maxLength={120}
                defaultValue={client?.email === "-" ? "" : client?.email}
                autoComplete="email"
                placeholder="cliente@ejemplo.com"
              />
            </label>
            <label className="span-2">
              Dirección{type !== "RUC" && " (opcional)"}
              <input
                name="address"
                maxLength={150}
                required={type === "RUC"}
                defaultValue={client?.address}
                autoComplete="street-address"
                placeholder="Av. / Jr., número, distrito y ciudad"
              />
            </label>
            {client && (
              <label>
                Estado
                <select name="status" defaultValue={isActive(client.status) ? "ACTIVO" : "INACTIVO"}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
                <small className="field-hint">Inactivar conserva su historial y evita nuevas ventas.</small>
              </label>
            )}
          </div>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
