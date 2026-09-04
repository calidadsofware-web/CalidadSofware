namespace Pagina_Web.Data.Entities;

public sealed class Venta
{
    public int IdVenta { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public int IdCliente { get; set; }
    public Cliente Cliente { get; set; } = null!;
    public int IdUsuario { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string TipoComprobante { get; set; } = "BOLETA";
    public string Serie { get; set; } = string.Empty;
    public string? Numero { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Igv { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = "REGISTRADA";
    public string? Observacion { get; set; }
    public ICollection<DetalleVenta> Detalles { get; set; } = [];
    public ICollection<Pago> Pagos { get; set; } = [];
    public ICollection<ReclamoCliente> Reclamos { get; set; } = [];
}

public sealed class DetalleVenta
{
    public int IdDetalleVenta { get; set; }
    public int IdVenta { get; set; }
    public Venta Venta { get; set; } = null!;
    public int IdProducto { get; set; }
    public Producto Producto { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}

public sealed class Pago
{
    public int IdPago { get; set; }
    public int IdVenta { get; set; }
    public Venta Venta { get; set; } = null!;
    public DateTimeOffset Fecha { get; set; }
    public string Metodo { get; set; } = "EFECTIVO";
    public string Estado { get; set; } = "PAGADO";
    public decimal Monto { get; set; }
    public string? Referencia { get; set; }
}

public sealed class ReclamoCliente
{
    public int IdReclamo { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public int IdCliente { get; set; }
    public Cliente Cliente { get; set; } = null!;
    public int? IdVenta { get; set; }
    public Venta? Venta { get; set; }
    public int? IdProducto { get; set; }
    public Producto? Producto { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Canal { get; set; } = "PRESENCIAL";
    public string Prioridad { get; set; } = "MEDIA";
    public string Estado { get; set; } = "REGISTRADO";
    public int IdUsuario { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string? Observacion { get; set; }
}
