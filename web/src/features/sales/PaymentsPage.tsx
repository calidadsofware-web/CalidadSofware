import { useState } from "react";
import { Link } from "react-router-dom";
import { CollectionTable } from "../../components/CollectionTable";
import { DataTable } from "../../components/DataTable";
import { PageHeader } from "../../components/PageHeader";
import { Modal } from "../../components/Modal";
import { SaleSummary } from "./SaleSummary";
import type { AppData, Payment } from "../../types";

export function PaymentsPage({ data }: { data: AppData }) {
  const [selected, setSelected] = useState<Payment | null>(null);
  return (
    <>
      <PageHeader
        title="Ventas y pagos"
        description="Consulta cobros, referencias y detalle de cada venta."
        action={
          <Link to="/ventas/nueva" className="button-link primary">
            Nueva venta
          </Link>
        }
      />
      <CollectionTable
        title="Historial de ventas y pagos"
        rows={data.payments}
        dateField="date"
        placeholder="Comprobante, cliente o referencia"
        filters={[
          ["method", "Método"],
          ["status", "Estado"],
        ]}
        columns={[
          ["document", "Comprobante"],
          ["client", "Cliente"],
          ["date", "Fecha"],
          ["method", "Pago"],
          ["reference", "Referencia"],
          ["status", "Estado"],
          ["total", "Total"],
        ]}
        moneyKeys={["total"]}
        actions={(row) => (
          <button
            type="button"
            className="quiet"
            onClick={() => setSelected(row as unknown as Payment)}
            aria-label={`Ver ${row.document}`}
          >
            Ver detalle
          </button>
        )}
      />
      {selected && (
        <Modal title={`Venta ${selected.document}`} onClose={() => setSelected(null)}>
          <div className="detail-grid">
            <div>
              <small>Cliente</small>
              <strong>{selected.client}</strong>
            </div>
            <div>
              <small>Fecha</small>
              <strong>{selected.date}</strong>
            </div>
            <div>
              <small>Pago</small>
              <strong>
                {selected.method} · {selected.status}
              </strong>
            </div>
            <div>
              <small>Referencia</small>
              <strong>{selected.reference || "Sin referencia"}</strong>
            </div>
          </div>
          <DataTable
            caption="Productos vendidos"
            rows={(selected.items ?? []).map((item) => ({ ...item, amount: item.quantity * item.price }))}
            columns={[
              ["name", "Producto"],
              ["quantity", "Cantidad"],
              ["price", "Precio sin IGV"],
              ["amount", "Importe"],
            ]}
            moneyKeys={["price", "amount"]}
          />
          <SaleSummary
            subtotal={selected.subtotal ?? 0}
            tax={selected.tax ?? 0}
            total={selected.total}
            totalLabel="Total de la venta"
          />
          {selected.notes && <p>{selected.notes}</p>}
          <p className="field-hint">Comprobante de uso interno; no sustituye una emisión electrónica.</p>
        </Modal>
      )}
    </>
  );
}
