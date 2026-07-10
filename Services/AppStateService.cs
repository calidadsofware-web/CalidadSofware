using System.Globalization;
using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public class AppStateService : IAppStateService
{
    private readonly object syncRoot = new();
    private readonly List<ProductState> products =
    [
        new("PROD-001", "Funda iPhone 14", "Funda protectora de silicona", "Protectores", "Apple", 120, 15, 25.00m),
        new("PROD-002", "Cargador USB-C 20W", "Cargador rapido para carga diaria", "Cargadores", "Generico", 85, 10, 30.00m),
        new("PROD-003", "Audifonos Bluetooth", "Audifonos inalambricos", "Audio", "Generico", 60, 8, 45.00m),
        new("PROD-004", "Mica templada 9H", "Mica de vidrio templado", "Protectores", "Samsung", 150, 20, 12.00m),
        new("PROD-005", "Power Bank 10000mAh", "Bateria portatil", "Energia", "Generico", 7, 10, 65.00m),
        new("PROD-006", "Cable Lightning 1m", "Cable de carga Lightning", "Cables", "Apple", 200, 25, 15.00m)
    ];

    private readonly List<ClientRowViewModel> clients =
    [
        new("45678912", "Maria Torres", "987654321", "maria.torres@mail.com", "B001-000124", "Activo"),
        new("71234567", "Luis Herrera", "976543210", "luis.herrera@mail.com", "F001-000088", "Activo"),
        new("70011223", "Camila Rojas", "965432109", "camila.rojas@mail.com", "B001-000122", "Observado"),
        new("43098765", "Jorge Salas", "954321098", "jorge.salas@mail.com", "B001-000118", "Activo")
    ];

    private readonly List<SupplierRowViewModel> suppliers =
    [
        new("20123456789", "Tecnologia Peru S.A.C.", "Rosa Medina", "014478899", "ventas@tecnologiaperu.com", "Activo"),
        new("20555111222", "CompuSolutions S.A.C.", "Carlos Paredes", "016632211", "contacto@compusolutions.com", "Activo"),
        new("20666777888", "Importaciones Movil E.I.R.L.", "Lucia Vargas", "017771122", "logistica@importmovil.com", "Activo")
    ];

    private readonly List<PurchaseRequestState> purchaseRequests =
    [
        new("SC-2026-0007", "Tecnologia Peru S.A.C.", DateTime.Today, "Pendiente", "Asistente de Compras", 680.00m),
        new("SC-2026-0006", "CompuSolutions S.A.C.", DateTime.Today.AddDays(-2), "Aprobada", "Administrador", 1240.00m),
        new("SC-2026-0005", "Importaciones Movil E.I.R.L.", DateTime.Today.AddDays(-5), "Recibida", "Almacen", 920.00m)
    ];

    private readonly List<PaymentState> payments =
    [
        new("B001-000124", "Maria Torres", DateTime.Today, "Yape", "Pagado", 89.90m),
        new("F001-000088", "Luis Herrera", DateTime.Today, "Tarjeta", "Pagado", 145.00m),
        new("B001-000122", "Camila Rojas", DateTime.Today.AddDays(-1), "Efectivo", "Observado", 65.00m),
        new("B001-000118", "Jorge Salas", DateTime.Today.AddDays(-1), "Transferencia", "Pagado", 120.00m)
    ];

    private int receiptSequence = 125;
    private int purchaseRequestSequence = 8;
    private int openClaims = 3;

    public DashboardViewModel GetDashboard()
    {
        lock (syncRoot)
        {
            return new DashboardViewModel
            {
                Metrics = BuildMetrics(),
                LowStockProducts = products
                    .Where(product => product.Stock <= product.MinStock)
                    .OrderBy(product => product.Stock)
                    .Select(ToProductRow)
                    .ToList(),
                PurchaseRequests = purchaseRequests
                    .OrderByDescending(request => request.CreatedAt)
                    .Take(5)
                    .Select(ToPurchaseRequestRow)
                    .ToList(),
                Payments = payments
                    .OrderByDescending(payment => payment.Date)
                    .Take(5)
                    .Select(ToPaymentRow)
                    .ToList()
            };
        }
    }

    public UseCasePageViewModel BuildPage(string section, string title, string eyebrow, string description)
    {
        lock (syncRoot)
        {
            return new UseCasePageViewModel
            {
                Section = section,
                Title = title,
                Eyebrow = eyebrow,
                Description = description,
                Metrics = BuildMetrics(),
                Products = products.Select(ToProductRow).ToList(),
                Clients = clients.ToList(),
                Suppliers = suppliers.ToList(),
                PurchaseRequests = purchaseRequests.OrderByDescending(request => request.CreatedAt).Select(ToPurchaseRequestRow).ToList(),
                Payments = payments.OrderByDescending(payment => payment.Date).Select(ToPaymentRow).ToList()
            };
        }
    }

    public void RegisterCdp(IFormCollection form, string userName)
    {
        lock (syncRoot)
        {
            var selectedProducts = form.Keys
                .Where(key => key.StartsWith("qty_", StringComparison.OrdinalIgnoreCase))
                .Select(key => key[4..])
                .Select(code => products.FirstOrDefault(product => product.Code.Equals(code, StringComparison.OrdinalIgnoreCase)))
                .Where(product => product is not null)
                .Cast<ProductState>()
                .ToList();

            if (selectedProducts.Count == 0)
            {
                selectedProducts = products.Take(3).ToList();
            }
            var total = 0m;

            foreach (var product in selectedProducts)
            {
                var quantity = Math.Max(1, ReadInt(form, $"qty_{product.Code}", 1));
                product.Stock = Math.Max(0, product.Stock - quantity);
                total += product.Price * quantity;
            }

            var client = ReadString(form, "cliente", "Cliente venta rapida");
            var method = ReadString(form, "metodoPago", "Efectivo");
            var document = ReadString(form, "tipoCdp", "Boleta").Equals("Factura", StringComparison.OrdinalIgnoreCase)
                ? $"F001-{receiptSequence:000000}"
                : $"B001-{receiptSequence:000000}";

            receiptSequence++;
            payments.Insert(0, new PaymentState(document, client, DateTime.Today, method, "Pagado", total));
        }
    }

    public void RegisterProductEntry(IFormCollection form, string userName)
    {
        lock (syncRoot)
        {
            foreach (var product in products.Where(product => product.Stock <= product.MinStock + 10).Take(3))
            {
                var received = Math.Max(1, ReadInt(form, $"received_{product.Code}", 20));
                product.Stock += received;
            }
        }
    }

    public void RegisterPurchaseRequest(IFormCollection form, string userName)
    {
        lock (syncRoot)
        {
            var supplier = ReadString(form, "proveedor", suppliers.First().BusinessName);
            var estimatedTotal = products.OrderBy(product => product.Stock).Take(3).Sum(product => product.Price * 20);
            purchaseRequests.Insert(0, new PurchaseRequestState($"SC-2026-{purchaseRequestSequence:0000}", supplier, DateTime.Today, "Pendiente", userName, estimatedTotal));
            purchaseRequestSequence++;
        }
    }

    public void RegisterCustomerClaim(IFormCollection form, string userName)
    {
        lock (syncRoot)
        {
            openClaims++;
        }
    }

    public void RegisterQuotationRequest(IFormCollection form, string userName)
    {
    }

    private IReadOnlyList<SummaryMetricViewModel> BuildMetrics()
    {
        var salesToday = payments.Where(payment => payment.Date.Date == DateTime.Today).Sum(payment => payment.Total);
        var receiptsToday = payments.Count(payment => payment.Date.Date == DateTime.Today);
        var lowStockCount = products.Count(product => product.Stock <= product.MinStock);
        var pendingPurchases = purchaseRequests.Count(request => request.Status.Equals("Pendiente", StringComparison.OrdinalIgnoreCase));

        return
        [
            new("Ventas del dia", FormatMoney(salesToday), $"{receiptsToday} comprobantes"),
            new("Solicitudes pendientes", pendingPurchases.ToString(CultureInfo.InvariantCulture), "compras por aprobar"),
            new("Stock bajo", lowStockCount.ToString(CultureInfo.InvariantCulture), "productos bajo minimo"),
            new("Reclamos abiertos", openClaims.ToString(CultureInfo.InvariantCulture), "en seguimiento")
        ];
    }

    private static ProductRowViewModel ToProductRow(ProductState product)
    {
        return new ProductRowViewModel(product.Code, product.Name, product.Description, product.Category, product.Brand, product.Stock, product.MinStock, product.Price);
    }

    private static PurchaseRequestRowViewModel ToPurchaseRequestRow(PurchaseRequestState request)
    {
        return new PurchaseRequestRowViewModel(
            request.Number,
            request.Supplier,
            request.CreatedAt.ToString("dd/MM/yyyy"),
            request.Status,
            request.RequestedBy,
            request.EstimatedTotal);
    }

    private static PaymentReportRowViewModel ToPaymentRow(PaymentState payment)
    {
        return new PaymentReportRowViewModel(
            payment.Document,
            payment.Client,
            payment.Date.ToString("dd/MM/yyyy"),
            payment.Method,
            payment.Status,
            payment.Total);
    }

    private static int ReadInt(IFormCollection form, string key, int fallback)
    {
        return int.TryParse(form[key], out var value) ? value : fallback;
    }

    private static string ReadString(IFormCollection form, string key, string fallback)
    {
        return string.IsNullOrWhiteSpace(form[key]) ? fallback : form[key].ToString();
    }

    private static string FormatMoney(decimal value)
    {
        return $"S/. {value:N2}";
    }

    private sealed class ProductState(string code, string name, string description, string category, string brand, int stock, int minStock, decimal price)
    {
        public string Code { get; } = code;
        public string Name { get; } = name;
        public string Description { get; } = description;
        public string Category { get; } = category;
        public string Brand { get; } = brand;
        public int Stock { get; set; } = stock;
        public int MinStock { get; } = minStock;
        public decimal Price { get; } = price;
    }

    private sealed record PurchaseRequestState(string Number, string Supplier, DateTime CreatedAt, string Status, string RequestedBy, decimal EstimatedTotal);
    private sealed record PaymentState(string Document, string Client, DateTime Date, string Method, string Status, decimal Total);
}
