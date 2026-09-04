-- Reconciles an existing DataCell schema that was created before its migration
-- history was registered. The block is intentionally idempotent.

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'datacell.roles'::regclass
          and conname = 'ck_roles_nombre'
    ) then
        alter table datacell.roles
            add constraint ck_roles_nombre
            check (nombre in ('ADMINISTRADOR', 'CAJERO', 'ALMACEN', 'ASISTENTE_COMPRAS'))
            not valid;
    end if;
end
$$;

alter table datacell.roles validate constraint ck_roles_nombre;

revoke all on schema datacell from public, anon, authenticated;
revoke all on all tables in schema datacell from anon, authenticated;
revoke all on all sequences in schema datacell from anon, authenticated;

alter default privileges in schema datacell revoke all on tables from anon, authenticated;
alter default privileges in schema datacell revoke all on sequences from anon, authenticated;

alter table datacell.roles enable row level security;
alter table datacell.usuarios enable row level security;
alter table datacell.clientes enable row level security;
alter table datacell.proveedores enable row level security;
alter table datacell.categorias enable row level security;
alter table datacell.marcas enable row level security;
alter table datacell.productos enable row level security;
alter table datacell.ventas enable row level security;
alter table datacell.detalles_venta enable row level security;
alter table datacell.pagos enable row level security;
alter table datacell.reclamos_cliente enable row level security;
alter table datacell.solicitudes_compra enable row level security;
alter table datacell.detalles_solicitud_compra enable row level security;
alter table datacell.solicitudes_cotizacion enable row level security;
alter table datacell.detalles_solicitud_cotizacion enable row level security;
alter table datacell.solicitudes_cotizacion_proveedores enable row level security;
alter table datacell.compras enable row level security;
alter table datacell.detalles_compra enable row level security;
alter table datacell.recepciones enable row level security;
alter table datacell.detalles_recepcion enable row level security;
alter table datacell.movimientos_inventario enable row level security;
