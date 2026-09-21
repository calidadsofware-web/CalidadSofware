import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SectionBoundary } from "../components/SectionBoundary";
import { hasAccess, type AccessPolicy } from "../access";
import { DashboardPage } from "../pages/DashboardPage";
import type { AppCommand, AppData } from "../types";

const ProductsPage = lazy(() =>
  import("../features/catalog/ProductsPage").then((m) => ({ default: m.ProductsPage })),
);
const ClientsPage = lazy(() =>
  import("../features/catalog/ClientsPage").then((m) => ({ default: m.ClientsPage })),
);
const SuppliersPage = lazy(() =>
  import("../features/catalog/SuppliersPage").then((m) => ({ default: m.SuppliersPage })),
);
const UsersPage = lazy(() =>
  import("../features/administration/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const SalePage = lazy(() => import("../features/sales/SalePage").then((m) => ({ default: m.SalePage })));
const PaymentsPage = lazy(() =>
  import("../features/sales/PaymentsPage").then((m) => ({ default: m.PaymentsPage })),
);
const ClaimsPage = lazy(() =>
  import("../features/claims/ClaimsPage").then((m) => ({ default: m.ClaimsPage })),
);
const ReceiptPage = lazy(() =>
  import("../features/warehouse/ReceiptPage").then((m) => ({ default: m.ReceiptPage })),
);
const PurchaseRequestsPage = lazy(() =>
  import("../features/procurement/PurchaseRequestsPage").then((m) => ({ default: m.PurchaseRequestsPage })),
);
const QuotationsPage = lazy(() =>
  import("../features/procurement/QuotationsPage").then((m) => ({ default: m.QuotationsPage })),
);

export function AppRoutes({ data, command }: { data: AppData; command: AppCommand }) {
  const location = useLocation();
  const props = { data, command };
  const protectedPage = (policy: AccessPolicy, page: ReactNode) =>
    hasAccess(data.user.role, policy) ? page : <Navigate to="/" replace />;
  return (
    <SectionBoundary key={location.pathname}>
      <Suspense
        fallback={
          <section className="panel" aria-busy="true" role="status">
            Cargando sección...
          </section>
        }
      >
        <Routes>
          <Route path="/" element={<DashboardPage data={data} />} />
          <Route path="/productos" element={<ProductsPage {...props} />} />
          <Route path="/clientes" element={<ClientsPage {...props} />} />
          <Route path="/proveedores" element={protectedPage("procurement", <SuppliersPage {...props} />)} />
          <Route path="/usuarios" element={protectedPage("administration", <UsersPage {...props} />)} />
          <Route path="/ventas/nueva" element={protectedPage("sales", <SalePage {...props} />)} />
          <Route path="/pagos" element={protectedPage("sales", <PaymentsPage data={data} />)} />
          <Route path="/reclamos" element={protectedPage("sales", <ClaimsPage {...props} />)} />
          <Route path="/recepciones/nueva" element={protectedPage("warehouse", <ReceiptPage {...props} />)} />
          <Route
            path="/solicitudes"
            element={protectedPage("procurement", <PurchaseRequestsPage {...props} />)}
          />
          <Route path="/cotizaciones" element={protectedPage("quotations", <QuotationsPage {...props} />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SectionBoundary>
  );
}
