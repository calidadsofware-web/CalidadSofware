using Microsoft.EntityFrameworkCore;
using Pagina_Web.Data.Entities;

namespace Pagina_Web.Data;

public class DataCellDbContext(DbContextOptions<DataCellDbContext> options) : DbContext(options)
{
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Marca> Marcas => Set<Marca>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<DetalleVenta> DetallesVenta => Set<DetalleVenta>();
    public DbSet<ReclamoCliente> ReclamosCliente => Set<ReclamoCliente>();
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<DetalleCompra> DetallesCompra => Set<DetalleCompra>();
    public DbSet<SolicitudCotizacion> SolicitudesCotizacion => Set<SolicitudCotizacion>();
    public DbSet<DetalleSolicitudCotizacion> DetallesSolicitudCotizacion => Set<DetalleSolicitudCotizacion>();
    public DbSet<SolicitudCompra> SolicitudesCompra => Set<SolicitudCompra>();
    public DbSet<DetalleSolicitudCompra> DetallesSolicitudCompra => Set<DetalleSolicitudCompra>();
    public DbSet<Recepcion> Recepciones => Set<Recepcion>();
    public DbSet<DetalleRecepcion> DetallesRecepcion => Set<DetalleRecepcion>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Rol>(entity =>
        {
            entity.ToTable("Rol");
            entity.HasKey(e => e.IdRol);
            entity.Property(e => e.NombreRol).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuario");
            entity.HasKey(e => e.IdUsuario);
            entity.Property(e => e.Nombres).HasMaxLength(80).IsRequired();
            entity.Property(e => e.Apellidos).HasMaxLength(80).IsRequired();
            entity.Property(e => e.Correo).HasMaxLength(120).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("ACTIVO");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("Cliente");
            entity.HasKey(e => e.IdCliente);
            entity.Property(e => e.Nombres).HasMaxLength(80).IsRequired();
            entity.Property(e => e.Apellidos).HasMaxLength(80);
            entity.Property(e => e.Documento).HasMaxLength(20);
            entity.Property(e => e.Direccion).HasMaxLength(150);
            entity.Property(e => e.Telefono).HasMaxLength(20);
            entity.Property(e => e.Correo).HasMaxLength(120);
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("ACTIVO");
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("Proveedor");
            entity.HasKey(e => e.IdProveedor);
            entity.Property(e => e.Ruc).HasMaxLength(11).IsRequired();
            entity.Property(e => e.RazonSocial).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Direccion).HasMaxLength(150);
            entity.Property(e => e.Contacto).HasMaxLength(100);
            entity.Property(e => e.Telefono).HasMaxLength(20);
            entity.Property(e => e.Correo).HasMaxLength(120);
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("ACTIVO");
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("Categoria");
            entity.HasKey(e => e.IdCategoria);
            entity.Property(e => e.Nombre).HasMaxLength(80).IsRequired();
        });

        modelBuilder.Entity<Marca>(entity =>
        {
            entity.ToTable("Marca");
            entity.HasKey(e => e.IdMarca);
            entity.Property(e => e.Nombre).HasMaxLength(80).IsRequired();
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("Producto");
            entity.HasKey(e => e.IdProducto);
            entity.Property(e => e.Codigo).HasMaxLength(30).IsRequired();
            entity.Property(e => e.CodigoBarras).HasMaxLength(50);
            entity.Property(e => e.Nombre).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Descripcion).HasMaxLength(250);
            entity.Property(e => e.PrecioCompra).HasPrecision(10, 2);
            entity.Property(e => e.PrecioVenta).HasPrecision(10, 2);
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("ACTIVO");
        });

        modelBuilder.Entity<Venta>(entity =>
        {
            entity.ToTable("Venta");
            entity.HasKey(e => e.IdVenta);
            entity.Property(e => e.TipoComprobante).HasMaxLength(20).HasDefaultValue("BOLETA");
            entity.Property(e => e.Serie).HasMaxLength(4);
            entity.Property(e => e.Numero).HasMaxLength(8);
            entity.Property(e => e.MetodoPago).HasMaxLength(20).HasDefaultValue("EFECTIVO");
            entity.Property(e => e.EstadoPago).HasMaxLength(20).HasDefaultValue("PAGADO");
            entity.Property(e => e.Subtotal).HasPrecision(10, 2);
            entity.Property(e => e.Igv).HasPrecision(10, 2);
            entity.Property(e => e.Total).HasPrecision(10, 2);
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("REGISTRADA");
            entity.Property(e => e.Observacion).HasMaxLength(250);
        });

        modelBuilder.Entity<DetalleVenta>(entity =>
        {
            entity.ToTable("DetalleVenta");
            entity.HasKey(e => e.IdDetalleVenta);
            entity.Property(e => e.PrecioUnitario).HasPrecision(10, 2);
            entity.Property(e => e.Subtotal).HasPrecision(10, 2);
        });

        modelBuilder.Entity<ReclamoCliente>(entity =>
        {
            entity.ToTable("ReclamoCliente");
            entity.HasKey(e => e.IdReclamo);
            entity.Property(e => e.Motivo).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Descripcion).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("REGISTRADO");
            entity.Property(e => e.Observacion).HasMaxLength(250);
        });

        modelBuilder.Entity<Compra>(entity =>
        {
            entity.ToTable("Compra");
            entity.HasKey(e => e.IdCompra);
            entity.Property(e => e.Subtotal).HasPrecision(10, 2);
            entity.Property(e => e.Igv).HasPrecision(10, 2);
            entity.Property(e => e.Total).HasPrecision(10, 2);
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("PENDIENTE");
            entity.Property(e => e.Observacion).HasMaxLength(250);
        });

        modelBuilder.Entity<DetalleCompra>(entity =>
        {
            entity.ToTable("DetalleCompra");
            entity.HasKey(e => e.IdDetalleCompra);
            entity.Property(e => e.PrecioCompra).HasPrecision(10, 2);
            entity.Property(e => e.Subtotal).HasPrecision(10, 2);
        });

        modelBuilder.Entity<SolicitudCotizacion>(entity =>
        {
            entity.ToTable("SolicitudCotizacion");
            entity.HasKey(e => e.IdSolicitudCotizacion);
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("PENDIENTE");
            entity.Property(e => e.Observacion).HasMaxLength(250);
        });

        modelBuilder.Entity<DetalleSolicitudCotizacion>(entity =>
        {
            entity.ToTable("DetalleSolicitudCotizacion");
            entity.HasKey(e => e.IdDetalleCotizacion);
            entity.Property(e => e.PrecioUnitario).HasPrecision(10, 2);
        });

        modelBuilder.Entity<SolicitudCompra>(entity =>
        {
            entity.ToTable("SolicitudCompra");
            entity.HasKey(e => e.IdSolicitudCompra);
            entity.Property(e => e.Estado).HasMaxLength(20).HasDefaultValue("PENDIENTE");
            entity.Property(e => e.Observacion).HasMaxLength(250);
        });

        modelBuilder.Entity<DetalleSolicitudCompra>(entity =>
        {
            entity.ToTable("DetalleSolicitudCompra");
            entity.HasKey(e => e.IdDetalleSolicitud);
        });

        modelBuilder.Entity<Recepcion>(entity =>
        {
            entity.ToTable("Recepcion");
            entity.HasKey(e => e.IdRecepcion);
            entity.Property(e => e.Observacion).HasMaxLength(250);
        });

        modelBuilder.Entity<DetalleRecepcion>(entity =>
        {
            entity.ToTable("DetalleRecepcion");
            entity.HasKey(e => e.IdDetalleRecepcion);
        });

        modelBuilder.Entity<MovimientoInventario>(entity =>
        {
            entity.ToTable("MovimientoInventario");
            entity.HasKey(e => e.IdMovimiento);
            entity.Property(e => e.TipoMovimiento).HasMaxLength(30).IsRequired();
            entity.Property(e => e.Referencia).HasMaxLength(50);
            entity.Property(e => e.Observacion).HasMaxLength(250);
        });
    }
}
