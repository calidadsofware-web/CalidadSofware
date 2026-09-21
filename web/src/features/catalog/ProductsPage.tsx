import { useState, type FormEvent } from "react";
import { hasAccess } from "../../access";
import { CollectionTable } from "../../components/CollectionTable";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import type { AppCommand, AppData, Product } from "../../types";
import { isActive } from "../../utils/format";
import { ProductEditor } from "./ProductEditor";

export function ProductsPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [editing, setEditing] = useState<Product | "new" | null>(null),
    [adjusting, setAdjusting] = useState<Product | null>(null);
  const [tab, setTab] = useState("catalog"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const allowed = hasAccess(data.user.role, "catalog");
  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !adjusting) return;
    setBusy(true);
    setError("");
    try {
      await command("adjust-stock", {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        code: adjusting.code,
        expectedStock: adjusting.stock,
      });
      setAdjusting(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo ajustar el stock.");
    } finally {
      setBusy(false);
    }
  }
  const rows = data.products.map((product) => ({
    ...product,
    status: product.status ?? "Activo",
    availability: !isActive(product.status)
      ? "Inactivo"
      : product.stock === 0
        ? "Agotado"
        : product.stock <= product.minStock
          ? "Stock bajo"
          : "Disponible",
  }));
  return (
    <>
      <PageHeader
        title="Productos e inventario"
        description="Catálogo, precios y disponibilidad por producto."
        action={
          allowed && (
            <button className="primary" type="button" onClick={() => setEditing("new")}>
              Nuevo producto
            </button>
          )
        }
      />
      {allowed && (
        <div className="segmented" aria-label="Vista del inventario">
          <button type="button" aria-pressed={tab === "catalog"} onClick={() => setTab("catalog")}>
            Catálogo
          </button>
          <button type="button" aria-pressed={tab === "movements"} onClick={() => setTab("movements")}>
            Movimientos de stock
          </button>
        </div>
      )}
      {tab === "catalog" ? (
        <CollectionTable
          title="Catálogo de productos"
          rows={rows}
          placeholder="Nombre, SKU, marca o código de barras"
          searchKeys={["barcode"]}
          filters={[
            ["category", "Categoría"],
            ["brand", "Marca"],
            ["availability", "Disponibilidad"],
          ]}
          moneyKeys={["price"]}
          columns={[
            ["code", "SKU"],
            ["name", "Producto"],
            ["category", "Categoría"],
            ["brand", "Marca"],
            ["stock", "Stock"],
            ["price", "Precio sin IGV"],
            ["availability", "Disponibilidad"],
          ]}
          actions={
            allowed
              ? (row) => (
                  <div className="row-actions">
                    <button
                      type="button"
                      className="quiet"
                      onClick={() => setEditing(row as unknown as Product)}
                      aria-label={`Editar ${row.name}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      disabled={!isActive(String(row.status))}
                      onClick={() => {
                        setAdjusting(row as unknown as Product);
                        setError("");
                      }}
                      aria-label={`Ajustar stock de ${row.name}`}
                    >
                      Ajustar
                    </button>
                  </div>
                )
              : undefined
          }
        />
      ) : (
        <CollectionTable
          title="Movimientos de inventario"
          rows={data.movements ?? []}
          dateField="date"
          filters={[["type", "Movimiento"]]}
          columns={[
            ["date", "Fecha"],
            ["code", "SKU"],
            ["product", "Producto"],
            ["type", "Movimiento"],
            ["quantity", "Cantidad"],
            ["before", "Anterior"],
            ["after", "Actual"],
            ["notes", "Motivo"],
            ["responsible", "Responsable"],
          ]}
        />
      )}
      {editing && (
        <ProductEditor
          data={data}
          product={editing === "new" ? undefined : editing}
          command={command}
          onClose={() => setEditing(null)}
        />
      )}
      {adjusting && (
        <Modal
          title={`Ajustar stock · ${adjusting.name}`}
          onClose={() => setAdjusting(null)}
          busy={busy}
          warnOnClose
        >
          <form className="form-layout" onSubmit={adjust}>
            <p>
              Stock registrado: <strong>{adjusting.stock} unidades</strong>. Registra el conteo físico y
              explica la diferencia.
            </p>
            <label>
              Stock contado
              <input
                name="stock"
                type="number"
                required
                min="0"
                max="9999999"
                step="1"
                defaultValue={adjusting.stock}
              />
            </label>
            <label>
              Motivo del ajuste
              <textarea
                name="notes"
                required
                minLength={5}
                maxLength={500}
                placeholder="Ej. Diferencia detectada durante el conteo físico, producto dañado..."
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Guardando..." : "Confirmar ajuste"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
