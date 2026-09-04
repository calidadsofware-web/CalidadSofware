using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pagina_Web.Data;
using Pagina_Web.Data.Entities;
using Pagina_Web.Security;

namespace Pagina_Web.Services;

public sealed class DatabaseInitializer(
    DataCellDbContext context,
    DatabaseRuntimeOptions runtimeOptions,
    IPasswordHasher<Usuario> passwordHasher,
    TimeProvider timeProvider,
    ILogger<DatabaseInitializer> logger) : IDatabaseInitializer
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        if (runtimeOptions.IsPostgreSql)
        {
            logger.LogInformation("Base PostgreSQL/Supabase configurada. El esquema se administra mediante supabase/migrations.");
            return;
        }

        await context.Database.EnsureCreatedAsync(cancellationToken);
        if (await context.Roles.AnyAsync(cancellationToken))
        {
            return;
        }

        await SeedLocalDevelopmentDataAsync(cancellationToken);
        logger.LogInformation("Base SQLite de desarrollo creada en {ConnectionString}.", runtimeOptions.ConnectionString);
    }

    private async Task SeedLocalDevelopmentDataAsync(CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var roles = new Dictionary<string, Rol>(StringComparer.Ordinal)
        {
            [AppRoles.Administrator] = new() { NombreRol = AppRoles.Administrator },
            [AppRoles.Cashier] = new() { NombreRol = AppRoles.Cashier },
            [AppRoles.Warehouse] = new() { NombreRol = AppRoles.Warehouse },
            [AppRoles.PurchasingAssistant] = new() { NombreRol = AppRoles.PurchasingAssistant }
        };
        context.Roles.AddRange(roles.Values);

        var users = new[]
        {
            CreateUser("Daniel Francisco", "Aguirre Espinoza", "daniel@datacell.local", "Daniel123!", roles[AppRoles.Administrator], now),
            CreateUser("Joel Alexander", "Diaz Gutierrez", "joel@datacell.local", "Joel123!", roles[AppRoles.PurchasingAssistant], now),
            CreateUser("Luis Fabricio", "Durand Durand", "luis@datacell.local", "Luis123!", roles[AppRoles.Warehouse], now),
            CreateUser("Stefano Jose", "Gomez Medina", "stefano@datacell.local", "Stefano123!", roles[AppRoles.Cashier], now),
            CreateUser("Gerardo Favian", "Palacios Bazan", "gerardo@datacell.local", "Gerardo123!", roles[AppRoles.Administrator], now)
        };
        context.Usuarios.AddRange(users);

        var categories = new Dictionary<string, Categoria>(StringComparer.Ordinal)
        {
            ["Protectores"] = new() { Nombre = "Protectores" },
            ["Cargadores"] = new() { Nombre = "Cargadores" },
            ["Audio"] = new() { Nombre = "Audio" },
            ["Energia"] = new() { Nombre = "Energia" },
            ["Cables"] = new() { Nombre = "Cables" }
        };
        var brands = new Dictionary<string, Marca>(StringComparer.Ordinal)
        {
            ["Apple"] = new() { Nombre = "Apple" },
            ["Samsung"] = new() { Nombre = "Samsung" },
            ["Generico"] = new() { Nombre = "Generico" }
        };
        context.Categorias.AddRange(categories.Values);
        context.Marcas.AddRange(brands.Values);

        var products = new[]
        {
            CreateProduct("PROD-001", null, "Funda iPhone 14", "Funda protectora de silicona", 14m, 25m, 120, 15, categories["Protectores"], brands["Apple"]),
            CreateProduct("PROD-002", null, "Cargador USB-C 20W", "Cargador rapido para carga diaria", 18m, 30m, 85, 10, categories["Cargadores"], brands["Generico"]),
            CreateProduct("PROD-003", null, "Audifonos Bluetooth", "Audifonos inalambricos", 28m, 45m, 60, 8, categories["Audio"], brands["Generico"]),
            CreateProduct("PROD-004", null, "Mica templada 9H", "Mica de vidrio templado", 5m, 12m, 150, 20, categories["Protectores"], brands["Samsung"]),
            CreateProduct("PROD-005", null, "Power Bank 10000mAh", "Bateria portatil", 45m, 65m, 7, 10, categories["Energia"], brands["Generico"]),
            CreateProduct("PROD-006", null, "Cable Lightning 1m", "Cable de carga Lightning", 8m, 15m, 200, 25, categories["Cables"], brands["Apple"]),
            CreateProduct("MYSQL-PROD-001", "7750001000012", "Cargador USB-C 25W", "Cargador rapido compatible", 35m, 59.90m, 20, 5, categories["Cargadores"], brands["Generico"]),
            CreateProduct("MYSQL-PROD-002", "7750001000029", "Mica templada Galaxy A55", "Protector de pantalla", 5m, 14.90m, 8, 10, categories["Protectores"], brands["Samsung"])
        };
        context.Productos.AddRange(products);

        var clients = new[]
        {
            CreateClient("Maria", "Torres", "45678912", "987654321", "maria.torres@mail.com", now),
            CreateClient("Luis", "Herrera", "71234567", "976543210", "luis.herrera@mail.com", now),
            CreateClient("Camila", "Rojas", "70011223", "965432109", "camila.rojas@mail.com", now),
            CreateClient("Jorge", "Salas", "43098765", "954321098", "jorge.salas@mail.com", now),
            CreateClient("Cliente", "Demo", "00000001", "900000001", "cliente@datacell.local", now, "Lima")
        };
        context.Clientes.AddRange(clients);

        var suppliers = new[]
        {
            CreateSupplier("20123456789", "Tecnologia Peru S.A.C.", "Rosa Medina", "014478899", "ventas@tecnologiaperu.com"),
            CreateSupplier("20555111222", "CompuSolutions S.A.C.", "Carlos Paredes", "016632211", "contacto@compusolutions.com"),
            CreateSupplier("20666777888", "Importaciones Movil E.I.R.L.", "Lucia Vargas", "017771122", "logistica@importmovil.com"),
            CreateSupplier("20999999991", "Proveedor Demo SAC", "Contacto Demo", "900000002", "proveedor@datacell.local", "Av. Tecnologia 123, Lima")
        };
        context.Proveedores.AddRange(suppliers);
        await context.SaveChangesAsync(cancellationToken);

        AddOperationalSeedData(now, users, products, clients, suppliers);
        await context.SaveChangesAsync(cancellationToken);
    }

    private void AddOperationalSeedData(
        DateTimeOffset now,
        IReadOnlyList<Usuario> users,
        IReadOnlyList<Producto> products,
        IReadOnlyList<Cliente> clients,
        IReadOnlyList<Proveedor> suppliers)
    {
        context.Ventas.AddRange(
            CreateSale("B001", "00000124", now, clients[0], users[3], "YAPE", 89.90m),
            CreateSale("F001", "00000088", now, clients[1], users[3], "TARJETA", 145m),
            CreateSale("B001", "00000122", now.AddDays(-1), clients[2], users[3], "EFECTIVO", 65m, "OBSERVADO"),
            CreateSale("B001", "00000118", now.AddDays(-1), clients[3], users[3], "TRANSFERENCIA", 120m));

        context.ReclamosCliente.AddRange(
            CreateClaim(clients[2], users[3], "Producto defectuoso", now.AddDays(-2)),
            CreateClaim(clients[0], users[3], "Cambio solicitado", now.AddDays(-4)),
            CreateClaim(clients[1], users[3], "Atencion recibida", now.AddDays(-6)));

        var requests = new[]
        {
            CreatePurchaseRequest("SC-2026-0007", now, "PENDIENTE", 680m, suppliers[0], users[1], products[4]),
            CreatePurchaseRequest("SC-2026-0006", now.AddDays(-2), "APROBADA", 1240m, suppliers[1], users[0], products[1]),
            CreatePurchaseRequest("SC-2026-0005", now.AddDays(-5), "ATENDIDA", 920m, suppliers[2], users[2], products[2])
        };
        context.SolicitudesCompra.AddRange(requests);

        context.Compras.AddRange(
            CreatePurchase("OC-2026-0006", now.AddDays(-2), suppliers[1], users[0], requests[1], products.Take(6).ToArray()),
            CreatePurchase("OC-2026-0005", now.AddDays(-5), suppliers[2], users[0], requests[2], products.Take(6).ToArray()));
    }

    private Usuario CreateUser(string names, string surnames, string email, string password, Rol role, DateTimeOffset now)
    {
        var user = new Usuario
        {
            Nombres = names,
            Apellidos = surnames,
            Correo = email,
            Rol = role,
            FechaRegistro = now
        };
        user.PasswordHash = passwordHasher.HashPassword(user, password);
        return user;
    }

    private static Producto CreateProduct(string code, string? barcode, string name, string description, decimal purchasePrice,
        decimal salePrice, int stock, int minStock, Categoria category, Marca brand) => new()
        {
            Codigo = code,
            CodigoBarras = barcode,
            Nombre = name,
            Descripcion = description,
            PrecioCompra = purchasePrice,
            PrecioVenta = salePrice,
            Stock = stock,
            StockMinimo = minStock,
            Categoria = category,
            Marca = brand
        };

    private static Cliente CreateClient(string names, string surnames, string document, string phone, string email,
        DateTimeOffset now, string? address = null) => new()
        {
            Nombres = names,
            Apellidos = surnames,
            Documento = document,
            Telefono = phone,
            Correo = email,
            Direccion = address,
            FechaRegistro = now
        };

    private static Proveedor CreateSupplier(string ruc, string name, string contact, string phone, string email,
        string? address = null) => new()
        {
            Ruc = ruc,
            RazonSocial = name,
            Contacto = contact,
            Telefono = phone,
            Correo = email,
            Direccion = address
        };

    private static Venta CreateSale(string series, string number, DateTimeOffset date, Cliente client, Usuario user,
        string method, decimal total, string paymentStatus = "PAGADO") => new()
        {
            Fecha = date,
            Cliente = client,
            Usuario = user,
            TipoComprobante = series.StartsWith('F') ? "FACTURA" : "BOLETA",
            Serie = series,
            Numero = number,
            Subtotal = decimal.Round(total / 1.18m, 2),
            Igv = total - decimal.Round(total / 1.18m, 2),
            Total = total,
            Pagos = [new Pago { Fecha = date, Metodo = method, Estado = paymentStatus, Monto = total }]
        };

    private static ReclamoCliente CreateClaim(Cliente client, Usuario user, string reason, DateTimeOffset date) => new()
    {
        Fecha = date,
        Cliente = client,
        Usuario = user,
        Motivo = reason,
        Descripcion = "Reclamo de demostracion para seguimiento.",
        Canal = "PRESENCIAL",
        Prioridad = "MEDIA"
    };

    private static SolicitudCompra CreatePurchaseRequest(string number, DateTimeOffset date, string status, decimal total,
        Proveedor supplier, Usuario user, Producto product) => new()
        {
            Numero = number,
            Fecha = date,
            Proveedor = supplier,
            Usuario = user,
            Estado = status,
            TotalEstimado = total,
            Detalles = [new DetalleSolicitudCompra { Producto = product, Cantidad = 20 }]
        };

    private static Compra CreatePurchase(string number, DateTimeOffset date, Proveedor supplier, Usuario user,
        SolicitudCompra request, IReadOnlyList<Producto> products)
    {
        var details = products.Select(product => new DetalleCompra
        {
            Producto = product,
            Cantidad = 50,
            PrecioCompra = product.PrecioCompra
        }).ToArray();
        var subtotal = details.Sum(detail => detail.PrecioCompra * detail.Cantidad);
        var igv = decimal.Round(subtotal * 0.18m, 2);
        return new Compra
        {
            Numero = number,
            Fecha = date,
            Proveedor = supplier,
            Usuario = user,
            SolicitudCompra = request,
            Subtotal = subtotal,
            Igv = igv,
            Total = subtotal + igv,
            Detalles = details
        };
    }
}
