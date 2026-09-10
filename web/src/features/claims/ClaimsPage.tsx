import { useState, type FormEvent } from "react";
import { DataTable, type DataRow } from "../../components/DataTable";
import { FormActions } from "../../components/FormActions";
import { PageHeader } from "../../components/PageHeader";
import type { AppCommand, AppData } from "../../types";

interface ClaimsPageProps {
  data: AppData;
  command: AppCommand;
}

export function ClaimsPage({ data, command }: ClaimsPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      await command("register-claim", Object.fromEntries(form));
      setFormOpen(false);
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar el reclamo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Reclamos"
        description="Registra incidencias y consulta su estado de atención."
        action={
          <button
            className="primary"
            type="button"
            aria-expanded={formOpen}
            aria-controls="claim-form"
            onClick={() => setFormOpen((current) => !current)}
          >
            {formOpen ? "Cerrar formulario" : "Nuevo reclamo"}
          </button>
        }
      />
      {formOpen && (
        <form
          id="claim-form"
          className="panel form-layout"
          onSubmit={submit}
          aria-describedby={error ? "claim-error" : undefined}
        >
          <fieldset>
            <legend>Datos del reclamo</legend>
            <div className="form-grid">
              <label>
                Cliente
                <input name="clientName" list="claim-clients" required />
              </label>
              <label>
                Comprobante relacionado <span className="optional-text">Opcional</span>
                <input name="receiptNumber" placeholder="B001-00000001" maxLength={20} />
              </label>
              <label>
                Motivo
                <input name="reason" required maxLength={120} />
              </label>
              <label>
                Canal de recepción
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
                Descripción
                <textarea name="description" required maxLength={500} />
              </label>
            </div>
            <datalist id="claim-clients">
              {data.clients.map((client) => (
                <option key={client.document} value={client.fullName} />
              ))}
            </datalist>
          </fieldset>
          {error && (
            <p id="claim-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <FormActions busy={busy} label="Registrar reclamo" />
        </form>
      )}
      <section className="panel" aria-label="Reclamos registrados">
        <DataTable
          caption="Reclamos registrados"
          rows={data.claims as unknown as DataRow[]}
          columns={[
            ["id", "Código"],
            ["client", "Cliente"],
            ["date", "Fecha"],
            ["reason", "Motivo"],
            ["priority", "Prioridad"],
            ["status", "Estado"],
          ]}
        />
      </section>
    </>
  );
}
