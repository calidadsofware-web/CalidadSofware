import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { hasAccess } from "../access";
import { loadAppData, runCommand } from "../api";
import { FullScreenMessage } from "../components/FullScreenMessage";
import { ClaimsPage } from "../features/claims/ClaimsPage";
import { PurchaseRequestsPage } from "../features/procurement/PurchaseRequestsPage";
import { QuotationsPage } from "../features/procurement/QuotationsPage";
import { SalePage } from "../features/sales/SalePage";
import { ReceiptPage } from "../features/warehouse/ReceiptPage";
import { useAuth } from "../hooks/useAuth";
import { DashboardPage } from "../pages/DashboardPage";
import { SearchPage } from "../pages/SearchPage";
import type { AppCommand, AppData } from "../types";

interface ShellState {
  data: AppData | null;
  loading: boolean;
  error: string;
}

interface NavigationItem {
  to: string;
  label: string;
  icon: string;
  show: boolean;
}

function ProtectedRoute({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  return allowed ? children : <Navigate to="/" replace />;
}

export function DataCellShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<ShellState>({ data: null, loading: true, error: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: !current.data, error: "" }));

    try {
      setState({ data: await loadAppData(), loading: false, error: "" });
    } catch (caught) {
      setState((current) => ({
        ...current,
        loading: false,
        error: caught instanceof Error ? caught.message : "No se pudieron cargar los datos.",
      }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  if (state.loading) {
    return <FullScreenMessage title="Cargando información" text="Consultando la base de datos..." />;
  }

  if (!state.data) {
    return (
      <main className="center-screen">
        <h1>No pudimos abrir DataCell</h1>
        <p role="alert">{state.error}</p>
        <div className="actions">
          <button type="button" onClick={() => void reload()}>
            Reintentar
          </button>
          <button className="secondary" type="button" onClick={() => void signOut()}>
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  const { data } = state;
  const navigation: NavigationItem[] = [
    { to: "/", label: "Resumen", icon: "⌂", show: true },
    { to: "/productos", label: "Productos", icon: "▦", show: true },
    { to: "/clientes", label: "Clientes", icon: "◉", show: true },
    { to: "/ventas/nueva", label: "Nueva venta", icon: "▤", show: hasAccess(data.user.role, "sales") },
    { to: "/pagos", label: "Pagos", icon: "S/", show: hasAccess(data.user.role, "sales") },
    { to: "/reclamos", label: "Reclamos", icon: "!", show: hasAccess(data.user.role, "sales") },
    {
      to: "/recepciones/nueva",
      label: "Recepción de compra",
      icon: "↓",
      show: hasAccess(data.user.role, "warehouse"),
    },
    {
      to: "/solicitudes",
      label: "Solicitudes de compra",
      icon: "≡",
      show: hasAccess(data.user.role, "procurement"),
    },
    { to: "/proveedores", label: "Proveedores", icon: "◇", show: hasAccess(data.user.role, "procurement") },
    { to: "/cotizaciones", label: "Cotizaciones", icon: "↗", show: hasAccess(data.user.role, "quotations") },
  ];
  const visibleNavigation = navigation.filter((item) => item.show);

  async function logout() {
    await signOut();
    navigate("/");
  }

  const command: AppCommand = async (action, payload) => {
    const message = await runCommand(action, payload);
    setNotice(message);
    await reload();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <aside id="primary-navigation" className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <img src="/datacell-mark.png" alt="" />
          <span>DATACELL</span>
        </div>
        <nav aria-label="Navegación principal">
          {visibleNavigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setMenuOpen(false)}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-profile">
          <strong>{data.user.fullName}</strong>
          <span>{data.user.roleDisplay}</span>
          <button type="button" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="backdrop"
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="main-column">
        <header className="topbar">
          <button
            className="menu-button"
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <div>
            <strong>Gestión comercial</strong>
            <span>Información sincronizada con la base de datos</span>
          </div>
          <span className="role-pill">{data.user.roleDisplay}</span>
        </header>
        <div className="toast-region" aria-live="polite" aria-atomic="true">
          {notice && (
            <div className="toast">
              <span aria-hidden="true">✓</span> {notice}
            </div>
          )}
        </div>
        <main id="main-content" className="content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<DashboardPage data={data} />} />
            <Route
              path="/productos"
              element={
                <SearchPage
                  title="Productos"
                  description="Consulta disponibilidad, precios y alertas de inventario."
                  rows={data.products}
                  columns={[
                    ["code", "Código"],
                    ["name", "Producto"],
                    ["category", "Categoría"],
                    ["brand", "Marca"],
                    ["stock", "Stock"],
                    ["price", "Precio"],
                  ]}
                  moneyKeys={["price"]}
                />
              }
            />
            <Route
              path="/clientes"
              element={
                <SearchPage
                  title="Clientes"
                  description="Consulta el historial resumido y los datos de contacto de clientes activos."
                  rows={data.clients}
                  columns={[
                    ["document", "Documento"],
                    ["fullName", "Cliente"],
                    ["phone", "Teléfono"],
                    ["email", "Correo"],
                    ["lastPurchase", "Última compra"],
                    ["status", "Estado"],
                  ]}
                />
              }
            />
            <Route
              path="/proveedores"
              element={
                <ProtectedRoute allowed={hasAccess(data.user.role, "procurement")}>
                  <SearchPage
                    title="Proveedores"
                    description="Consulta los proveedores habilitados para las compras."
                    rows={data.suppliers}
                    columns={[
                      ["ruc", "RUC"],
                      ["businessName", "Razón social"],
                      ["contact", "Contacto"],
                      ["phone", "Teléfono"],
                      ["email", "Correo"],
                      ["status", "Estado"],
                    ]}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pagos"
              element={
                <ProtectedRoute allowed={hasAccess(data.user.role, "sales")}>
                  <SearchPage
                    title="Pagos"
                    description="Consulta los comprobantes y pagos registrados en ventas."
                    rows={data.payments}
                    columns={[
                      ["document", "Comprobante"],
                      ["client", "Cliente"],
                      ["date", "Fecha"],
                      ["method", "Método"],
                      ["status", "Estado"],
                      ["total", "Total"],
                    ]}
                    moneyKeys={["total"]}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas/nueva"
              element={
                <ProtectedRoute allowed={hasAccess(data.user.role, "sales")}>
                  <SalePage data={data} command={command} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recepciones/nueva"
              element={
                <ProtectedRoute allowed={hasAccess(data.user.role, "warehouse")}>
                  <ReceiptPage data={data} command={command} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/solicitudes"
              element={
                <ProtectedRoute allowed={hasAccess(data.user.role, "procurement")}>
                  <PurchaseRequestsPage data={data} command={command} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones"
              element={
                <ProtectedRoute allowed={hasAccess(data.user.role, "quotations")}>
                  <QuotationsPage data={data} command={command} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reclamos"
              element={
                <ProtectedRoute allowed={hasAccess(data.user.role, "sales")}>
                  <ClaimsPage data={data} command={command} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
