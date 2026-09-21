import { money } from "../../utils/format";

export function SaleSummary({
  subtotal,
  tax,
  total,
  change,
  totalLabel = "Total a cobrar",
}: {
  subtotal: number;
  tax: number;
  total: number;
  change?: number;
  totalLabel?: string;
}) {
  return (
    <dl className="sale-totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{money(subtotal)}</dd>
      </div>
      <div>
        <dt>IGV (18%)</dt>
        <dd>{money(tax)}</dd>
      </div>
      <div className="grand-total">
        <dt>{totalLabel}</dt>
        <dd>{money(total)}</dd>
      </div>
      {change !== undefined && (
        <div>
          <dt>Vuelto</dt>
          <dd>{money(Math.max(0, change))}</dd>
        </div>
      )}
    </dl>
  );
}
