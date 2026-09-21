import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { hasAccess } from "../../access";
import { PageHeader } from "../../components/PageHeader";
import { ProductLines } from "../../components/ProductLines";
import { SearchSelect } from "../../components/SearchSelect";
import { Modal } from "../../components/Modal";
import { ClientEditor } from "../catalog/ClientEditor";
import { ProductEditor } from "../catalog/ProductEditor";
import { isActive, saleTotals } from "../../utils/format";
import { SaleSummary } from "./SaleSummary";
import type { AppCommand, AppData, LineInput } from "../../types";

export function SalePage({ data, command }: { data: AppData; command: AppCommand }) {
  const [lines, setLines] = useState<LineInput[]>([]);
  const [clientId, setClientId] = useState("");
  const [createdDocument, setCreatedDocument] = useState("");
  const [receiptType, setReceiptType] = useState("BOLETA");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [cash, setCash] = useState("");
  const [clientOpen, setClientOpen] = useState(false),
    [productOpen, setProductOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const lock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const selectedClient = data.clients.find((client) =>
    createdDocument ? client.document === createdDocument : String(client.id) === clientId,
  );
  const total = saleTotals(
    lines.reduce(
      (sum, line) =>
        sum + (data.products.find((product) => product.code === line.code)?.price ?? 0) * line.quantity,
      0,
    ),
  );
  const stockLimits = new Map(
    data.products
      .filter((product) => isActive(product.status))
      .map((product) => [product.code, product.stock]),
  );
  const clientOptions = data.clients
    .filter((client) => isActive(client.status))
    .map((client) => ({
      value: String(client.id),
      label: client.fullName,
      detail: `${client.document || "Sin documento"} · ${client.phone === "-" ? "Sin teléfono" : client.phone}`,
    }));
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (!selectedClient?.id) {
      setError("Selecciona un cliente del buscador o registra uno nuevo.");
      return;
    }
    if (!lines.length) {
      setError("Agrega al menos un producto a la venta.");
      return;
    }
    if (receiptType === "FACTURA" && (!/^\d{11}$/.test(selectedClient.document) || !selectedClient.address)) {
      setError(
        "La factura requiere un cliente con RUC de 11 dígitos y dirección fiscal. Actualiza su ficha en Clientes.",
      );
      return;
    }
    if (paymentMethod === "EFECTIVO" && Number(cash) < total.total) {
      setError("El efectivo recibido no cubre el total.");
      return;
    }
    setConfirmation({
      ...Object.fromEntries(new FormData(event.currentTarget)),
      clientId: selectedClient.id,
      receiptType,
      paymentMethod,
      items: lines,
      ...(paymentMethod === "EFECTIVO" ? { cashReceived: Number(cash) } : {}),
    });
  }
  async function confirm() {
    if (lock.current || !confirmation) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await command("register-sale", confirmation);
      setLines([]);
      setClientId("");
      setCreatedDocument("");
      setCash("");
      setConfirmation(null);
      setSaved(true);
      formRef.current?.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar la venta.");
      setConfirmation(null);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Nueva venta"
        description="Selecciona el cliente, agrega productos y confirma el cobro."
        action={
          <Link className="button-link secondary" to="/pagos">
            Historial de ventas
          </Link>
        }
      />
      {saved && (
        <div className="success-notice" role="status">
          Venta registrada. El pago y el inventario están actualizados.{" "}
          <Link to="/pagos">Ver comprobante interno</Link>
        </div>
      )}
      <form ref={formRef} onSubmit={prepare}>
        <fieldset disabled={busy || Boolean(confirmation)} className="sale-workspace">
          <div className="sale-main">
            <section className="panel">
              <div className="panel-heading">
                <h2>1. Cliente</h2>
                <button type="button" className="quiet" onClick={() => setClientOpen(true)}>
                  Nuevo cliente
                </button>
              </div>
              <SearchSelect
                label="Buscar cliente"
                required
                options={clientOptions}
                value={selectedClient ? String(selectedClient.id) : clientId}
                onChange={(value) => {
                  setClientId(value);
                  setCreatedDocument("");
                }}
                placeholder="Nombre, DNI, RUC o teléfono"
              />
              {selectedClient && (
                <div className="client-preview">
                  <span>{selectedClient.document || "Sin documento"}</span>
                  <span>{selectedClient.address || "Sin dirección registrada"}</span>
                </div>
              )}
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>2. Productos</h2>
                {hasAccess(data.user.role, "catalog") && (
                  <button type="button" className="quiet" onClick={() => setProductOpen(true)}>
                    Nuevo producto
                  </button>
                )}
              </div>
              <ProductLines
                products={data.products}
                value={lines}
                onChange={setLines}
                limits={stockLimits}
                label="Productos de la venta"
                priceMode="sale"
              />
            </section>
          </div>
          <aside className="panel checkout-panel" aria-label="Cobro de la venta">
            <h2>3. Cobro</h2>
            <div className="form-layout">
              <label>
                Tipo de comprobante
                <select value={receiptType} onChange={(event) => setReceiptType(event.target.value)}>
                  <option value="BOLETA">Boleta</option>
                  <option value="FACTURA">Factura</option>
                </select>
              </label>
              <SaleSummary
                {...total}
                change={paymentMethod === "EFECTIVO" && cash ? Number(cash) - total.total : undefined}
              />
              <label>
                Método de pago
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    setPaymentMethod(event.target.value);
                    setCash("");
                  }}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="YAPE">Yape</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </label>
              {paymentMethod === "EFECTIVO" ? (
                <div>
                  <label>
                    Efectivo recibido (S/)
                    <input
                      type="number"
                      value={cash}
                      required
                      min={total.total || 0.01}
                      max="9999999"
                      step="0.01"
                      onChange={(event) => setCash(event.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <button className="quiet" type="button" onClick={() => setCash(total.total.toFixed(2))}>
                    Importe exacto
                  </button>
                </div>
              ) : (
                <label>
                  Número de operación
                  <input
                    key={paymentMethod}
                    name="reference"
                    required
                    maxLength={80}
                    placeholder={
                      paymentMethod === "TARJETA"
                        ? "Referencia del voucher, no el número de tarjeta"
                        : "Referencia del pago confirmado"
                    }
                  />
                  <small className="field-hint">
                    Verifica el abono antes de confirmar. No guardes datos de la tarjeta.
                  </small>
                </label>
              )}
              <label>
                Observación (opcional)
                <textarea
                  name="notes"
                  maxLength={250}
                  placeholder="Entrega, garantía o indicaciones de la venta"
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="primary full"
                disabled={!lines.length || !selectedClient || busy}
              >
                Revisar y cobrar
              </button>
              <small className="field-hint">
                Registro comercial interno. No emite comprobantes electrónicos ante SUNAT.
              </small>
            </div>
          </aside>
        </fieldset>
      </form>
      {confirmation && (
        <Modal title="Confirmar venta y cobro" onClose={() => setConfirmation(null)} busy={busy}>
          <p>
            Cliente: <strong>{selectedClient?.fullName}</strong>
          </p>
          <p>Revisa el total antes de registrar la salida de inventario.</p>
          <SaleSummary
            {...total}
            change={paymentMethod === "EFECTIVO" ? Number(cash) - total.total : undefined}
          />
          <div className="form-actions">
            <button type="button" className="primary" disabled={busy} onClick={() => void confirm()}>
              {busy ? "Registrando..." : "Confirmar venta"}
            </button>
          </div>
        </Modal>
      )}
      {clientOpen && (
        <ClientEditor
          command={command}
          onSaved={(document) => {
            if (document) {
              setCreatedDocument(document);
              setClientId("");
            }
          }}
          onClose={() => setClientOpen(false)}
        />
      )}
      {productOpen && <ProductEditor data={data} command={command} onClose={() => setProductOpen(false)} />}
    </>
  );
}
