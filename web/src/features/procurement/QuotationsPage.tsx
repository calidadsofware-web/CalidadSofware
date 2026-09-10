import { useState, type FormEvent } from "react";
import { DataTable, type DataRow } from "../../components/DataTable";
import { FormActions } from "../../components/FormActions";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import type { AppCommand, AppData, LineInput } from "../../types";

interface QuotationsPageProps {
  data: AppData;
  command: AppCommand;
}

export function QuotationsPage({ data, command }: QuotationsPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [lines, setLines] = useState<LineInput[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function selectSupplier(name: string, checked: boolean) {
    setSuppliers((current) =>
      checked ? [...current, name] : current.filter((supplier) => supplier !== name),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      await command("register-quotation", {
        deadline: form.get("deadline"),
        notes: form.get("notes"),
        supplierNames: suppliers,
        items: lines,
      });
      setFormOpen(false);
      setLines([]);
      setSuppliers([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la cotización.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        description="Solicita propuestas comparables a uno o más proveedores."
        action={
          <button
            className="primary"
            type="button"
            aria-expanded={formOpen}
            aria-controls="quotation-form"
            onClick={() => setFormOpen((current) => !current)}
          >
            {formOpen ? "Cerrar formulario" : "Nueva cotización"}
          </button>
        }
      />
      {formOpen && (
        <form
          id="quotation-form"
          className="panel form-layout"
          onSubmit={submit}
          aria-describedby={error ? "quotation-error" : undefined}
        >
          <fieldset>
            <legend>Condiciones de la cotización</legend>
            <div className="form-grid">
              <label>
                Fecha límite <span className="optional-text">Opcional</span>
                <input type="date" name="deadline" />
              </label>
              <label>
                Observaciones <span className="optional-text">Opcional</span>
                <input name="notes" maxLength={500} />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Proveedores</legend>
            <div className="check-grid">
              {data.suppliers.map((supplier) => (
                <label key={supplier.ruc}>
                  <input
                    type="checkbox"
                    checked={suppliers.includes(supplier.businessName)}
                    onChange={(event) => selectSupplier(supplier.businessName, event.target.checked)}
                  />
                  {supplier.businessName}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Productos para cotizar</legend>
            <ProductLines
              products={data.products}
              value={lines}
              onChange={setLines}
              label="Productos para cotizar"
            />
          </fieldset>
          {error && (
            <p id="quotation-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <FormActions
            busy={busy}
            disabled={!lines.length || !suppliers.length}
            label="Registrar cotización"
          />
        </form>
      )}
      <section className="panel" aria-label="Cotizaciones registradas">
        <DataTable
          caption="Cotizaciones registradas"
          rows={data.quotationRequests as unknown as DataRow[]}
          columns={[
            ["number", "Solicitud"],
            ["supplier", "Proveedores"],
            ["createdAt", "Fecha"],
            ["requestedBy", "Solicitado por"],
            ["productCount", "Productos"],
          ]}
        />
      </section>
    </>
  );
}
