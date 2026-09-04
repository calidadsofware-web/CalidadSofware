namespace Pagina_Web.Data.Entities;

public sealed class SolicitudCompra
{
    public int IdSolicitudCompra { get; set; }
    public string? Numero { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public DateOnly? FechaRequerida { get; set; }
    public int? IdProveedor { get; set; }
    public Proveedor? Proveedor { get; set; }
    public int IdUsuario { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string Prioridad { get; set; } = "MEDIA";
    public string Estado { get; set; } = "PENDIENTE";
    public decimal TotalEstimado { get; set; }
    public string? Observacion { get; set; }
    public ICollection<DetalleSolicitudCompra> Detalles { get; set; } = [];
    public ICollection<Compra> Compras { get; set; } = [];
}

public sealed class DetalleSolicitudCompra
{
    public int IdDetalleSolicitud { get; set; }
    public int IdSolicitudCompra { get; set; }
    public SolicitudCompra SolicitudCompra { get; set; } = null!;
    public int IdProducto { get; set; }
    public Producto Producto { get; set; } = null!;
    public int Cantidad { get; set; }
}

public sealed class SolicitudCotizacion
{
    public int IdSolicitudCotizacion { get; set; }
    public string? Numero { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public DateOnly? FechaLimite { get; set; }
    public int IdUsuario { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string Estado { get; set; } = "PENDIENTE";
    public string? Observacion { get; set; }
    public ICollection<DetalleSolicitudCotizacion> Detalles { get; set; } = [];
    public ICollection<SolicitudCotizacionProveedor> Proveedores { get; set; } = [];
}

public sealed class DetalleSolicitudCotizacion
{
    public int IdDetalleCotizacion { get; set; }
    public int IdSolicitudCotizacion { get; set; }
    public SolicitudCotizacion SolicitudCotizacion { get; set; } = null!;
    public int IdProducto { get; set; }
    public Producto Producto { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal? PrecioUnitario { get; set; }
}

public sealed class SolicitudCotizacionProveedor
{
    public int IdSolicitudCotizacion { get; set; }
    public SolicitudCotizacion SolicitudCotizacion { get; set; } = null!;
    public int IdProveedor { get; set; }
    public Proveedor Proveedor { get; set; } = null!;
    public DateTimeOffset? FechaRespuesta { get; set; }
    public string Estado { get; set; } = "PENDIENTE";
}

public sealed class Compra
{
    public int IdCompra { get; set; }
    public string? Numero { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public int IdProveedor { get; set; }
    public Proveedor Proveedor { get; set; } = null!;
    public int IdUsuario { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public int? IdSolicitudCompra { get; set; }
    public SolicitudCompra? SolicitudCompra { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Igv { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = "PENDIENTE";
    public string? Observacion { get; set; }
    public ICollection<DetalleCompra> Detalles { get; set; } = [];
    public ICollection<Recepcion> Recepciones { get; set; } = [];
}

public sealed class DetalleCompra
{
    public int IdDetalleCompra { get; set; }
    public int IdCompra { get; set; }
    public Compra Compra { get; set; } = null!;
    public int IdProducto { get; set; }
    public Producto Producto { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioCompra { get; set; }
}

public sealed class Recepcion
{
    public int IdRecepcion { get; set; }
    public string? Numero { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public int IdCompra { get; set; }
    public Compra Compra { get; set; } = null!;
    public int IdUsuario { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string? Guia { get; set; }
    public string? Observacion { get; set; }
    public ICollection<DetalleRecepcion> Detalles { get; set; } = [];
    public ICollection<MovimientoInventario> Movimientos { get; set; } = [];
}

public sealed class DetalleRecepcion
{
    public int IdDetalleRecepcion { get; set; }
    public int IdRecepcion { get; set; }
    public Recepcion Recepcion { get; set; } = null!;
    public int IdProducto { get; set; }
    public Producto Producto { get; set; } = null!;
    public int Cantidad { get; set; }
}

public sealed class MovimientoInventario
{
    public int IdMovimiento { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public int IdProducto { get; set; }
    public Producto Producto { get; set; } = null!;
    public string TipoMovimiento { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public int StockAnterior { get; set; }
    public int StockNuevo { get; set; }
    public int? IdVenta { get; set; }
    public Venta? Venta { get; set; }
    public int? IdRecepcion { get; set; }
    public Recepcion? Recepcion { get; set; }
    public string? Observacion { get; set; }
    public int IdUsuario { get; set; }
    public Usuario Usuario { get; set; } = null!;
}
