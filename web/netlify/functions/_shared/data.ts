import type { AppUser } from "./auth.js";
import { APP_ROLES, POLICIES } from "./auth.js";
import { query } from "./db.js";

export interface ProductRow {
  code: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface ClientRow {
  document: string;
  fullName: string;
  phone: string;
  email: string;
  lastPurchase: string;
  status: string;
}

export interface SupplierRow {
  ruc: string;
  businessName: string;
  contact: string;
  phone: string;
  email: string;
  status: string;
}

export interface PurchaseRequestRow {
  number: string;
  supplier: string;
  createdAt: string;
  status: string;
  requestedBy: string;
  estimatedTotal: number;
}

export interface PaymentRow {
  document: string;
  client: string;
  date: string;
  method: string;
  status: string;
  total: number;
}

export interface QuotationRow {
  number: string;
  supplier: string;
  createdAt: string;
  requestedBy: string;
  productCount: number;
}

export interface ClaimRow {
  id: number;
  client: string;
  date: string;
  reason: string;
  priority: string;
  status: string;
}

export interface PurchaseItemRow {
  code: string;
  name: string;
  ordered: number;
  received: number;
  pending: number;
}

export interface PurchaseRow {
  number: string;
  supplier: string;
  date: string;
  status: string;
  items: PurchaseItemRow[];
}

export interface MetricRow {
  label: string;
  value: string;
  hint: string;
}

export interface AppData {
  user: AppUser;
  metrics: MetricRow[];
  products: ProductRow[];
  clients: ClientRow[];
  suppliers: SupplierRow[];
  purchaseRequests: PurchaseRequestRow[];
  quotationRequests: QuotationRow[];
  payments: PaymentRow[];
  claims: ClaimRow[];
  purchases: PurchaseRow[];
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

function can(role: AppUser["role"], roles: readonly AppUser["role"][]): boolean {
  return roles.includes(role);
}

async function getMetrics(): Promise<MetricRow[]> {
  const [row] = await query<{
    sales_today: string;
    receipts_today: number;
    pending_purchases: number;
    low_stock: number;
    open_claims: number;
  }>(`
    with limits as (
      select
        date_trunc('day', now() at time zone 'America/Lima') at time zone 'America/Lima' as starts_at,
        (date_trunc('day', now() at time zone 'America/Lima') + interval '1 day') at time zone 'America/Lima' as ends_at
    )
    select
      coalesce((select sum(p.monto) from public.pagos p, limits l
                where p.fecha >= l.starts_at and p.fecha < l.ends_at and p.estado = 'PAGADO'), 0)::text as sales_today,
      (select count(*)::int from public.ventas v, limits l
       where v.fecha >= l.starts_at and v.fecha < l.ends_at and v.estado = 'REGISTRADA') as receipts_today,
      (select count(*)::int from public.solicitudes_compra where estado = 'PENDIENTE') as pending_purchases,
      (select count(*)::int from public.productos where estado = 'ACTIVO' and stock <= stock_minimo) as low_stock,
      (select count(*)::int from public.reclamos_cliente where estado <> 'CERRADO') as open_claims`);

  const sales = Number(row?.sales_today ?? 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
  });
  return [
    { label: "Ventas del día", value: sales, hint: `${row?.receipts_today ?? 0} comprobantes` },
    {
      label: "Solicitudes pendientes",
      value: String(row?.pending_purchases ?? 0),
      hint: "compras por aprobar",
    },
    { label: "Stock bajo", value: String(row?.low_stock ?? 0), hint: "productos bajo mínimo" },
    { label: "Reclamos abiertos", value: String(row?.open_claims ?? 0), hint: "en seguimiento" },
  ];
}

async function getProducts(): Promise<ProductRow[]> {
  return query<ProductRow>(`
    select p.codigo as code,
           p.nombre as name,
           coalesce(p.descripcion, '') as description,
           c.nombre as category,
           m.nombre as brand,
           p.stock,
           p.stock_minimo as "minStock",
           p.precio_venta::float8 as price
      from public.productos p
      join public.categorias c on c.id_categoria = p.id_categoria
      join public.marcas m on m.id_marca = p.id_marca
     where p.estado = 'ACTIVO'
     order by p.nombre`);
}

async function getClients(): Promise<ClientRow[]> {
  return query<ClientRow>(`
    select coalesce(c.documento, '-') as document,
           trim(concat(c.nombres, ' ', c.apellidos)) as "fullName",
           coalesce(c.telefono, '-') as phone,
           coalesce(c.correo, '-') as email,
           coalesce(last_sale.document, 'Sin compras') as "lastPurchase",
           initcap(lower(c.estado)) as status
      from public.clientes c
      left join lateral (
        select concat(v.serie, '-', v.numero) as document
          from public.ventas v
         where v.id_cliente = c.id_cliente
           and v.estado = 'REGISTRADA'
           and v.numero is not null
         order by v.fecha desc
         limit 1
      ) last_sale on true
     where c.estado = 'ACTIVO'
     order by c.nombres, c.apellidos`);
}

async function getSuppliers(): Promise<SupplierRow[]> {
  return query<SupplierRow>(`
    select ruc,
           razon_social as "businessName",
           coalesce(contacto, '-') as contact,
           coalesce(telefono, '-') as phone,
           coalesce(correo, '-') as email,
           initcap(lower(estado)) as status
      from public.proveedores
     where estado = 'ACTIVO'
     order by razon_social`);
}

async function getPurchaseRequests(): Promise<PurchaseRequestRow[]> {
  const rows = await query<PurchaseRequestRow & { status: string }>(`
    select coalesce(sc.numero, concat('SC-', sc.id_solicitud_compra)) as number,
           coalesce(p.razon_social, 'Por definir') as supplier,
           to_char(sc.fecha at time zone 'America/Lima', 'DD/MM/YYYY') as "createdAt",
           sc.estado as status,
           trim(concat(u.nombres, ' ', u.apellidos)) as "requestedBy",
           sc.total_estimado::float8 as "estimatedTotal"
      from public.solicitudes_compra sc
      left join public.proveedores p on p.id_proveedor = sc.id_proveedor
      join public.usuarios u on u.id_usuario = sc.id_usuario
     order by sc.fecha desc`);
  return rows.map((row) => ({ ...row, status: titleCase(row.status) }));
}

async function getPayments(): Promise<PaymentRow[]> {
  const rows = await query<PaymentRow & { method: string; status: string }>(`
    select concat(v.serie, '-', v.numero) as document,
           trim(concat(c.nombres, ' ', c.apellidos)) as client,
           to_char(p.fecha at time zone 'America/Lima', 'DD/MM/YYYY') as date,
           p.metodo as method,
           p.estado as status,
           p.monto::float8 as total
      from public.pagos p
      join public.ventas v on v.id_venta = p.id_venta
      join public.clientes c on c.id_cliente = v.id_cliente
     order by p.fecha desc`);
  return rows.map((row) => ({ ...row, method: titleCase(row.method), status: titleCase(row.status) }));
}

async function getQuotations(): Promise<QuotationRow[]> {
  return query<QuotationRow>(`
    select coalesce(sc.numero, concat('COT-', sc.id_solicitud_cotizacion)) as number,
           coalesce(string_agg(distinct p.razon_social, ', '), 'Sin proveedor') as supplier,
           to_char(sc.fecha at time zone 'America/Lima', 'DD/MM/YYYY') as "createdAt",
           trim(concat(u.nombres, ' ', u.apellidos)) as "requestedBy",
           count(distinct d.id_detalle_cotizacion)::int as "productCount"
      from public.solicitudes_cotizacion sc
      join public.usuarios u on u.id_usuario = sc.id_usuario
      left join public.solicitudes_cotizacion_proveedores link
        on link.id_solicitud_cotizacion = sc.id_solicitud_cotizacion
      left join public.proveedores p on p.id_proveedor = link.id_proveedor
      left join public.detalles_solicitud_cotizacion d
        on d.id_solicitud_cotizacion = sc.id_solicitud_cotizacion
     group by sc.id_solicitud_cotizacion, sc.numero, sc.fecha, u.nombres, u.apellidos
     order by sc.fecha desc`);
}

async function getClaims(): Promise<ClaimRow[]> {
  const rows = await query<ClaimRow & { priority: string; status: string }>(`
    select r.id_reclamo as id,
           trim(concat(c.nombres, ' ', c.apellidos)) as client,
           to_char(r.fecha at time zone 'America/Lima', 'DD/MM/YYYY') as date,
           r.motivo as reason,
           r.prioridad as priority,
           r.estado as status
      from public.reclamos_cliente r
      join public.clientes c on c.id_cliente = r.id_cliente
     order by r.fecha desc
     limit 30`);
  return rows.map((row) => ({ ...row, priority: titleCase(row.priority), status: titleCase(row.status) }));
}

async function getPurchases(): Promise<PurchaseRow[]> {
  const rows = await query<{
    number: string;
    supplier: string;
    date: string;
    status: string;
    items: PurchaseItemRow[] | null;
  }>(`
    select coalesce(co.numero, concat('OC-', co.id_compra)) as number,
           p.razon_social as supplier,
           to_char(co.fecha at time zone 'America/Lima', 'DD/MM/YYYY') as date,
           co.estado as status,
           jsonb_agg(jsonb_build_object(
             'code', pr.codigo,
             'name', pr.nombre,
             'ordered', dc.cantidad,
             'received', coalesce(received.quantity, 0),
             'pending', greatest(dc.cantidad - coalesce(received.quantity, 0), 0)
           ) order by pr.nombre) as items
      from public.compras co
      join public.proveedores p on p.id_proveedor = co.id_proveedor
      join public.detalles_compra dc on dc.id_compra = co.id_compra
      join public.productos pr on pr.id_producto = dc.id_producto
      left join lateral (
        select sum(dr.cantidad)::int as quantity
          from public.recepciones r
          join public.detalles_recepcion dr on dr.id_recepcion = r.id_recepcion
         where r.id_compra = co.id_compra
           and dr.id_producto = dc.id_producto
      ) received on true
     where co.estado <> 'ANULADA'
     group by co.id_compra, co.numero, co.fecha, co.estado, p.razon_social
     order by co.fecha desc`);
  return rows.map((row) => ({ ...row, status: titleCase(row.status), items: row.items ?? [] }));
}

export async function getAppData(user: AppUser): Promise<AppData> {
  const sales = can(user.role, POLICIES.sales);
  const procurement = can(user.role, POLICIES.procurement);
  const quotations = can(user.role, POLICIES.quotations);
  const warehouse = can(user.role, POLICIES.warehouse);

  const [
    metrics,
    products,
    clients,
    suppliers,
    purchaseRequests,
    quotationRequests,
    payments,
    claims,
    purchases,
  ] = await Promise.all([
    getMetrics(),
    getProducts(),
    getClients(),
    procurement ? getSuppliers() : Promise.resolve([]),
    procurement ? getPurchaseRequests() : Promise.resolve([]),
    quotations ? getQuotations() : Promise.resolve([]),
    sales ? getPayments() : Promise.resolve([]),
    sales ? getClaims() : Promise.resolve([]),
    warehouse ? getPurchases() : Promise.resolve([]),
  ]);

  return {
    user,
    metrics,
    products,
    clients,
    suppliers,
    purchaseRequests,
    quotationRequests,
    payments,
    claims,
    purchases,
  };
}

export function isAdministrator(user: AppUser): boolean {
  return user.role === APP_ROLES.administrator;
}
