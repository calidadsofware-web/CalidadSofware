import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { loadAppData, runCommand } from "../api";
import { FullScreenMessage } from "../components/FullScreenMessage";
import { useAuth } from "../hooks/useAuth";
import { AppRoutes } from "./AppRoutes";
import { navigationFor } from "./navigation";
import type { AppCommand, AppData } from "../types";

export function DataCellShell({ initialData }: { initialData: AppData | null }) {
  const { signOut } = useAuth();
  const navigate = useNavigate(),
    location = useLocation();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false),
    [notice, setNotice] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const reload = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      setData(await loadAppData());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar la información.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    if (initialData) return;
    let active = true;
    void loadAppData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "No se pudieron cargar los datos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialData]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  // Al entrar a otro módulo se recargan los datos: otro usuario pudo vender o recibir mercadería.
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    void reload();
  }, [location.pathname, reload]);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement;
    const items = navRef.current?.querySelectorAll<HTMLElement>("a, button");
    items?.[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key === "Tab" && items?.length) {
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [menuOpen]);
  const command: AppCommand = async (action, payload) => {
    const message = await runCommand(action, payload);
    setNotice(message);
    // Refresh errors are displayed separately: an already saved operation must not be repeated.
    await reload();
  };
  async function logout() {
    try {
      await signOut();
      navigate("/");
    } catch {
      setError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    }
  }
  if (loading)
    return <FullScreenMessage title="Abriendo tu espacio de trabajo" text="Cargando información..." />;
  if (!data)
    return (
      <main className="center-screen">
        <h1>No se pudo cargar la información</h1>
        <p role="alert">{error}</p>
        <div className="actions">
          <button type="button" onClick={() => void reload()}>
            Reintentar
          </button>
          <button type="button" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  const navigation = navigationFor(data.user.role);
  const groups = [...new Set(navigation.map((item) => item.group))];
  const current = navigation.find((item) => item.to === location.pathname);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <aside ref={navRef} id="primary-navigation" className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <img src="/media/brand-mark-v1.png" width="32" height="32" alt="" />
          <span>DataCell</span>
        </div>
        <button type="button" className="mobile-close quiet" onClick={() => setMenuOpen(false)}>
          Cerrar menú
        </button>
        <nav aria-label="Navegación principal">
          {groups.map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-group-label">{group}</p>
              {navigation
                .filter((item) => item.group === group)
                .map((item) => (
                  <NavLink key={item.to} to={item.to} end onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </NavLink>
                ))}
            </div>
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
          aria-label="Cerrar menú de navegación"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="main-column">
        <header className="topbar">
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(true)}
          >
            Menú
          </button>
          <div>
            <span>Espacio de trabajo</span>
            <strong>{current?.label ?? "Gestión comercial"}</strong>
          </div>
          <div className="topbar-actions">
            {data.local && <span className="local-badge">Entorno local</span>}
            <button type="button" className="quiet" disabled={refreshing} onClick={() => void reload()}>
              {refreshing ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </header>
        <div className="toast-region" aria-live="polite" aria-atomic="true">
          {notice && (
            <div className="toast">
              {notice}
              <button type="button" aria-label="Cerrar notificación" onClick={() => setNotice("")}>
                Cerrar
              </button>
            </div>
          )}
        </div>
        <main id="main-content" className="content" tabIndex={-1}>
          {error && (
            <div className="form-error refresh-error" role="alert">
              <p>{error} Si acabas de guardar, no repitas la operación: actualiza primero.</p>
              <button type="button" onClick={() => void reload()}>
                Reintentar actualización
              </button>
            </div>
          )}
          <AppRoutes data={data} command={command} />
        </main>
      </div>
    </div>
  );
}
