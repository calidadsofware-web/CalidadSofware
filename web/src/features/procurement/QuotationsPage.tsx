import { useState, type FormEvent } from "react";
import { CollectionTable } from "../../components/CollectionTable";
import { DataTable } from "../../components/DataTable";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import { Modal } from "../../components/Modal";
import { isActive, normalized, today } from "../../utils/format";
import type { AppCommand, AppData, LineInput, Quotation } from "../../types";

export function QuotationsPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState<Quotation | null>(null);
  const [lines, setLines] = useState<LineInput[]>([]),
    [suppliers, setSuppliers] = useState<string[]>([]);
  const [search, setSearch] = useState(""),
    [supplierPage, setSupplierPage] = useState(1);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const matches = data.suppliers.filter(
    (item) =>
      isActive(item.status) && normalized(`${item.businessName} ${item.ruc}`).includes(normalized(search)),
  );
  const pages = Math.max(1, Math.ceil(matches.length / 6)),
    page = Math.min(pages, supplierPage);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await command("register-quotation", {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        supplierIds: suppliers,
        items: lines,
      });
      setOpen(false);
      setLines([]);
      setSuppliers([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la solicitud.");
    } finally {
      setBusy(false);
    }
  }
  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    try {
      await command("cancel-quotation", {
        id: selected.id,
        ...Object.fromEntries(new FormData(event.currentTarget)),
      });
      setSelected(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cancelar la solicitud.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Cotizaciones"
        description="Prepara solicitudes de precios para tus proveedores."
        action={
          <button
            type="button"
            className="primary"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            Nueva solicitud de cotización
          </button>
        }
      />
      <CollectionTable
        title="Solicitudes de cotización"
        rows={data.quotationRequests}
        dateField="createdAt"
        filters={[["status", "Estado"]]}
        placeholder="Solicitud, proveedor o responsable"
        columns={[
          ["number", "Solicitud"],
          ["supplier", "Proveedores"],
          ["createdAt", "Creación"],
          ["deadline", "Fecha límite"],
          ["status", "Estado"],
          ["requestedBy", "Responsable"],
        ]}
        actions={(row) => (
          <button
            type="button"
            className="quiet"
            onClick={() => {
              setSelected(row as unknown as Quotation);
              setError("");
            }}
            aria-label={`Ver detalle de ${row.number}`}
          >
            Ver detalle
          </button>
        )}
      />
      {open && (
        <Modal
          title="Solicitud de cotización"
          onClose={() => {
            setOpen(false);
            setLines([]);
            setSuppliers([]);
          }}
          busy={busy}
          warnOnClose
          hasChanges={lines.length > 0 || suppliers.length > 0}
        >
          <form onSubmit={submit} className="form-layout">
            <fieldset disabled={busy}>
              <legend>Condiciones requeridas</legend>
              <label>
                Fecha límite de respuesta
                <input type="date" name="deadline" min={today()} required />
              </label>
              <label>
                Condiciones y observaciones
                <textarea
                  name="notes"
                  required
                  minLength={10}
                  maxLength={500}
                  placeholder="Lugar de entrega, garantía, plazo, forma de pago y especificaciones que deben incluir las propuestas."
                />
              </label>
            </fieldset>
            <fieldset disabled={busy}>
              <legend>Proveedores destinatarios</legend>
              <label>
                Buscar proveedor
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSupplierPage(1);
                  }}
                  placeholder="Razón social o RUC"
                />
              </label>
              <div className="check-grid">
                {matches.slice((page - 1) * 6, page * 6).map((item) => (
                  <label key={item.ruc}>
                    <input
                      type="checkbox"
                      checked={suppliers.includes(String(item.id))}
                      onChange={(event) =>
                        setSuppliers((current) =>
                          event.target.checked
                            ? [...current, String(item.id)]
                            : current.filter((name) => name !== String(item.id)),
                        )
                      }
                    />
                    {item.businessName} · {item.ruc}
                  </label>
                ))}
              </div>
              <div className="picker-pagination">
                <small>{suppliers.length} seleccionados</small>
                <div className="actions">
                  <button type="button" disabled={page === 1} onClick={() => setSupplierPage(page - 1)}>
                    Anteriores
                  </button>
                  <span>
                    {page} / {pages}
                  </span>
                  <button type="button" disabled={page === pages} onClick={() => setSupplierPage(page + 1)}>
                    Más proveedores
                  </button>
                </div>
              </div>
              {suppliers.length > 0 && (
                <p className="field-hint">
                  Seleccionados:{" "}
                  {data.suppliers
                    .filter((item) => suppliers.includes(String(item.id)))
                    .map((item) => item.businessName)
                    .join(", ")}
                </p>
              )}
            </fieldset>
            <fieldset disabled={busy}>
              <legend>Productos solicitados</legend>
              <ProductLines
                products={data.products}
                value={lines}
                onChange={setLines}
                label="Productos para cotizar"
              />
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <p className="field-hint">
              La solicitud se guarda para seguimiento interno. Coordina el envío con los proveedores; no se
              envían correos desde esta pantalla.
            </p>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={busy || !lines.length || !suppliers.length}>
                {busy ? "Guardando..." : "Guardar solicitud"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {selected && (
        <Modal title={selected.number} onClose={() => setSelected(null)} busy={busy} warnOnClose>
          <div className="detail-grid">
            <div>
              <small>Proveedores</small>
              <strong>{selected.supplier}</strong>
            </div>
            <div>
              <small>Estado</small>
              <strong>{selected.status}</strong>
            </div>
            <div>
              <small>Fecha límite</small>
              <strong>{selected.deadline || "No indicada"}</strong>
            </div>
            <div>
              <small>Responsable</small>
              <strong>{selected.requestedBy}</strong>
            </div>
          </div>
          <DataTable
            caption="Productos de la cotización"
            rows={(selected.items ?? []).map((item) => ({
              ...item,
              name: data.products.find((product) => product.code === item.code)?.name ?? item.code,
            }))}
            columns={[
              ["code", "SKU"],
              ["name", "Producto"],
              ["quantity", "Cantidad"],
            ]}
          />
          <p className="detail-note">{selected.notes}</p>
          {selected.status === "Pendiente" && (
            <form className="form-layout" onSubmit={cancel}>
              <label>
                Motivo de cancelación
                <textarea
                  name="reason"
                  required
                  minLength={5}
                  maxLength={250}
                  placeholder="Completa solo si deseas cancelar esta solicitud."
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="danger-button" disabled={busy}>
                Cancelar solicitud
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
