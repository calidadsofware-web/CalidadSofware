using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pagina_Web.Data.Entities;

namespace Pagina_Web.Data.Configurations;

internal sealed class CompraConfiguration : IEntityTypeConfiguration<Compra>
{
    public void Configure(EntityTypeBuilder<Compra> entity)
    {
        entity.ToTable("compras", table =>
        {
            table.HasCheckConstraint("ck_compras_estado", "\"estado\" IN ('PENDIENTE','PARCIAL','RECIBIDA','ANULADA')");
            table.HasCheckConstraint("ck_compras_totales", "\"subtotal\" >= 0 AND \"igv\" >= 0 AND \"total\" >= 0");
        });
        entity.HasKey(x => x.IdCompra);
        entity.Property(x => x.IdCompra).HasColumnName("id_compra");
        entity.Property(x => x.Numero).HasColumnName("numero").HasMaxLength(20);
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.IdProveedor).HasColumnName("id_proveedor");
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.Property(x => x.IdSolicitudCompra).HasColumnName("id_solicitud_compra");
        entity.Property(x => x.Subtotal).HasColumnName("subtotal").HasPrecision(12, 2);
        entity.Property(x => x.Igv).HasColumnName("igv").HasPrecision(12, 2);
        entity.Property(x => x.Total).HasColumnName("total").HasPrecision(12, 2);
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
        entity.Property(x => x.Observacion).HasColumnName("observacion").HasMaxLength(500);
        entity.HasIndex(x => x.Numero).IsUnique();
        entity.HasIndex(x => new { x.Estado, x.Fecha });
        entity.HasIndex(x => x.IdProveedor);
        entity.HasIndex(x => x.IdUsuario);
        entity.HasIndex(x => x.IdSolicitudCompra);
        entity.HasOne(x => x.Proveedor).WithMany(x => x.Compras).HasForeignKey(x => x.IdProveedor).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.SolicitudCompra).WithMany(x => x.Compras).HasForeignKey(x => x.IdSolicitudCompra).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class DetalleCompraConfiguration : IEntityTypeConfiguration<DetalleCompra>
{
    public void Configure(EntityTypeBuilder<DetalleCompra> entity)
    {
        entity.ToTable("detalles_compra", table =>
        {
            table.HasCheckConstraint("ck_detalles_compra_cantidad", "\"cantidad\" > 0");
            table.HasCheckConstraint("ck_detalles_compra_precio", "\"precio_compra\" >= 0");
        });
        entity.HasKey(x => x.IdDetalleCompra);
        entity.Property(x => x.IdDetalleCompra).HasColumnName("id_detalle_compra");
        entity.Property(x => x.IdCompra).HasColumnName("id_compra");
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.Cantidad).HasColumnName("cantidad");
        entity.Property(x => x.PrecioCompra).HasColumnName("precio_compra").HasPrecision(12, 2);
        entity.HasIndex(x => new { x.IdCompra, x.IdProducto }).IsUnique();
        entity.HasIndex(x => x.IdProducto);
        entity.HasOne(x => x.Compra).WithMany(x => x.Detalles).HasForeignKey(x => x.IdCompra).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.IdProducto).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class RecepcionConfiguration : IEntityTypeConfiguration<Recepcion>
{
    public void Configure(EntityTypeBuilder<Recepcion> entity)
    {
        entity.ToTable("recepciones");
        entity.HasKey(x => x.IdRecepcion);
        entity.Property(x => x.IdRecepcion).HasColumnName("id_recepcion");
        entity.Property(x => x.Numero).HasColumnName("numero").HasMaxLength(20);
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.IdCompra).HasColumnName("id_compra");
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.Property(x => x.Guia).HasColumnName("guia").HasMaxLength(50);
        entity.Property(x => x.Observacion).HasColumnName("observacion").HasMaxLength(500);
        entity.HasIndex(x => x.Numero).IsUnique();
        entity.HasIndex(x => new { x.IdCompra, x.Fecha });
        entity.HasIndex(x => x.IdUsuario);
        entity.HasOne(x => x.Compra).WithMany(x => x.Recepciones).HasForeignKey(x => x.IdCompra).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class DetalleRecepcionConfiguration : IEntityTypeConfiguration<DetalleRecepcion>
{
    public void Configure(EntityTypeBuilder<DetalleRecepcion> entity)
    {
        entity.ToTable("detalles_recepcion", table =>
            table.HasCheckConstraint("ck_detalles_recepcion_cantidad", "\"cantidad\" > 0"));
        entity.HasKey(x => x.IdDetalleRecepcion);
        entity.Property(x => x.IdDetalleRecepcion).HasColumnName("id_detalle_recepcion");
        entity.Property(x => x.IdRecepcion).HasColumnName("id_recepcion");
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.Cantidad).HasColumnName("cantidad");
        entity.HasIndex(x => new { x.IdRecepcion, x.IdProducto }).IsUnique();
        entity.HasIndex(x => x.IdProducto);
        entity.HasOne(x => x.Recepcion).WithMany(x => x.Detalles).HasForeignKey(x => x.IdRecepcion).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.IdProducto).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class MovimientoInventarioConfiguration : IEntityTypeConfiguration<MovimientoInventario>
{
    public void Configure(EntityTypeBuilder<MovimientoInventario> entity)
    {
        entity.ToTable("movimientos_inventario", table =>
        {
            table.HasCheckConstraint("ck_movimientos_tipo", "\"tipo_movimiento\" IN ('COMPRA','VENTA','AJUSTE','DEVOLUCION_COMPRA','DEVOLUCION_VENTA')");
            table.HasCheckConstraint("ck_movimientos_stock", "\"cantidad\" > 0 AND \"stock_anterior\" >= 0 AND \"stock_nuevo\" >= 0");
        });
        entity.HasKey(x => x.IdMovimiento);
        entity.Property(x => x.IdMovimiento).HasColumnName("id_movimiento");
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.TipoMovimiento).HasColumnName("tipo_movimiento").HasMaxLength(30).IsRequired();
        entity.Property(x => x.Cantidad).HasColumnName("cantidad");
        entity.Property(x => x.StockAnterior).HasColumnName("stock_anterior");
        entity.Property(x => x.StockNuevo).HasColumnName("stock_nuevo");
        entity.Property(x => x.IdVenta).HasColumnName("id_venta");
        entity.Property(x => x.IdRecepcion).HasColumnName("id_recepcion");
        entity.Property(x => x.Observacion).HasColumnName("observacion").HasMaxLength(500);
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.HasIndex(x => new { x.IdProducto, x.Fecha });
        entity.HasIndex(x => x.IdVenta);
        entity.HasIndex(x => x.IdRecepcion);
        entity.HasIndex(x => x.IdUsuario);
        entity.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.IdProducto).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Venta).WithMany().HasForeignKey(x => x.IdVenta).OnDelete(DeleteBehavior.SetNull);
        entity.HasOne(x => x.Recepcion).WithMany(x => x.Movimientos).HasForeignKey(x => x.IdRecepcion).OnDelete(DeleteBehavior.SetNull);
        entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
    }
}
