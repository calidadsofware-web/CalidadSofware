import { Link } from "react-router-dom";
import { hasAccess } from "../access";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import type { AppData } from "../types";
import { isActive } from "../utils/format";

export function DashboardPage({ data }: { data: AppData }) {
  const role = data.user.role;
  const actions = [
    {
      title: "Registrar una venta",
      detail: "Cliente, productos y cobro en un mismo flujo.",
      to: "/ventas/nueva",
      show: hasAccess(role, "sales"),
    },
    {
      title: "Recibir mercadería",
      detail: "Confirma cantidades contra una orden de compra.",
      to: "/recepciones/nueva",
      show: hasAccess(role, "warehouse"),
    },
    {
      title: "Solicitar abastecimiento",
      detail: "Indica qué hace falta y para cuándo lo necesitas.",
      to: "/solicitudes",
      show: hasAccess(role, "procurement"),
    },
    {
      title: "Consultar productos",
      detail: "Busca precios, existencias y disponibilidad.",
      to: "/productos",
      show: true,
    },
    {
      title: "Atender un reclamo",
      detail: "Registra el caso y da seguimiento a su solución.",
      to: "/reclamos",
      show: hasAccess(role, "sales"),
    },
    {
      title: "Gestionar proveedores",
      detail: "Mantén el directorio comercial al día.",
      to: "/proveedores",
      show: hasAccess(role, "quotations"),
    },
    {
      title: "Administrar equipo",
      detail: "Crea usuarios y asigna sus permisos.",
      to: "/usuarios",
      show: hasAccess(role, "administration"),
    },
  ].filter((action) => action.show);
  const tasks = [
    ...data.purchaseRequests
      .filter((item) => item.status === "Pendiente")
      .map((item) => ({
        title: item.number,
        detail: hasAccess(role, "administration")
          ? "Revisar solicitud y decidir su aprobación."
          : "Solicitud pendiente de aprobación.",
        to: "/solicitudes",
      })),
    ...data.claims
      .filter((item) => item.status !== "Cerrado")
      .map((item) => ({
        title: `Reclamo #${item.id} · ${item.client}`,
        detail: `${item.reason} · ${item.status}`,
        to: "/reclamos",
      })),
    ...(hasAccess(role, "warehouse")
      ? data.purchases
          .filter((item) => item.items.some((line) => line.pending > 0))
          .map((item) => ({
            title: item.number,
            detail: `Mercadería pendiente · ${item.supplier}`,
            to: "/recepciones/nueva",
          }))
      : []),
  ].slice(0, 8);
  const lowStock = data.products
    .filter((product) => isActive(product.status) && product.stock <= product.minStock)
    .slice(0, 5);
  return (
    <>
      <PageHeader
        title={`Hola, ${data.user.fullName.split(" ")[0]}`}
        description="Tu espacio para resolver las tareas del día."
      />
      <section className="panel">
        <div className="panel-heading">
          <h2>Acciones frecuentes</h2>
        </div>
        <div className="quick-actions">
          {actions.map((action) => (
            <Link key={action.to} to={action.to}>
              <strong>{action.title}</strong>
              <span>{action.detail}</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="workspace-columns">
        <section className="panel">
          <h2>Pendientes de trabajo</h2>
          {tasks.length ? (
            <ul className="task-list">
              {tasks.map((task, index) => (
                <li key={`${task.title}-${index}`}>
                  <Link to={task.to}>
                    <strong>{task.title}</strong>
                    <span>{task.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="No tienes operaciones pendientes en tus módulos." />
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Revisar existencias</h2>
            <Link className="text-link" to="/productos">
              Ver inventario
            </Link>
          </div>
          {lowStock.length ? (
            <ul className="task-list">
              {lowStock.map((product) => (
                <li key={product.code}>
                  <Link to="/productos">
                    <strong>{product.name}</strong>
                    <span>
                      {product.code} · {product.stock} unidades · Mínimo {product.minStock}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="Los productos activos tienen stock sobre el mínimo." />
          )}
        </section>
      </div>
    </>
  );
}
