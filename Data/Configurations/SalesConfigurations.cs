using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pagina_Web.Data.Entities;

namespace Pagina_Web.Data.Configurations;

internal sealed class VentaConfiguration : IEntityTypeConfiguration<Venta>
{
    public void Configure(EntityTypeBuilder<Venta> entity)
    {
        entity.ToTable("ventas", table =>
        {
            table.HasCheckConstraint("ck_ventas_tipo_comprobante", "\"tipo_comprobante\" IN ('BOLETA','FACTURA')");
            table.HasCheckConstraint("ck_ventas_estado", "\"estado\" IN ('REGISTRADA','ANULADA')");
            table.HasCheckConstraint("ck_ventas_totales", "\"subtotal\" >= 0 AND \"igv\" >= 0 AND \"total\" >= 0");
        });
        entity.HasKey(x => x.IdVenta);
        entity.Property(x => x.IdVenta).HasColumnName("id_venta");
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.IdCliente).HasColumnName("id_cliente");
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.Property(x => x.TipoComprobante).HasColumnName("tipo_comprobante").HasMaxLength(20).HasDefaultValue("BOLETA");
        entity.Property(x => x.Serie).HasColumnName("serie").HasMaxLength(4).IsRequired();
        entity.Property(x => x.Numero).HasColumnName("numero").HasMaxLength(8);
        entity.Property(x => x.Subtotal).HasColumnName("subtotal").HasPrecision(12, 2);
        entity.Property(x => x.Igv).HasColumnName("igv").HasPrecision(12, 2);
        entity.Property(x => x.Total).HasColumnName("total").HasPrecision(12, 2);
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("REGISTRADA");
        entity.Property(x => x.Observacion).HasColumnName("observacion").HasMaxLength(250);
        entity.HasIndex(x => new { x.TipoComprobante, x.Serie, x.Numero }).IsUnique();
        entity.HasIndex(x => x.Fecha);
        entity.HasIndex(x => x.IdCliente);
        entity.HasIndex(x => x.IdUsuario);
        entity.HasOne(x => x.Cliente).WithMany(x => x.Ventas).HasForeignKey(x => x.IdCliente).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class DetalleVentaConfiguration : IEntityTypeConfiguration<DetalleVenta>
{
    public void Configure(EntityTypeBuilder<DetalleVenta> entity)
    {
        entity.ToTable("detalles_venta", table =>
        {
            table.HasCheckConstraint("ck_detalles_venta_cantidad", "\"cantidad\" > 0");
            table.HasCheckConstraint("ck_detalles_venta_precio", "\"precio_unitario\" >= 0");
        });
        entity.HasKey(x => x.IdDetalleVenta);
        entity.Property(x => x.IdDetalleVenta).HasColumnName("id_detalle_venta");
        entity.Property(x => x.IdVenta).HasColumnName("id_venta");
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.Cantidad).HasColumnName("cantidad");
        entity.Property(x => x.PrecioUnitario).HasColumnName("precio_unitario").HasPrecision(12, 2);
        entity.HasIndex(x => new { x.IdVenta, x.IdProducto }).IsUnique();
        entity.HasIndex(x => x.IdProducto);
        entity.HasOne(x => x.Venta).WithMany(x => x.Detalles).HasForeignKey(x => x.IdVenta).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.IdProducto).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class PagoConfiguration : IEntityTypeConfiguration<Pago>
{
    public void Configure(EntityTypeBuilder<Pago> entity)
    {
        entity.ToTable("pagos", table =>
        {
            table.HasCheckConstraint("ck_pagos_metodo", "\"metodo\" IN ('EFECTIVO','TARJETA','YAPE','TRANSFERENCIA')");
            table.HasCheckConstraint("ck_pagos_estado", "\"estado\" IN ('PENDIENTE','PAGADO','OBSERVADO','ANULADO')");
            table.HasCheckConstraint("ck_pagos_monto", "\"monto\" > 0");
        });
        entity.HasKey(x => x.IdPago);
        entity.Property(x => x.IdPago).HasColumnName("id_pago");
        entity.Property(x => x.IdVenta).HasColumnName("id_venta");
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.Metodo).HasColumnName("metodo").HasMaxLength(20).IsRequired();
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
        entity.Property(x => x.Monto).HasColumnName("monto").HasPrecision(12, 2);
        entity.Property(x => x.Referencia).HasColumnName("referencia").HasMaxLength(80);
        entity.HasIndex(x => x.IdVenta);
        entity.HasIndex(x => new { x.Fecha, x.Estado });
        entity.HasOne(x => x.Venta).WithMany(x => x.Pagos).HasForeignKey(x => x.IdVenta).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ReclamoClienteConfiguration : IEntityTypeConfiguration<ReclamoCliente>
{
    public void Configure(EntityTypeBuilder<ReclamoCliente> entity)
    {
        entity.ToTable("reclamos_cliente", table =>
        {
            table.HasCheckConstraint("ck_reclamos_estado", "\"estado\" IN ('REGISTRADO','EN_REVISION','ATENDIDO','CERRADO')");
            table.HasCheckConstraint("ck_reclamos_prioridad", "\"prioridad\" IN ('BAJA','MEDIA','ALTA')");
        });
        entity.HasKey(x => x.IdReclamo);
        entity.Property(x => x.IdReclamo).HasColumnName("id_reclamo");
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.IdCliente).HasColumnName("id_cliente");
        entity.Property(x => x.IdVenta).HasColumnName("id_venta");
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.Motivo).HasColumnName("motivo").HasMaxLength(120).IsRequired();
        entity.Property(x => x.Descripcion).HasColumnName("descripcion").HasMaxLength(500).IsRequired();
        entity.Property(x => x.Canal).HasColumnName("canal").HasMaxLength(30).IsRequired();
        entity.Property(x => x.Prioridad).HasColumnName("prioridad").HasMaxLength(10).IsRequired();
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.Property(x => x.Observacion).HasColumnName("observacion").HasMaxLength(250);
        entity.HasIndex(x => new { x.IdCliente, x.Fecha });
        entity.HasIndex(x => x.IdVenta);
        entity.HasIndex(x => x.IdProducto);
        entity.HasIndex(x => x.IdUsuario);
        entity.HasOne(x => x.Cliente).WithMany(x => x.Reclamos).HasForeignKey(x => x.IdCliente).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Venta).WithMany(x => x.Reclamos).HasForeignKey(x => x.IdVenta).OnDelete(DeleteBehavior.SetNull);
        entity.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.IdProducto).OnDelete(DeleteBehavior.SetNull);
        entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
    }
}
