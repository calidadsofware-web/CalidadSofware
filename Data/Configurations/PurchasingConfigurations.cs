using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pagina_Web.Data.Entities;

namespace Pagina_Web.Data.Configurations;

internal sealed class SolicitudCompraConfiguration : IEntityTypeConfiguration<SolicitudCompra>
{
    public void Configure(EntityTypeBuilder<SolicitudCompra> entity)
    {
        entity.ToTable("solicitudes_compra", table =>
        {
            table.HasCheckConstraint("ck_solicitudes_compra_estado", "\"estado\" IN ('PENDIENTE','APROBADA','RECHAZADA','ATENDIDA')");
            table.HasCheckConstraint("ck_solicitudes_compra_prioridad", "\"prioridad\" IN ('BAJA','MEDIA','ALTA')");
            table.HasCheckConstraint("ck_solicitudes_compra_total", "\"total_estimado\" >= 0");
        });
        entity.HasKey(x => x.IdSolicitudCompra);
        entity.Property(x => x.IdSolicitudCompra).HasColumnName("id_solicitud_compra");
        entity.Property(x => x.Numero).HasColumnName("numero").HasMaxLength(20);
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.FechaRequerida).HasColumnName("fecha_requerida");
        entity.Property(x => x.IdProveedor).HasColumnName("id_proveedor");
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.Property(x => x.Prioridad).HasColumnName("prioridad").HasMaxLength(10).IsRequired();
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
        entity.Property(x => x.TotalEstimado).HasColumnName("total_estimado").HasPrecision(12, 2);
        entity.Property(x => x.Observacion).HasColumnName("observacion").HasMaxLength(500);
        entity.HasIndex(x => x.Numero).IsUnique();
        entity.HasIndex(x => new { x.Estado, x.Fecha });
        entity.HasIndex(x => x.IdProveedor);
        entity.HasIndex(x => x.IdUsuario);
        entity.HasOne(x => x.Proveedor).WithMany(x => x.SolicitudesCompra).HasForeignKey(x => x.IdProveedor).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class DetalleSolicitudCompraConfiguration : IEntityTypeConfiguration<DetalleSolicitudCompra>
{
    public void Configure(EntityTypeBuilder<DetalleSolicitudCompra> entity)
    {
        entity.ToTable("detalles_solicitud_compra", table =>
            table.HasCheckConstraint("ck_detalles_solicitud_compra_cantidad", "\"cantidad\" > 0"));
        entity.HasKey(x => x.IdDetalleSolicitud);
        entity.Property(x => x.IdDetalleSolicitud).HasColumnName("id_detalle_solicitud");
        entity.Property(x => x.IdSolicitudCompra).HasColumnName("id_solicitud_compra");
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.Cantidad).HasColumnName("cantidad");
        entity.HasIndex(x => new { x.IdSolicitudCompra, x.IdProducto }).IsUnique();
        entity.HasIndex(x => x.IdProducto);
        entity.HasOne(x => x.SolicitudCompra).WithMany(x => x.Detalles).HasForeignKey(x => x.IdSolicitudCompra).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.IdProducto).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SolicitudCotizacionConfiguration : IEntityTypeConfiguration<SolicitudCotizacion>
{
    public void Configure(EntityTypeBuilder<SolicitudCotizacion> entity)
    {
        entity.ToTable("solicitudes_cotizacion", table =>
            table.HasCheckConstraint("ck_solicitudes_cotizacion_estado", "\"estado\" IN ('PENDIENTE','RESPONDIDA','CANCELADA')"));
        entity.HasKey(x => x.IdSolicitudCotizacion);
        entity.Property(x => x.IdSolicitudCotizacion).HasColumnName("id_solicitud_cotizacion");
        entity.Property(x => x.Numero).HasColumnName("numero").HasMaxLength(20);
        entity.Property(x => x.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.FechaLimite).HasColumnName("fecha_limite");
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
        entity.Property(x => x.Observacion).HasColumnName("observacion").HasMaxLength(500);
        entity.HasIndex(x => x.Numero).IsUnique();
        entity.HasIndex(x => new { x.Estado, x.Fecha });
        entity.HasIndex(x => x.IdUsuario);
        entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class DetalleSolicitudCotizacionConfiguration : IEntityTypeConfiguration<DetalleSolicitudCotizacion>
{
    public void Configure(EntityTypeBuilder<DetalleSolicitudCotizacion> entity)
    {
        entity.ToTable("detalles_solicitud_cotizacion", table =>
            table.HasCheckConstraint("ck_detalles_solicitud_cotizacion_cantidad", "\"cantidad\" > 0"));
        entity.HasKey(x => x.IdDetalleCotizacion);
        entity.Property(x => x.IdDetalleCotizacion).HasColumnName("id_detalle_cotizacion");
        entity.Property(x => x.IdSolicitudCotizacion).HasColumnName("id_solicitud_cotizacion");
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.Cantidad).HasColumnName("cantidad");
        entity.Property(x => x.PrecioUnitario).HasColumnName("precio_unitario").HasPrecision(12, 2);
        entity.HasIndex(x => new { x.IdSolicitudCotizacion, x.IdProducto }).IsUnique();
        entity.HasIndex(x => x.IdProducto);
        entity.HasOne(x => x.SolicitudCotizacion).WithMany(x => x.Detalles).HasForeignKey(x => x.IdSolicitudCotizacion).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.IdProducto).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SolicitudCotizacionProveedorConfiguration : IEntityTypeConfiguration<SolicitudCotizacionProveedor>
{
    public void Configure(EntityTypeBuilder<SolicitudCotizacionProveedor> entity)
    {
        entity.ToTable("solicitudes_cotizacion_proveedores", table =>
            table.HasCheckConstraint("ck_cotizacion_proveedor_estado", "\"estado\" IN ('PENDIENTE','RESPONDIDA','DESCARTADA')"));
        entity.HasKey(x => new { x.IdSolicitudCotizacion, x.IdProveedor });
        entity.Property(x => x.IdSolicitudCotizacion).HasColumnName("id_solicitud_cotizacion");
        entity.Property(x => x.IdProveedor).HasColumnName("id_proveedor");
        entity.Property(x => x.FechaRespuesta).HasColumnName("fecha_respuesta");
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
        entity.HasIndex(x => x.IdProveedor);
        entity.HasOne(x => x.SolicitudCotizacion).WithMany(x => x.Proveedores).HasForeignKey(x => x.IdSolicitudCotizacion).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(x => x.Proveedor).WithMany(x => x.SolicitudesCotizacion).HasForeignKey(x => x.IdProveedor).OnDelete(DeleteBehavior.Restrict);
    }
}
