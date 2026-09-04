namespace Pagina_Web.Data.Entities;

public sealed class Cliente
{
    public int IdCliente { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string? Apellidos { get; set; }
    public string? Documento { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string Estado { get; set; } = "ACTIVO";
    public DateTimeOffset FechaRegistro { get; set; }
    public ICollection<Venta> Ventas { get; set; } = [];
    public ICollection<ReclamoCliente> Reclamos { get; set; } = [];
}

public sealed class Proveedor
{
    public int IdProveedor { get; set; }
    public string Ruc { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string? Contacto { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string Estado { get; set; } = "ACTIVO";
    public ICollection<Compra> Compras { get; set; } = [];
    public ICollection<SolicitudCompra> SolicitudesCompra { get; set; } = [];
    public ICollection<SolicitudCotizacionProveedor> SolicitudesCotizacion { get; set; } = [];
}

public sealed class Categoria
{
    public int IdCategoria { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public ICollection<Producto> Productos { get; set; } = [];
}

public sealed class Marca
{
    public int IdMarca { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public ICollection<Producto> Productos { get; set; } = [];
}

public sealed class Producto
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
    public Categoria Categoria { get; set; } = null!;
    public int IdMarca { get; set; }
    public Marca Marca { get; set; } = null!;
}
