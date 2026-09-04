-- Keep the complete DataCell model visible in Supabase Table Editor's default
-- `public` schema while retaining server-only access through PostgreSQL.
-- ALTER TABLE ... SET SCHEMA also moves owned identity sequences, indexes and
-- constraints without copying or recreating data.

alter table datacell.roles set schema public;
alter table datacell.usuarios set schema public;
alter table datacell.clientes set schema public;
alter table datacell.proveedores set schema public;
alter table datacell.categorias set schema public;
alter table datacell.marcas set schema public;
alter table datacell.productos set schema public;
alter table datacell.ventas set schema public;
alter table datacell.detalles_venta set schema public;
alter table datacell.pagos set schema public;
alter table datacell.reclamos_cliente set schema public;
alter table datacell.solicitudes_compra set schema public;
alter table datacell.detalles_solicitud_compra set schema public;
alter table datacell.solicitudes_cotizacion set schema public;
alter table datacell.detalles_solicitud_cotizacion set schema public;
alter table datacell.solicitudes_cotizacion_proveedores set schema public;
alter table datacell.compras set schema public;
alter table datacell.detalles_compra set schema public;
alter table datacell.recepciones set schema public;
alter table datacell.detalles_recepcion set schema public;
alter table datacell.movimientos_inventario set schema public;

-- `public` is exposed by Supabase by default. The MVC backend connects directly
-- to PostgreSQL, so the Data API roles intentionally receive no table access.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

alter table public.roles enable row level security;
alter table public.usuarios enable row level security;
alter table public.clientes enable row level security;
alter table public.proveedores enable row level security;
alter table public.categorias enable row level security;
alter table public.marcas enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.detalles_venta enable row level security;
alter table public.pagos enable row level security;
alter table public.reclamos_cliente enable row level security;
alter table public.solicitudes_compra enable row level security;
alter table public.detalles_solicitud_compra enable row level security;
alter table public.solicitudes_cotizacion enable row level security;
alter table public.detalles_solicitud_cotizacion enable row level security;
alter table public.solicitudes_cotizacion_proveedores enable row level security;
alter table public.compras enable row level security;
alter table public.detalles_compra enable row level security;
alter table public.recepciones enable row level security;
alter table public.detalles_recepcion enable row level security;
alter table public.movimientos_inventario enable row level security;

drop schema datacell;
