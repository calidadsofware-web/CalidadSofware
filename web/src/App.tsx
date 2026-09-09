import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { loadAppData, runCommand } from "./api";
import { useAuth } from "./auth";
import type { AppData, AppRole, LineInput, Product } from "./types";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

const ROLE_ACCESS: Record<string, AppRole[]> = {
  sales: ["ADMINISTRADOR", "CAJERO"],
  warehouse: ["ADMINISTRADOR", "ALMACEN"],
  procurement: ["ADMINISTRADOR", "ASISTENTE_COMPRAS", "ALMACEN"],
  quotations: ["ADMINISTRADOR", "ASISTENTE_COMPRAS"],
};

function can(role: AppRole, policy: keyof typeof ROLE_ACCESS): boolean {
  return ROLE_ACCESS[policy].includes(role);
}

export function App() {
  const { identityUser, loading } = useAuth();
  if (loading) return <FullScreenMessage title="Preparando DataCell" text="Validando la sesión segura…" />;
  return identityUser ? <DataCellShell /> : <LoginPage />;
}

function FullScreenMessage({ title, text }: { title: string; text: string }) {
  return <main className="center-screen"><img src="/datacell-mark.png" alt="" /><h1>{title}</h1><p>{text}</p></main>;
}

function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-overlay" />
      <section className="login-card" aria-labelledby="login-title">
        <img className="login-logo" src="/datacell-mark.png" alt="DataCell" />
        <p className="eyebrow">Intranet comercial</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="muted">Ingresa con las credenciales asignadas por el administrador.</p>
        <form onSubmit={submit}>
          <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
          <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary full" disabled={submitting}>{submitting ? "Ingresando…" : "Ingresar"}</button>
        </form>
      </section>
    </main>
  );
}

interface ShellState {
  data: AppData | null;
  loading: boolean;
  error: string;
}

function DataCellShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<ShellState>({ data: null, loading: true, error: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: !current.data, error: "" }));
    try {
      setState({ data: await loadAppData(), loading: false, error: "" });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : "No se pudieron cargar los datos." }));
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (state.loading) return <FullScreenMessage title="Cargando información" text="Consultando la base de datos de Supabase…" />;
  if (!state.data) {
    return <main className="center-screen"><h1>No pudimos abrir DataCell</h1><p>{state.error}</p><div className="actions"><button onClick={() => void reload()}>Reintentar</button><button className="secondary" onClick={() => void signOut()}>Cerrar sesión</button></div></main>;
  }

  const { data } = state;
  const navItems = [
    { to: "/", label: "Resumen", icon: "⌂", show: true },
    { to: "/productos", label: "Productos", icon: "▦", show: true },
    { to: "/clientes", label: "Clientes", icon: "◉", show: true },
    { to: "/ventas/nueva", label: "Generar CDP", icon: "▤", show: can(data.user.role, "sales") },
    { to: "/pagos", label: "Pagos", icon: "S/", show: can(data.user.role, "sales") },
    { to: "/reclamos", label: "Reclamos", icon: "!", show: can(data.user.role, "sales") },
    { to: "/recepciones/nueva", label: "Ingreso de compra", icon: "↓", show: can(data.user.role, "warehouse") },
    { to: "/solicitudes", label: "Solicitudes", icon: "≡", show: can(data.user.role, "procurement") },
    { to: "/proveedores", label: "Proveedores", icon: "◇", show: can(data.user.role, "procurement") },
    { to: "/cotizaciones", label: "Cotizaciones", icon: "↗", show: can(data.user.role, "quotations") },
  ].filter((item) => item.show);

  async function logoutNow() {
    await signOut();
    navigate("/");
  }

  const command = async (action: string, payload: unknown) => {
    const message = await runCommand(action, payload);
    setNotice(message);
    await reload();
  };

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand"><img src="/datacell-mark.png" alt="" /><span>DATACELL</span></div>
        <nav aria-label="Navegación principal">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setMenuOpen(false)}><span>{item.icon}</span>{item.label}</NavLink>)}
        </nav>
        <div className="sidebar-profile"><strong>{data.user.fullName}</strong><span>{data.user.roleDisplay}</span><button onClick={() => void logoutNow()}>Cerrar sesión</button></div>
      </aside>
      {menuOpen && <button className="backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <div className="main-column">
        <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">☰</button><div><strong>Gestión comercial</strong><span>Información sincronizada con Supabase</span></div><span className="role-pill">{data.user.roleDisplay}</span></header>
        {notice && <div className="toast" role="status">✓ {notice}</div>}
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard data={data} />} />
            <Route path="/productos" element={<SearchPage title="Productos" description="Consulta disponibilidad, precios y alertas de inventario." rows={data.products} columns={[['code','Código'],['name','Producto'],['category','Categoría'],['brand','Marca'],['stock','Stock'],['price','Precio']]} moneyKeys={["price"]} />} />
            <Route path="/clientes" element={<SearchPage title="Clientes" description="Historial resumido y datos de contacto de clientes activos." rows={data.clients} columns={[['document','Documento'],['fullName','Cliente'],['phone','Teléfono'],['email','Correo'],['lastPurchase','Última compra'],['status','Estado']]} />} />
            <Route path="/proveedores" element={<Protected allowed={can(data.user.role, "procurement")}><SearchPage title="Proveedores" description="Directorio de proveedores habilitados para compras." rows={data.suppliers} columns={[['ruc','RUC'],['businessName','Razón social'],['contact','Contacto'],['phone','Teléfono'],['email','Correo'],['status','Estado']]} /></Protected>} />
            <Route path="/pagos" element={<Protected allowed={can(data.user.role, "sales")}><SearchPage title="Pagos" description="Comprobantes y pagos registrados en ventas." rows={data.payments} columns={[['document','Comprobante'],['client','Cliente'],['date','Fecha'],['method','Método'],['status','Estado'],['total','Total']]} moneyKeys={["total"]} /></Protected>} />
            <Route path="/ventas/nueva" element={<Protected allowed={can(data.user.role, "sales")}><SaleForm data={data} command={command} /></Protected>} />
            <Route path="/recepciones/nueva" element={<Protected allowed={can(data.user.role, "warehouse")}><ReceiptForm data={data} command={command} /></Protected>} />
            <Route path="/solicitudes" element={<Protected allowed={can(data.user.role, "procurement")}><PurchaseRequests data={data} command={command} /></Protected>} />
            <Route path="/cotizaciones" element={<Protected allowed={can(data.user.role, "quotations")}><Quotations data={data} command={command} /></Protected>} />
            <Route path="/reclamos" element={<Protected allowed={can(data.user.role, "sales")}><Claims data={data} command={command} /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Protected({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  return allowed ? children : <Navigate to="/" replace />;
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">DataCell</p><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Dashboard({ data }: { data: AppData }) {
  const lowStock = data.products.filter((p) => p.stock <= p.minStock).slice(0, 6);
  return <>
    <PageHeader title={`Hola, ${data.user.fullName.split(" ")[0]}`} description="Este es el estado actual de la operación comercial." />
    <section className="metrics">{data.metrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.hint}</small></article>)}</section>
    <section className="panel"><div className="panel-heading"><div><h2>Atención de inventario</h2><p>Productos que alcanzaron el stock mínimo.</p></div><NavLink className="text-link" to="/productos">Ver inventario</NavLink></div>
      {lowStock.length ? <div className="stock-grid">{lowStock.map((p) => <article key={p.code}><strong>{p.name}</strong><span>{p.code} · {p.brand}</span><b>{p.stock} disponibles</b></article>)}</div> : <Empty text="No hay productos con stock bajo." />}
    </section>
  </>;
}

