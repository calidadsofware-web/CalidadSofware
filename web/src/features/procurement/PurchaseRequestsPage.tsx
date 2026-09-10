import { useState, type FormEvent } from "react";
import { DataTable, type DataRow } from "../../components/DataTable";
import { FormActions } from "../../components/FormActions";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import type { AppCommand, AppData, LineInput } from "../../types";

interface PurchaseRequestsPageProps {
  data: AppData;
  command: AppCommand;
}

export function PurchaseRequestsPage({ data, command }: PurchaseRequestsPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [lines, setLines] = useState<LineInput[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      await command("register-purchase-request", {
        supplierName: form.get("supplierName"),
        priority: form.get("priority"),
        requiredDate: form.get("requiredDate"),
        justification: form.get("justification"),
        items: lines,
      });
      setFormOpen(false);
      setLines([]);
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
        description="Planifica el abastecimiento y consulta el estado de cada solicitud."
        action={
          <button
            className="primary"
            type="button"
            aria-expanded={formOpen}
            aria-controls="purchase-request-form"
            onClick={() => setFormOpen((current) => !current)}
          >
            {formOpen ? "Cerrar formulario" : "Nueva solicitud"}
          </button>
        }
      />
      {formOpen && (
        <form
          id="purchase-request-form"
          className="panel form-layout"
          onSubmit={submit}
          aria-describedby={error ? "purchase-request-error" : undefined}
        >
          <fieldset>
            <legend>Nueva solicitud</legend>
            <div className="form-grid">
              <label>
                Proveedor <span className="optional-text">Opcional</span>
                <select name="supplierName">
                  <option value="">Por definir</option>
                  {data.suppliers.map((supplier) => (
                    <option key={supplier.ruc} value={supplier.businessName}>
                      {supplier.businessName}
                    </option>
                  ))}
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
              <label>
                Fecha requerida <span className="optional-text">Opcional</span>
                <input type="date" name="requiredDate" />
              </label>
              <label>
                Justificación <span className="optional-text">Opcional</span>
                <input name="justification" maxLength={500} />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Productos solicitados</legend>
            <ProductLines
              products={data.products}
              value={lines}
              onChange={setLines}
              label="Productos para solicitar"
            />
          </fieldset>
          {error && (
            <p id="purchase-request-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <FormActions busy={busy} disabled={!lines.length} label="Guardar solicitud" />
        </form>
      )}
      <section className="panel" aria-label="Solicitudes registradas">
        <DataTable
          caption="Solicitudes de compra registradas"
          rows={data.purchaseRequests as unknown as DataRow[]}
          columns={[
            ["number", "Solicitud"],
            ["supplier", "Proveedor"],
            ["createdAt", "Fecha"],
            ["status", "Estado"],
            ["requestedBy", "Solicitado por"],
            ["estimatedTotal", "Total estimado"],
          ]}
          moneyKeys={["estimatedTotal"]}
        />
      </section>
    </>
  );
}
