using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Pagina_Web.Data;
using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public sealed class DataCellQueryService(
    DataCellDbContext context,
    DatabaseRuntimeOptions runtimeOptions,
    TimeProvider timeProvider) : IDataCellQueryService
{
    private static readonly CultureInfo PeruvianCulture = CultureInfo.GetCultureInfo("es-PE");

    public async Task<DashboardViewModel> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        return new DashboardViewModel
        {
            Metrics = await GetMetricsAsync(cancellationToken),
            LowStockProducts = await GetProductsQuery(lowStockOnly: true, orderByStock: true)
                .Take(10)
                .ToListAsync(cancellationToken),
            PurchaseRequests = await GetPurchaseRequestsAsync(5, cancellationToken),
            Payments = await GetPaymentsAsync(5, cancellationToken)
        };
    }

    public async Task<UseCasePageViewModel> BuildPageAsync(
        string section,
        string title,
        string eyebrow,
        string description,
        UseCaseData requiredData,
        CancellationToken cancellationToken = default)
    {
        var page = new UseCasePageViewModel
        {
            Section = section,
            Title = title,
            Eyebrow = eyebrow,
            Description = description,
            Metrics = await GetMetricsAsync(cancellationToken)
        };

        if (requiredData.HasFlag(UseCaseData.Products))
        {
            page.Products = await GetProductsQuery(orderByName: true).ToListAsync(cancellationToken);
        }

        if (requiredData.HasFlag(UseCaseData.Clients))
        {
            page.Clients = await GetClientsAsync(cancellationToken);
        }

        if (requiredData.HasFlag(UseCaseData.Suppliers))
        {
            page.Suppliers = await GetSuppliersAsync(cancellationToken);
        }

        if (requiredData.HasFlag(UseCaseData.PurchaseRequests))
        {
            page.PurchaseRequests = await GetPurchaseRequestsAsync(null, cancellationToken);
        }

        if (requiredData.HasFlag(UseCaseData.QuotationRequests))
        {
            page.QuotationRequests = await GetQuotationRequestsAsync(cancellationToken);
        }

        if (requiredData.HasFlag(UseCaseData.Payments))
        {
            page.Payments = await GetPaymentsAsync(null, cancellationToken);
        }

        return page;
    }

    private IQueryable<ProductRowViewModel> GetProductsQuery(
        bool lowStockOnly = false,
        bool orderByStock = false,
        bool orderByName = false)
    {
        IQueryable<Pagina_Web.Data.Entities.Producto> query = context.Productos
            .AsNoTracking()
            .Where(product => product.Estado == "ACTIVO");
        if (lowStockOnly)
        {
            query = query.Where(product => product.Stock <= product.StockMinimo);
        }
        if (orderByStock)
        {
            query = query.OrderBy(product => product.Stock);
        }
        else if (orderByName)
        {
            query = query.OrderBy(product => product.Nombre);
        }

        return query.Select(product => new ProductRowViewModel(
                product.Codigo,
                product.Nombre,
                product.Descripcion ?? string.Empty,
                product.Categoria.Nombre,
                product.Marca.Nombre,
                product.Stock,
                product.StockMinimo,
                product.PrecioVenta));
    }

    private async Task<IReadOnlyList<ClientRowViewModel>> GetClientsAsync(CancellationToken cancellationToken)
    {
        if (!runtimeOptions.IsPostgreSql)
        {
            var localClients = await context.Clientes.AsNoTracking()
                .Include(client => client.Ventas)
                .Where(client => client.Estado == "ACTIVO")
                .ToListAsync(cancellationToken);
            return localClients.OrderBy(client => client.Nombres).Select(client => new ClientRowViewModel(
                client.Documento ?? "-",
                $"{client.Nombres} {client.Apellidos}".Trim(),
                client.Telefono ?? "-",
                client.Correo ?? "-",
                client.Ventas.Where(sale => sale.Estado == "REGISTRADA" && sale.Numero != null)
                    .OrderByDescending(sale => sale.Fecha)
                    .Select(sale => $"{sale.Serie}-{sale.Numero}")
                    .FirstOrDefault() ?? "Sin compras",
                ToTitleCase(client.Estado))).ToArray();
        }

        var clients = await context.Clientes
            .AsNoTracking()
            .Where(client => client.Estado == "ACTIVO")
            .OrderBy(client => client.Nombres)
            .Select(client => new
            {
                client.Documento,
                client.Nombres,
                client.Apellidos,
                client.Telefono,
                client.Correo,
                client.Estado,
                LastReceipt = client.Ventas
                    .Where(sale => sale.Estado == "REGISTRADA" && sale.Numero != null)
                    .OrderByDescending(sale => sale.Fecha)
                    .Select(sale => sale.Serie + "-" + sale.Numero)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return clients.Select(client => new ClientRowViewModel(
            client.Documento ?? "-",
            string.Join(' ', new[] { client.Nombres, client.Apellidos }.Where(value => !string.IsNullOrWhiteSpace(value))),
            client.Telefono ?? "-",
            client.Correo ?? "-",
            client.LastReceipt ?? "Sin compras",
            ToTitleCase(client.Estado))).ToArray();
    }

    private async Task<IReadOnlyList<SupplierRowViewModel>> GetSuppliersAsync(CancellationToken cancellationToken) =>
        await context.Proveedores
            .AsNoTracking()
            .Where(supplier => supplier.Estado == "ACTIVO")
            .OrderBy(supplier => supplier.RazonSocial)
            .Select(supplier => new SupplierRowViewModel(
                supplier.Ruc,
                supplier.RazonSocial,
                supplier.Contacto ?? "-",
                supplier.Telefono ?? "-",
                supplier.Correo ?? "-",
                "Activo"))
            .ToListAsync(cancellationToken);

    private async Task<IReadOnlyList<PurchaseRequestRowViewModel>> GetPurchaseRequestsAsync(int? limit, CancellationToken cancellationToken)
    {
        var query = context.SolicitudesCompra
            .AsNoTracking()
            .Include(request => request.Proveedor)
            .Include(request => request.Usuario)
            .AsQueryable();

        List<Pagina_Web.Data.Entities.SolicitudCompra> requests;
        if (runtimeOptions.IsPostgreSql)
        {
            query = query.OrderByDescending(request => request.Fecha);
            requests = await (limit.HasValue ? query.Take(limit.Value) : query).ToListAsync(cancellationToken);
        }
        else
        {
            requests = await query.ToListAsync(cancellationToken);
            requests = requests.OrderByDescending(request => request.Fecha)
                .Take(limit ?? int.MaxValue)
                .ToList();
        }
        return requests.Select(request => new PurchaseRequestRowViewModel(
            request.Numero ?? $"SC-{request.IdSolicitudCompra}",
            request.Proveedor?.RazonSocial ?? "Por definir",
            request.Fecha.ToLocalTime().ToString("dd/MM/yyyy"),
            ToTitleCase(request.Estado),
            $"{request.Usuario.Nombres} {request.Usuario.Apellidos}",
            request.TotalEstimado)).ToArray();
    }

    private async Task<IReadOnlyList<QuotationRequestRowViewModel>> GetQuotationRequestsAsync(CancellationToken cancellationToken)
    {
        var query = context.SolicitudesCotizacion
            .AsNoTracking()
            .AsSplitQuery()
            .Include(request => request.Usuario)
            .Include(request => request.Proveedores)
                .ThenInclude(link => link.Proveedor)
            .Include(request => request.Detalles)
            .AsQueryable();
        var requests = runtimeOptions.IsPostgreSql
            ? await query.OrderByDescending(request => request.Fecha).ToListAsync(cancellationToken)
            : (await query.ToListAsync(cancellationToken)).OrderByDescending(request => request.Fecha).ToList();

        return requests.Select(request => new QuotationRequestRowViewModel(
            request.Numero ?? $"COT-{request.IdSolicitudCotizacion}",
            string.Join(", ", request.Proveedores.Select(link => link.Proveedor.RazonSocial)),
            request.Fecha.ToLocalTime().ToString("dd/MM/yyyy"),
            $"{request.Usuario.Nombres} {request.Usuario.Apellidos}",
            request.Detalles.Count)).ToArray();
    }

    private async Task<IReadOnlyList<PaymentReportRowViewModel>> GetPaymentsAsync(int? limit, CancellationToken cancellationToken)
    {
        var query = context.Pagos
            .AsNoTracking()
            .Include(payment => payment.Venta)
                .ThenInclude(sale => sale.Cliente)
            .AsQueryable();

        List<Pagina_Web.Data.Entities.Pago> payments;
        if (runtimeOptions.IsPostgreSql)
        {
            query = query.OrderByDescending(payment => payment.Fecha);
            payments = await (limit.HasValue ? query.Take(limit.Value) : query).ToListAsync(cancellationToken);
        }
        else
        {
            payments = await query.ToListAsync(cancellationToken);
            payments = payments.OrderByDescending(payment => payment.Fecha)
                .Take(limit ?? int.MaxValue)
                .ToList();
        }
        return payments.Select(payment => new PaymentReportRowViewModel(
            $"{payment.Venta.Serie}-{payment.Venta.Numero}",
            $"{payment.Venta.Cliente.Nombres} {payment.Venta.Cliente.Apellidos}".Trim(),
            payment.Fecha.ToLocalTime().ToString("dd/MM/yyyy"),
            ToTitleCase(payment.Metodo),
            ToTitleCase(payment.Estado),
            payment.Monto)).ToArray();
    }

    private async Task<IReadOnlyList<SummaryMetricViewModel>> GetMetricsAsync(CancellationToken cancellationToken)
    {
        var now = timeProvider.GetLocalNow();
        var localStart = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, now.Offset);
        var start = localStart.ToUniversalTime();
        var end = localStart.AddDays(1).ToUniversalTime();
        decimal salesToday;
        int receiptsToday;
        if (runtimeOptions.IsPostgreSql)
        {
            salesToday = await context.Pagos
                .Where(payment => payment.Fecha >= start && payment.Fecha < end && payment.Estado == "PAGADO")
                .SumAsync(payment => (decimal?)payment.Monto, cancellationToken) ?? 0m;
            receiptsToday = await context.Ventas.CountAsync(
                sale => sale.Fecha >= start && sale.Fecha < end && sale.Estado == "REGISTRADA",
                cancellationToken);
        }
        else
        {
            var paid = await context.Pagos.AsNoTracking()
                .Where(payment => payment.Estado == "PAGADO")
                .Select(payment => new { payment.Fecha, payment.Monto })
                .ToListAsync(cancellationToken);
            salesToday = paid.Where(payment => payment.Fecha >= start && payment.Fecha < end).Sum(payment => payment.Monto);
            var sales = await context.Ventas.AsNoTracking()
                .Where(sale => sale.Estado == "REGISTRADA")
                .Select(sale => sale.Fecha)
                .ToListAsync(cancellationToken);
            receiptsToday = sales.Count(date => date >= start && date < end);
        }
        var pendingPurchases = await context.SolicitudesCompra.CountAsync(request => request.Estado == "PENDIENTE", cancellationToken);
        var lowStock = await context.Productos.CountAsync(product => product.Estado == "ACTIVO" && product.Stock <= product.StockMinimo, cancellationToken);
        var openClaims = await context.ReclamosCliente.CountAsync(claim => claim.Estado != "CERRADO", cancellationToken);

        return
        [
            new("Ventas del dia", salesToday.ToString("C", PeruvianCulture), $"{receiptsToday} comprobantes"),
            new("Solicitudes pendientes", pendingPurchases.ToString(PeruvianCulture), "compras por aprobar"),
            new("Stock bajo", lowStock.ToString(PeruvianCulture), "productos bajo minimo"),
            new("Reclamos abiertos", openClaims.ToString(PeruvianCulture), "en seguimiento")
        ];
    }

    private static string ToTitleCase(string value) =>
        CultureInfo.InvariantCulture.TextInfo.ToTitleCase(value.Replace('_', ' ').ToLowerInvariant());
}
