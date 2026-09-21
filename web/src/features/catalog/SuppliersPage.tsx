import { useState, type FormEvent } from "react";
import { hasAccess } from "../../access";
import { CollectionTable } from "../../components/CollectionTable";
import { PageHeader } from "../../components/PageHeader";
import { Modal } from "../../components/Modal";
import type { AppCommand, AppData, Supplier } from "../../types";
import { isActive } from "../../utils/format";

export function SuppliersPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [editing, setEditing] = useState<Supplier | "new" | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const supplier = editing === "new" ? undefined : editing;
  const allowed = hasAccess(data.user.role, "quotations");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await command("save-supplier", {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        id: supplier?.id,
      });
      setEditing(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el proveedor.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Proveedores"
        description="Identificación, contacto y disponibilidad para abastecimiento."
        action={
          allowed && (
            <button
              className="primary"
              type="button"
              onClick={() => {
                setEditing("new");
                setError("");
              }}
            >
              Nuevo proveedor
            </button>
          )
        }
      />
      <CollectionTable
        title="Directorio de proveedores"
        rows={data.suppliers}
        placeholder="Razón social, RUC o contacto"
        filters={[["status", "Estado"]]}
        columns={[
          ["businessName", "Razón social"],
          ["ruc", "RUC"],
          ["contact", "Contacto"],
          ["phone", "Teléfono"],
          ["email", "Correo"],
          ["status", "Estado"],
        ]}
        actions={
          allowed
            ? (row) => (
                <button
                  className="quiet"
                  type="button"
                  onClick={() => {
                    setEditing(row as unknown as Supplier);
                    setError("");
                  }}
                  aria-label={`Editar ${row.businessName}`}
                >
                  Editar
                </button>
              )
            : undefined
        }
      />
      {editing && (
        <Modal
          title={supplier ? "Editar proveedor" : "Nuevo proveedor"}
          onClose={() => setEditing(null)}
          busy={busy}
          warnOnClose
        >
          <form className="form-layout" onSubmit={submit}>
            <fieldset disabled={busy}>
              <legend>Información comercial</legend>
              <div className="form-grid">
                <label>
                  RUC
                  <input
                    name="ruc"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    maxLength={11}
                    placeholder="11 dígitos"
                    defaultValue={supplier?.ruc}
                  />
                </label>
                <label>
                  Razón social
                  <input name="businessName" required maxLength={150} defaultValue={supplier?.businessName} />
                </label>
                <label className="span-2">
                  Dirección fiscal
                  <input
                    name="address"
                    required
                    maxLength={150}
                    defaultValue={supplier?.address}
                    placeholder="Calle, número, distrito y ciudad"
                  />
                </label>
                <label>
                  Persona de contacto
                  <input
                    name="contact"
                    required
                    maxLength={100}
                    defaultValue={supplier?.contact}
                    placeholder="Nombre del representante comercial"
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    name="phone"
                    type="tel"
                    required
                    pattern={"\\+?[0-9 \\(\\)\\-]{7,20}"}
                    maxLength={20}
                    defaultValue={supplier?.phone === "-" ? "" : supplier?.phone}
                  />
                </label>
                <label>
                  Correo comercial
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={120}
                    defaultValue={supplier?.email === "-" ? "" : supplier?.email}
                  />
                </label>
                <label>
                  Estado
                  <select name="status" defaultValue={isActive(supplier?.status) ? "ACTIVO" : "INACTIVO"}>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </label>
              </div>
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Guardando..." : "Guardar proveedor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
