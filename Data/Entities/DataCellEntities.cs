namespace Pagina_Web.Data.Entities;

public class Rol
{
    public int IdRol { get; set; }
    public string NombreRol { get; set; } = string.Empty;
}

public class Usuario
{
    public int IdUsuario { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Estado { get; set; } = "ACTIVO";
    public DateTime FechaRegistro { get; set; }
    public int IdRol { get; set; }
}

public class Cliente
{
    public int IdCliente { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string? Apellidos { get; set; }
    public string? Documento { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string Estado { get; set; } = "ACTIVO";
    public DateTime FechaRegistro { get; set; }
}

public class Proveedor
{
    public int IdProveedor { get; set; }
    public string Ruc { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string? Contacto { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string Estado { get; set; } = "ACTIVO";
}

public class Categoria
{
    public int IdCategoria { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

public class Marca
{
    public int IdMarca { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

public class Producto
{
    public int IdProducto { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string? CodigoBarras { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal PrecioCompra { get; set; }
    public decimal PrecioVenta { get; set; }
    public int Stock { get; set; }
    public int StockMinimo { get; set; }
    public string Estado { get; set; } = "ACTIVO";
    public int IdCategoria { get; set; }
    public int IdMarca { get; set; }
}

public class Venta
{
    public int IdVenta { get; set; }
    public DateTime Fecha { get; set; }
    public int IdCliente { get; set; }
    public int IdUsuario { get; set; }
    public string TipoComprobante { get; set; } = "BOLETA";
    public string? Serie { get; set; }
    public string? Numero { get; set; }
    public string MetodoPago { get; set; } = "EFECTIVO";
    public string EstadoPago { get; set; } = "PAGADO";
    public decimal Subtotal { get; set; }
    public decimal Igv { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = "REGISTRADA";
    public string? Observacion { get; set; }
}

public class DetalleVenta
{
    public int IdDetalleVenta { get; set; }
    public int IdVenta { get; set; }
    public int IdProducto { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

public class ReclamoCliente
{
    public int IdReclamo { get; set; }
    public DateTime Fecha { get; set; }
    public int IdCliente { get; set; }
    public int? IdVenta { get; set; }
    public int? IdProducto { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = "REGISTRADO";
    public int IdUsuario { get; set; }
    public string? Observacion { get; set; }
}

public class Compra
{
    public int IdCompra { get; set; }
    public DateTime? Fecha { get; set; }
    public int IdProveedor { get; set; }
    public int IdUsuario { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Igv { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = "PENDIENTE";
    public string? Observacion { get; set; }
}

public class DetalleCompra
{
    public int IdDetalleCompra { get; set; }
    public int IdCompra { get; set; }
    public int IdProducto { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioCompra { get; set; }
    public decimal Subtotal { get; set; }
}

public class SolicitudCotizacion
{
    public int IdSolicitudCotizacion { get; set; }
    public DateTime? Fecha { get; set; }
    public int IdProveedor { get; set; }
    public int IdUsuario { get; set; }
    public string Estado { get; set; } = "PENDIENTE";
    public string? Observacion { get; set; }
}

public class DetalleSolicitudCotizacion
{
    public int IdDetalleCotizacion { get; set; }
    public int IdSolicitudCotizacion { get; set; }
    public int IdProducto { get; set; }
    public int Cantidad { get; set; }
    public decimal? PrecioUnitario { get; set; }
}

public class SolicitudCompra
{
    public int IdSolicitudCompra { get; set; }
    public DateTime? Fecha { get; set; }
    public int IdProveedor { get; set; }
    public int IdUsuario { get; set; }
    public string Estado { get; set; } = "PENDIENTE";
    public string? Observacion { get; set; }
}

public class DetalleSolicitudCompra
{
    public int IdDetalleSolicitud { get; set; }
    public int IdSolicitudCompra { get; set; }
    public int IdProducto { get; set; }
    public int Cantidad { get; set; }
}

public class Recepcion
{
    public int IdRecepcion { get; set; }
    public DateTime? Fecha { get; set; }
    public int IdCompra { get; set; }
    public string? Observacion { get; set; }
}

public class DetalleRecepcion
{
    public int IdDetalleRecepcion { get; set; }
    public int IdRecepcion { get; set; }
    public int IdProducto { get; set; }
    public int Cantidad { get; set; }
}

public class MovimientoInventario
{
    public int IdMovimiento { get; set; }
    public DateTime? Fecha { get; set; }
    public int IdProducto { get; set; }
    public string TipoMovimiento { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public int StockAnterior { get; set; }
    public int StockNuevo { get; set; }
    public string? Referencia { get; set; }
    public string? Observacion { get; set; }
    public int IdUsuario { get; set; }
}
