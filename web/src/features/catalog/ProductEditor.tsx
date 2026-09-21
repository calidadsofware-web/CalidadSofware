import { useRef, useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import type { AppCommand, AppData, Product } from "../../types";
import { isActive } from "../../utils/format";

export function ProductEditor({
  product,
  data,
  command,
  onClose,
}: {
  product?: Product;
  data: AppData;
  command: AppCommand;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await command("save-product", { ...fields, originalCode: product?.code });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el producto.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title={product ? "Editar producto" : "Nuevo producto"} busy={busy} onClose={onClose} warnOnClose>
      <form onSubmit={submit} className="form-layout">
        <fieldset disabled={busy}>
          <legend>Identificación y catálogo</legend>
          <div className="form-grid">
            <label>
              SKU / Código interno
              <input
                name="code"
                required
                pattern={"[A-Za-z0-9][A-Za-z0-9_\\-]*"}
                maxLength={30}
                defaultValue={product?.code}
                placeholder="Ej. CAB-USB-C-001"
              />
            </label>
            <label>
              Código de barras (opcional)
              <input
                name="barcode"
                maxLength={50}
                defaultValue={product?.barcode}
                placeholder="EAN, UPC o código del fabricante"
              />
            </label>
            <label className="span-2">
              Nombre comercial
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={product?.name}
                placeholder="Ej. Cargador USB-C 25 W Samsung, blanco"
              />
            </label>
            <label>
              Categoría
              <input
                name="category"
                required
                list="product-categories"
                maxLength={80}
                defaultValue={product?.category}
                placeholder="Selecciona o escribe una categoría"
              />
            </label>
            <label>
              Marca
              <input
                name="brand"
                required
                list="product-brands"
                maxLength={80}
                defaultValue={product?.brand}
                placeholder="Selecciona o escribe una marca"
              />
            </label>
            <label className="span-2">
              Descripción y compatibilidad (opcional)
              <textarea
                name="description"
                maxLength={250}
                defaultValue={product?.description}
                placeholder="Modelo, color, conexión, compatibilidad y contenido del empaque."
              />
            </label>
          </div>
          <datalist id="product-categories">
            {(data.categories ?? []).map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <datalist id="product-brands">
            {(data.brands ?? []).map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Precios e inventario</legend>
          <p className="field-hint">
            Importes unitarios en soles, sin IGV. El impuesto se desglosa al vender. Las existencias se
            controlan en unidades.
          </p>
          <div className="form-grid">
            <label>
              Costo de compra (S/)
              <input
                name="cost"
                type="number"
                required
                min="0"
                max="9999999"
                step="0.01"
                defaultValue={product?.cost ?? 0}
              />
            </label>
            <label>
              Precio de venta sin IGV (S/)
              <input
                name="price"
                type="number"
                required
                min="0.01"
                max="9999999"
                step="0.01"
                defaultValue={product?.price}
              />
            </label>
            <label>
              Stock mínimo
              <input
                name="minStock"
                type="number"
                required
                min="0"
                max="9999999"
                step="1"
                defaultValue={product?.minStock ?? 5}
              />
            </label>
            {!product ? (
              <label>
                Stock inicial
                <input
                  name="initialStock"
                  type="number"
                  required
                  min="0"
                  max="9999999"
                  step="1"
                  defaultValue={0}
                />
                <small className="field-hint">Se registra como movimiento de apertura.</small>
              </label>
            ) : (
              <label>
                Estado
                <select name="status" defaultValue={isActive(product.status) ? "ACTIVO" : "INACTIVO"}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
                <small className="field-hint">El stock actual se cambia mediante recepción o ajuste.</small>
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
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
