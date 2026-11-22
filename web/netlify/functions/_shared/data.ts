import type { AppUser } from "./auth.js";
import { APP_ROLES, POLICIES } from "./auth.js";
import { query } from "./db.js";

import type {
  AppData,
  Product as ProductRow,
  Client as ClientRow,
  Supplier as SupplierRow,
  PurchaseRequest as PurchaseRequestRow,
  Payment as PaymentRow,
  Quotation as QuotationRow,
  Claim as ClaimRow,
  PurchaseItem as PurchaseItemRow,
  Purchase as PurchaseRow,
  ManagedUser,
  InventoryMovement,
  ReceiptRecord,
} from "../../../src/types.js";
export type { AppData } from "../../../src/types.js";

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

function can(role: AppUser["role"], roles: readonly AppUser["role"][]): boolean {
  return roles.includes(role);
}

async function getProducts(user: AppUser): Promise<ProductRow[]> {
  return query<ProductRow>(`
    select p.codigo as code, coalesce(p.codigo_barras, '') as barcode, initcap(lower(p.estado)) as status,
           ${can(user.role, POLICIES.procurement) ? "p.precio_compra::float8" : "null::float8"} as cost,
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
     order by p.nombre`);
}

async function getClients(): Promise<ClientRow[]> {
  return query<ClientRow>(`
    select c.id_cliente as id, c.nombres as "firstName", coalesce(c.apellidos, '') as "lastName", coalesce(c.direccion, '') as address, coalesce(c.documento, '') as document,
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
     order by c.nombres, c.apellidos`);
}

async function getSuppliers(): Promise<SupplierRow[]> {
  return query<SupplierRow>(`
    select id_proveedor as id, coalesce(direccion, '') as address, ruc,
           razon_social as "businessName",
           coalesce(contacto, '-') as contact,
           coalesce(telefono, '-') as phone,
           coalesce(correo, '-') as email,
           initcap(lower(estado)) as status
      from public.proveedores
     order by razon_social`);
}

async function getPurchaseRequests(): Promise<PurchaseRequestRow[]> {
  const rows = await query<PurchaseRequestRow & { status: string }>(`
    select sc.id_solicitud_compra as id, sc.id_proveedor as "supplierId", initcap(lower(sc.prioridad)) as priority, coalesce(to_char(sc.fecha_requerida,'DD/MM/YYYY'),'') as "requiredDate", coalesce(sc.observacion,'') as notes,
           (select coalesce(jsonb_agg(jsonb_build_object('code',pr.codigo,'quantity',d.cantidad)),'[]') from public.detalles_solicitud_compra d join public.productos pr on pr.id_producto=d.id_producto where d.id_solicitud_compra=sc.id_solicitud_compra) as items,
           coalesce(sc.numero, concat('SC-', sc.id_solicitud_compra)) as number,
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
    select p.id_pago as id, c.id_cliente as "clientId", coalesce(p.referencia,'') as reference,
           v.subtotal::float8 as subtotal,v.igv::float8 as tax,coalesce(v.observacion,'') as notes,
           (select coalesce(jsonb_agg(jsonb_build_object('name',pr.nombre,'quantity',d.cantidad,'price',d.precio_unitario::float8)),'[]') from public.detalles_venta d join public.productos pr on pr.id_producto=d.id_producto where d.id_venta=v.id_venta) as items,
           concat(v.serie, '-', v.numero) as document,
           trim(concat(c.nombres, ' ', c.apellidos)) as client,
           trim(concat(u.nombres, ' ', u.apellidos)) as cashier,
           (select coalesce(string_agg(pr.nombre, ', ' order by pr.nombre), '') from public.detalles_venta d join public.productos pr on pr.id_producto=d.id_producto where d.id_venta=v.id_venta) as products,
           to_char(p.fecha at time zone 'America/Lima', 'DD/MM/YYYY HH24:MI') as date,
           p.metodo as method,
           p.estado as status,
           p.monto::float8 as total
      from public.pagos p
      join public.ventas v on v.id_venta = p.id_venta
      join public.clientes c on c.id_cliente = v.id_cliente
      join public.usuarios u on u.id_usuario = v.id_usuario
     order by p.fecha desc`);
  return rows.map((row) => ({ ...row, method: titleCase(row.method), status: titleCase(row.status) }));
}

