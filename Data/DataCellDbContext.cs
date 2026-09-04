using Microsoft.EntityFrameworkCore;
using Pagina_Web.Data.Entities;

namespace Pagina_Web.Data;

public sealed class DataCellDbContext(DbContextOptions<DataCellDbContext> options) : DbContext(options)
{
    public const string Schema = "public";

    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Marca> Marcas => Set<Marca>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<DetalleVenta> DetallesVenta => Set<DetalleVenta>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<ReclamoCliente> ReclamosCliente => Set<ReclamoCliente>();
    public DbSet<SolicitudCompra> SolicitudesCompra => Set<SolicitudCompra>();
    public DbSet<DetalleSolicitudCompra> DetallesSolicitudCompra => Set<DetalleSolicitudCompra>();
    public DbSet<SolicitudCotizacion> SolicitudesCotizacion => Set<SolicitudCotizacion>();
    public DbSet<DetalleSolicitudCotizacion> DetallesSolicitudCotizacion => Set<DetalleSolicitudCotizacion>();
    public DbSet<SolicitudCotizacionProveedor> SolicitudesCotizacionProveedores => Set<SolicitudCotizacionProveedor>();
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<DetalleCompra> DetallesCompra => Set<DetalleCompra>();
    public DbSet<Recepcion> Recepciones => Set<Recepcion>();
    public DbSet<DetalleRecepcion> DetallesRecepcion => Set<DetalleRecepcion>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        if (Database.IsNpgsql())
        {
            modelBuilder.HasDefaultSchema(Schema);
        }
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DataCellDbContext).Assembly);
    }
}