type Row = Record<string, unknown>;
function SearchPage({ title, description, rows, columns, moneyKeys = [] }: { title: string; description: string; rows: object[]; columns: [string,string][]; moneyKeys?: string[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(search.toLowerCase()))), [rows, search]);
  return <>
    <PageHeader title={title} description={description} />
    <section className="panel"><div className="toolbar"><label className="search">Buscar<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar en ${title.toLowerCase()}…`} /></label><span>{filtered.length} resultados</span></div>
      <DataTable rows={filtered as Row[]} columns={columns} moneyKeys={moneyKeys} />
    </section>
  </>;
}

function DataTable({ rows, columns, moneyKeys = [] }: { rows: Row[]; columns: [string,string][]; moneyKeys?: string[] }) {
  if (!rows.length) return <Empty text="No hay información para mostrar." />;
  return <div className="table-wrap"><table><thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? row.code ?? row.number ?? index)}>{columns.map(([key]) => <td key={key}>{moneyKeys.includes(key) ? PEN.format(Number(row[key] ?? 0)) : String(row[key] ?? "-")}</td>)}</tr>)}</tbody></table></div>;
}

function Empty({ text }: { text: string }) { return <div className="empty"><span>○</span><p>{text}</p></div>; }

function ProductLines({ products, value, onChange, available }: { products: Product[]; value: LineInput[]; onChange: (lines: LineInput[]) => void; available?: Map<string, number> }) {
  function toggle(product: Product, checked: boolean) {
    onChange(checked ? [...value, { code: product.code, quantity: 1 }] : value.filter((line) => line.code !== product.code));
  }
  function quantity(code: string, amount: number) {
    onChange(value.map((line) => line.code === code ? { ...line, quantity: Math.max(1, Math.trunc(amount || 1)) } : line));
  }
  const visible = available ? products.filter((p) => (available.get(p.code) ?? 0) > 0) : products;
  return <div className="product-picker">{visible.map((product) => {
    const selected = value.find((line) => line.code === product.code);
    const limit = available?.get(product.code) ?? product.stock;
    return <label className={selected ? "product-option selected" : "product-option"} key={product.code}>
      <input type="checkbox" checked={Boolean(selected)} onChange={(e) => toggle(product, e.target.checked)} />
      <span><strong>{product.name}</strong><small>{product.code} · Disponible: {limit}</small></span>
      {selected && <input aria-label={`Cantidad de ${product.name}`} type="number" min="1" max={Math.max(limit, 1)} value={selected.quantity} onClick={(e) => e.stopPropagation()} onChange={(e) => quantity(product.code, Number(e.target.value))} />}
    </label>;
  })}</div>;
}

type Command = (action: string, payload: unknown) => Promise<void>;
function FormActions({ busy, label }: { busy: boolean; label: string }) { return <div className="form-actions"><button className="primary" disabled={busy}>{busy ? "Guardando…" : label}</button></div>; }

function SaleForm({ data, command }: { data: AppData; command: Command }) {
  const [lines, setLines] = useState<LineInput[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try { await command("register-sale", { receiptType: form.get("receiptType"), clientName: form.get("clientName"), clientDocument: form.get("clientDocument"), paymentMethod: form.get("paymentMethod"), items: lines }); setLines([]); event.currentTarget.reset(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo registrar la venta."); } finally { setBusy(false); }
  }
  return <><PageHeader title="Generar comprobante" description="Registra la venta, el pago y la salida de inventario en una sola operación." /><form className="panel form-layout" onSubmit={submit}>
    <fieldset><legend>Datos del comprobante</legend><div className="form-grid"><label>Tipo<select name="receiptType"><option>BOLETA</option><option>FACTURA</option></select></label><label>Método de pago<select name="paymentMethod"><option>EFECTIVO</option><option>TARJETA</option><option>YAPE</option><option>TRANSFERENCIA</option></select></label><label>Cliente<input name="clientName" list="clients" placeholder="Nombre completo" required /></label><label>Documento<input name="clientDocument" maxLength={20} /></label></div><datalist id="clients">{data.clients.map((c) => <option key={c.document} value={c.fullName} />)}</datalist></fieldset>
    <fieldset><legend>Productos vendidos</legend><ProductLines products={data.products.filter((p) => p.stock > 0)} value={lines} onChange={setLines} /></fieldset>{error && <p className="form-error">{error}</p>}<FormActions busy={busy} label="Generar CDP" />
  </form></>;
}

function ReceiptForm({ data, command }: { data: AppData; command: Command }) {
  const [purchaseNumber, setPurchaseNumber] = useState(""); const [lines, setLines] = useState<LineInput[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const purchase = data.purchases.find((p) => p.number === purchaseNumber);
  const availability = useMemo(() => new Map(purchase?.items.map((item) => [item.code, item.pending]) ?? []), [purchase]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); try { await command("register-receipt", { purchaseNumber, guide: form.get("guide"), entryDate: form.get("entryDate"), notes: form.get("notes"), items: lines }); setLines([]); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo registrar el ingreso."); } finally { setBusy(false); } }
  return <><PageHeader title="Ingreso de compra" description="Confirma los productos recibidos y actualiza el inventario con trazabilidad." /><form className="panel form-layout" onSubmit={submit}><fieldset><legend>Orden y recepción</legend><div className="form-grid"><label>Orden<select required value={purchaseNumber} onChange={(e) => { setPurchaseNumber(e.target.value); setLines([]); }}><option value="">Selecciona una orden</option>{data.purchases.map((p) => <option key={p.number} value={p.number}>{p.number} · {p.supplier}</option>)}</select></label><label>Fecha de ingreso<input type="date" name="entryDate" /></label><label>Guía<input name="guide" maxLength={50} /></label><label>Observación<input name="notes" maxLength={500} /></label></div></fieldset>{purchase && <fieldset><legend>Productos pendientes</legend><ProductLines products={data.products} value={lines} onChange={setLines} available={availability} /></fieldset>}{error && <p className="form-error">{error}</p>}<FormActions busy={busy} label="Registrar ingreso" /></form></>;
}

function PurchaseRequests({ data, command }: { data: AppData; command: Command }) {
  const [open, setOpen] = useState(false); const [lines, setLines] = useState<LineInput[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); try { await command("register-purchase-request", { supplierName: form.get("supplierName"), priority: form.get("priority"), requiredDate: form.get("requiredDate"), justification: form.get("justification"), items: lines }); setOpen(false); setLines([]); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo crear la solicitud."); } finally { setBusy(false); } }
  return <><PageHeader title="Solicitudes de compra" description="Planifica el abastecimiento y consulta su seguimiento." action={<button className="primary" onClick={() => setOpen(!open)}>{open ? "Cerrar" : "Nueva solicitud"}</button>} />{open && <form className="panel form-layout" onSubmit={submit}><fieldset><legend>Nueva solicitud</legend><div className="form-grid"><label>Proveedor<select name="supplierName"><option value="">Por definir</option>{data.suppliers.map((s) => <option key={s.ruc}>{s.businessName}</option>)}</select></label><label>Prioridad<select name="priority"><option>MEDIA</option><option>ALTA</option><option>BAJA</option></select></label><label>Fecha requerida<input type="date" name="requiredDate" /></label><label>Justificación<input name="justification" maxLength={500} /></label></div></fieldset><fieldset><legend>Productos solicitados</legend><ProductLines products={data.products} value={lines} onChange={setLines} /></fieldset>{error && <p className="form-error">{error}</p>}<FormActions busy={busy} label="Guardar solicitud" /></form>}<section className="panel"><DataTable rows={data.purchaseRequests as unknown as Row[]} columns={[['number','Solicitud'],['supplier','Proveedor'],['createdAt','Fecha'],['status','Estado'],['requestedBy','Solicitado por'],['estimatedTotal','Estimado']]} moneyKeys={["estimatedTotal"]} /></section></>;
}

function Quotations({ data, command }: { data: AppData; command: Command }) {
  const [open, setOpen] = useState(false); const [lines, setLines] = useState<LineInput[]>([]); const [suppliers, setSuppliers] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); try { await command("register-quotation", { deadline: form.get("deadline"), notes: form.get("notes"), supplierNames: suppliers, items: lines }); setOpen(false); setLines([]); setSuppliers([]); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo crear la cotización."); } finally { setBusy(false); } }
  return <><PageHeader title="Cotizaciones" description="Solicita propuestas comparables a los proveedores seleccionados." action={<button className="primary" onClick={() => setOpen(!open)}>{open ? "Cerrar" : "Nueva cotización"}</button>} />{open && <form className="panel form-layout" onSubmit={submit}><fieldset><legend>Condiciones</legend><div className="form-grid"><label>Fecha límite<input type="date" name="deadline" /></label><label>Observaciones<input name="notes" maxLength={500} /></label></div></fieldset><fieldset><legend>Proveedores</legend><div className="check-grid">{data.suppliers.map((s) => <label key={s.ruc}><input type="checkbox" checked={suppliers.includes(s.businessName)} onChange={(e) => setSuppliers(e.target.checked ? [...suppliers, s.businessName] : suppliers.filter((name) => name !== s.businessName))} />{s.businessName}</label>)}</div></fieldset><fieldset><legend>Productos</legend><ProductLines products={data.products} value={lines} onChange={setLines} /></fieldset>{error && <p className="form-error">{error}</p>}<FormActions busy={busy} label="Enviar solicitud" /></form>}<section className="panel"><DataTable rows={data.quotationRequests as unknown as Row[]} columns={[['number','Solicitud'],['supplier','Proveedores'],['createdAt','Fecha'],['requestedBy','Solicitado por'],['productCount','Productos']]} /></section></>;
}

function Claims({ data, command }: { data: AppData; command: Command }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); try { await command("register-claim", Object.fromEntries(form)); setOpen(false); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo registrar el reclamo."); } finally { setBusy(false); } }
  return <><PageHeader title="Reclamos" description="Registra incidencias y mantén una bandeja clara de seguimiento." action={<button className="primary" onClick={() => setOpen(!open)}>{open ? "Cerrar" : "Nuevo reclamo"}</button>} />{open && <form className="panel form-layout" onSubmit={submit}><fieldset><legend>Datos del reclamo</legend><div className="form-grid"><label>Cliente<input name="clientName" list="claim-clients" required /></label><label>Comprobante<input name="receiptNumber" placeholder="B001-00000001" /></label><label>Motivo<input name="reason" required maxLength={120} /></label><label>Canal<select name="channel"><option>PRESENCIAL</option><option>TELEFONO</option><option>CORREO</option></select></label><label>Prioridad<select name="priority"><option>MEDIA</option><option>ALTA</option><option>BAJA</option></select></label><label className="span-2">Descripción<textarea name="description" required maxLength={500} /></label></div><datalist id="claim-clients">{data.clients.map((c) => <option key={c.document} value={c.fullName} />)}</datalist></fieldset>{error && <p className="form-error">{error}</p>}<FormActions busy={busy} label="Registrar reclamo" /></form>}<section className="panel"><DataTable rows={data.claims as unknown as Row[]} columns={[['id','Código'],['client','Cliente'],['date','Fecha'],['reason','Motivo'],['priority','Prioridad'],['status','Estado']]} /></section></>;
}