async function getQuotations(): Promise<QuotationRow[]> {
  return query<QuotationRow>(`
    select sc.id_solicitud_cotizacion as id, initcap(lower(sc.estado)) as status, coalesce(to_char(sc.fecha_limite,'DD/MM/YYYY'),'') as deadline, coalesce(sc.observacion,'') as notes,
           (select coalesce(jsonb_agg(jsonb_build_object('code',pr.codigo,'quantity',di.cantidad)),'[]') from public.detalles_solicitud_cotizacion di join public.productos pr on pr.id_producto=di.id_producto where di.id_solicitud_cotizacion=sc.id_solicitud_cotizacion) as items,
           coalesce(sc.numero, concat('COT-', sc.id_solicitud_cotizacion)) as number,
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
    select r.id_reclamo as id, c.id_cliente as "clientId", r.descripcion as description,r.canal as channel,coalesce(r.observacion,'') as resolution,
           coalesce((select concat(v.serie,'-',v.numero) from public.ventas v where v.id_venta=r.id_venta),'') as "receiptNumber",
           trim(concat(c.nombres, ' ', c.apellidos)) as client,
           to_char(r.fecha at time zone 'America/Lima', 'DD/MM/YYYY') as date,
           r.motivo as reason,
           r.prioridad as priority,
           r.estado as status
      from public.reclamos_cliente r
      join public.clientes c on c.id_cliente = r.id_cliente
     order by r.fecha desc`);
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

  const [products, clients, suppliers, purchaseRequests, quotationRequests, payments, claims, purchases] =
    await Promise.all([
      getProducts(user),
      getClients(),
      procurement ? getSuppliers() : Promise.resolve([]),
      procurement ? getPurchaseRequests() : Promise.resolve([]),
      quotations ? getQuotations() : Promise.resolve([]),
      sales ? getPayments() : Promise.resolve([]),
      sales ? getClaims() : Promise.resolve([]),
      procurement ? getPurchases() : Promise.resolve([]),
    ]);

  return {
    user,
    metrics: [],
    ...(await getManagementData(user, warehouse)),
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

async function getManagementData(user: AppUser, warehouse: boolean) {
  const [users, categories, brands, movements, receipts] = await Promise.all([
    isAdministrator(user)
      ? query<ManagedUser>(`select u.id_usuario as id,u.nombres as "firstName",u.apellidos as "lastName",
      trim(concat(u.nombres,' ',u.apellidos)) as "fullName",u.correo as email,r.nombre as role,
      case r.nombre when 'ADMINISTRADOR' then 'Administrador' when 'CAJERO' then 'Cajero' when 'ALMACEN' then 'Almacén' else 'Asistente de compras' end as "roleDisplay",
      initcap(lower(u.estado)) as status,to_char(u.fecha_registro at time zone 'America/Lima','DD/MM/YYYY') as "createdAt"
      from public.usuarios u join public.roles r on r.id_rol=u.id_rol order by u.nombres,u.apellidos`)
      : [],
    warehouse ? query<{ name: string }>("select nombre as name from public.categorias order by nombre") : [],
    warehouse ? query<{ name: string }>("select nombre as name from public.marcas order by nombre") : [],
    warehouse
      ? query<InventoryMovement>(`select m.id_movimiento as id,p.codigo as code,p.nombre as product,
      to_char(m.fecha at time zone 'America/Lima','DD/MM/YYYY HH24:MI') as date,
      initcap(lower(m.tipo_movimiento)) as type,m.cantidad as quantity,m.stock_anterior as before,m.stock_nuevo as after,
      coalesce(m.observacion,'') as notes,trim(concat(u.nombres,' ',u.apellidos)) as responsible
      from public.movimientos_inventario m join public.productos p on p.id_producto=m.id_producto
      join public.usuarios u on u.id_usuario=m.id_usuario order by m.id_movimiento desc`)
      : [],
    warehouse
      ? query<ReceiptRecord>(`select r.numero as number,c.numero as purchase,p.razon_social as supplier,
      to_char(r.fecha at time zone 'America/Lima','DD/MM/YYYY') as date,coalesce(r.guia,'') as guide,coalesce(r.observacion,'') as notes
      from public.recepciones r join public.compras c on c.id_compra=r.id_compra
      join public.proveedores p on p.id_proveedor=c.id_proveedor order by r.fecha desc`)
      : [],
  ]);
  return {
    users,
    categories: categories.map((row) => row.name),
    brands: brands.map((row) => row.name),
    movements,
    receipts,
    local: typeof Netlify !== "undefined" && Netlify.env.get("DATACELL_LOCAL") === "true",
  };
}
