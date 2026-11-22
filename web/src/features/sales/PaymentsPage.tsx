import { useState } from "react";
import { Link } from "react-router-dom";
import { CollectionTable } from "../../components/CollectionTable";
import { DataTable } from "../../components/DataTable";
import { PageHeader } from "../../components/PageHeader";
import { Modal } from "../../components/Modal";
import { SaleSummary } from "./SaleSummary";
import { money } from "../../utils/format";
import type { AppData, Payment } from "../../types";

/** Resumen del periodo filtrado: productos vendidos, cantidades e importes (HU08-CA01). */
function PeriodSummary({ rows, from, to }: { rows: Payment[]; from: string; to: string }) {
  if (!rows.length) return null; // sin ventas basta el mensaje vacío de la tabla
  const products = new Map<string, { quantity: number; amount: number }>();
  for (const row of rows)
    for (const item of row.items ?? []) {
      const current = products.get(item.name) ?? { quantity: 0, amount: 0 };
      products.set(item.name, {
        quantity: current.quantity + item.quantity,
        amount: current.amount + item.quantity * item.price,
      });
    }
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const units = [...products.values()].reduce((sum, item) => sum + item.quantity, 0);
  const period = from || to ? `${from || "inicio"} a ${to || "hoy"}` : "todas las fechas";
  return (
    <section className="period-summary" aria-label="Resumen del periodo">
      <h2>Resumen del periodo ({period})</h2>
      <dl className="sale-totals">
        <div>
          <dt>Comprobantes</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Unidades vendidas</dt>
          <dd>{units}</dd>
        </div>
        <div>
          <dt>Monto total cobrado</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>
      <DataTable
        caption="Productos vendidos en el periodo"
        rows={[...products.entries()]
          .map(([name, item]) => ({ name, ...item }))
          .sort((a, b) => b.quantity - a.quantity)}
        columns={[
          ["name", "Producto"],
          ["quantity", "Cantidad"],
          ["amount", "Importe sin IGV"],
        ]}
        moneyKeys={["amount"]}
      />
    </section>
  );
}

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
        placeholder="Comprobante, cliente, producto o referencia"
        searchKeys={["products"]}
        filters={[
          ["cashier", "Cajero"],
          ["method", "Método"],
          ["status", "Estado"],
        ]}
        columns={[
          ["document", "Comprobante"],
          ["client", "Cliente"],
          ["date", "Fecha"],
          ["cashier", "Cajero"],
          ["method", "Pago"],
          ["reference", "Referencia"],
          ["status", "Estado"],
          ["total", "Total"],
        ]}
        moneyKeys={["total"]}
        summary={(rows, range) => <PeriodSummary rows={rows as unknown as Payment[]} {...range} />}
        actions={(row) => (
          <button
            type="button"
            className="quiet"
            onClick={() => setSelected(row as unknown as Payment)}
            aria-label={`Ver detalle de ${row.document}`}
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
