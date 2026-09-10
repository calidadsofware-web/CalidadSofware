import type { LineInput, Product } from "../types";
import { EmptyState } from "./EmptyState";

interface ProductLinesProps {
  products: Product[];
  value: LineInput[];
  onChange: (lines: LineInput[]) => void;
  limits?: ReadonlyMap<string, number>;
  label: string;
}

function controlId(prefix: string, code: string): string {
  return `${prefix}-${code.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function ProductLines({ products, value, onChange, limits, label }: ProductLinesProps) {
  const visibleProducts = limits
    ? products.filter((product) => (limits.get(product.code) ?? 0) > 0)
    : products;

  function toggle(product: Product, checked: boolean) {
    onChange(
      checked
        ? [...value, { code: product.code, quantity: 1 }]
        : value.filter((line) => line.code !== product.code),
    );
  }

  function updateQuantity(code: string, amount: number) {
    const limit = limits?.get(code);
    const normalized = Math.max(1, Math.trunc(amount || 1));
    const quantity = limit === undefined ? normalized : Math.min(normalized, limit);
    onChange(value.map((line) => (line.code === code ? { ...line, quantity } : line)));
  }

  if (!visibleProducts.length) {
    return <EmptyState text="No hay productos disponibles para esta operación." />;
  }

  return (
    <div className="product-picker" role="group" aria-label={label}>
      {visibleProducts.map((product) => {
        const selected = value.find((line) => line.code === product.code);
        const limit = limits?.get(product.code);
        const checkboxId = controlId("select-product", product.code);
        const quantityId = controlId("quantity", product.code);
        const descriptionId = controlId("product-description", product.code);

        return (
          <div className={selected ? "product-option selected" : "product-option"} key={product.code}>
            <input
              id={checkboxId}
              className="product-check"
              type="checkbox"
              checked={Boolean(selected)}
              onChange={(event) => toggle(product, event.target.checked)}
            />
            <label className="product-option-copy" htmlFor={checkboxId}>
              <strong>{product.name}</strong>
              <small id={descriptionId}>
                {product.code}
                {limit === undefined ? "" : ` · Máximo: ${limit}`}
              </small>
            </label>
            {selected && (
              <label className="quantity-control" htmlFor={quantityId}>
                <span>Cantidad</span>
                <input
                  id={quantityId}
                  aria-describedby={descriptionId}
                  type="number"
                  min="1"
                  max={limit}
                  inputMode="numeric"
                  value={selected.quantity}
                  onChange={(event) => updateQuantity(product.code, Number(event.target.value))}
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
