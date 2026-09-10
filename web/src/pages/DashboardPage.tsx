import { NavLink } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import type { AppData } from "../types";

export function DashboardPage({ data }: { data: AppData }) {
  const lowStock = data.products.filter((product) => product.stock <= product.minStock).slice(0, 6);

  return (
    <>
      <PageHeader
        title={`Hola, ${data.user.fullName.split(" ")[0]}`}
        description="Este es el estado actual de la operación comercial."
      />
      <section className="metrics" aria-label="Indicadores principales">
        {data.metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.hint}</small>
          </article>
        ))}
      </section>
      <section className="panel" aria-labelledby="inventory-attention-title">
        <div className="panel-heading">
          <div>
            <h2 id="inventory-attention-title">Atención de inventario</h2>
            <p>Productos que alcanzaron el stock mínimo.</p>
          </div>
          <NavLink className="text-link" to="/productos">
            Ver inventario
          </NavLink>
        </div>
        {lowStock.length ? (
          <div className="stock-grid">
            {lowStock.map((product) => (
              <article key={product.code}>
                <strong>{product.name}</strong>
                <span>
                  {product.code} · {product.brand}
                </span>
                <b>{product.stock} disponibles</b>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState text="No hay productos con stock bajo." />
        )}
      </section>
    </>
  );
}
