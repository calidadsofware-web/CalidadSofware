import { useId, useState } from "react";
import type { LineInput, Product } from "../types";
import { isActive, money, normalized } from "../utils/format";
import { EmptyState } from "./EmptyState";

interface ProductLinesProps {
  products: Product[];
  value: LineInput[];
  onChange: (lines: LineInput[]) => void;
  limits?: ReadonlyMap<string, number>;
  label: string;
  priceMode?: "sale" | "cost" | "none";
}
export function ProductLines({
  products,
  value,
  onChange,
  limits,
  label,
  priceMode = "none",
}: ProductLinesProps) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [stockNotice, setStockNotice] = useState("");
  const available = products.filter(
    (product) => isActive(product.status) && (!limits || (limits.get(product.code) ?? 0) > 0),
  );
  const filtered = available.filter(
    (product) =>
      (!category || product.category === category) &&
      normalized(`${product.code} ${product.barcode ?? ""} ${product.name} ${product.brand}`).includes(
        normalized(search.trim()),
      ),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const current = Math.min(page, pages);
  function add(product: Product) {
    const selected = value.find((line) => line.code === product.code);
    if (selected) update(product.code, selected.quantity + 1);
    else onChange([...value, { code: product.code, quantity: 1 }]);
  }
  function update(code: string, amount: number) {
    const limit = limits?.get(code) ?? 10_000;
    const requested = Math.max(1, Math.trunc(amount || 1));
    const quantity = Math.min(limit, requested);
    const name = products.find((item) => item.code === code)?.name ?? code;
    setStockNotice(
      requested > limit
        ? `Stock insuficiente: solo hay ${limit} ${limit === 1 ? "unidad" : "unidades"} de ${name}. Se ajustó la cantidad a ${limit}.`
        : "",
    );
    onChange(value.map((line) => (line.code === code ? { ...line, quantity } : line)));
  }
  return (
    <div className="line-editor" role="group" aria-label={label}>
      <div className="collection-toolbar">
        <label className="search" htmlFor={id}>
          Buscar producto
          <input
            id={id}
            type="search"
            placeholder="Nombre, SKU, marca o código de barras"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Categoría
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las categorías</option>
            {[...new Set(available.map((product) => product.category))].sort().map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-results">
        {filtered.slice((current - 1) * 6, current * 6).map((product) => {
          const selected = value.find((line) => line.code === product.code);
          const limit = limits?.get(product.code);
          return (
            <article className="catalog-product" key={product.code}>
              <div>
                <strong>{product.name}</strong>
                <small>
                  {product.code} · {product.brand}
                </small>
                <small>
                  {limit !== undefined ? `${limit} disponibles` : product.category}
                  {priceMode !== "none"
                    ? ` · ${money(priceMode === "cost" ? (product.cost ?? 0) : product.price)} sin IGV`
                    : ""}
                </small>
              </div>
              <button
                type="button"
                className="add-product"
                disabled={limit !== undefined && (selected?.quantity ?? 0) >= limit}
                onClick={() => add(product)}
                aria-label={`Agregar ${product.name}`}
              >
                Agregar
              </button>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <EmptyState text="No hay productos que coincidan con la búsqueda o el saldo disponible." />
      )}
      <div className="picker-pagination">
        <small>
          {filtered.length} {filtered.length === 1 ? "producto disponible" : "productos disponibles"}
        </small>
        <div className="actions">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>
            Anteriores
          </button>
          <span>
            {current} / {pages}
          </span>
          <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)}>
            Más productos
          </button>
        </div>
      </div>
      <div className="selection-heading">
        <h3>Detalle de productos</h3>
        <span>
          {value.length} {value.length === 1 ? "seleccionado" : "seleccionados"}
        </span>
      </div>
      <p className="field-hint stock-notice" role="status" aria-live="polite">
        {stockNotice}
      </p>
      {!value.length ? (
        <p className="selection-empty">Busca un producto y pulsa Agregar para empezar.</p>
      ) : (
        <div className="selected-lines">
          {value.map((line) => {
            const product = products.find((item) => item.code === line.code);
            const unitPrice = priceMode === "cost" ? (product?.cost ?? 0) : (product?.price ?? 0);
            return (
              <div className="selected-line" key={line.code}>
                <div>
                  <strong>{product?.name ?? line.code}</strong>
                  <small>
                    {line.code}
                    {priceMode !== "none" ? ` · ${money(unitPrice)} por unidad` : ""}
                  </small>
                </div>
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max={limits?.get(line.code) ?? 10_000}
                    inputMode="numeric"
                    value={line.quantity}
                    aria-label={`Cantidad de ${product?.name ?? line.code}`}
                    onChange={(event) => update(line.code, Number(event.target.value))}
                  />
                </label>
                {priceMode !== "none" && (
                  <strong className="line-total">{money(unitPrice * line.quantity)}</strong>
                )}
                <button
                  type="button"
                  className="quiet"
                  onClick={() => onChange(value.filter((item) => item.code !== line.code))}
                  aria-label={`Quitar ${product?.name ?? line.code}`}
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
