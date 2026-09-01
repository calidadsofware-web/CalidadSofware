using System.Globalization;
using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public class AppStateService : IAppStateService
{
    private const decimal IgvRate = 0.18m;
    private const int MaximumOperationQuantity = 10_000;

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

    private readonly List<QuotationRequestState> quotationRequests = [];

    private int receiptSequence = 125;
    private int purchaseRequestSequence = 8;
    private int quotationRequestSequence = 8;
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
                QuotationRequests = quotationRequests.OrderByDescending(request => request.CreatedAt).Select(ToQuotationRequestRow).ToList(),
                Payments = payments.OrderByDescending(payment => payment.Date).Select(ToPaymentRow).ToList()
            };
        }
    }

    public OperationResult RegisterCdp(IFormCollection form)
    {
        lock (syncRoot)
        {
            var requestedProducts = ReadProductQuantities(form, "qty_");
            if (requestedProducts.Count == 0)
            {
                return new OperationResult(false, "Agregue al menos un producto antes de generar el CDP.");
            }

            var subtotal = 0m;
            var adjustedQuantity = false;

            foreach (var (product, requestedQuantity) in requestedProducts)
            {
                var quantity = Math.Min(requestedQuantity, product.Stock);
                adjustedQuantity |= quantity != requestedQuantity;

                if (quantity == 0)
                {
                    continue;
                }

                product.Stock -= quantity;
                subtotal += product.Price * quantity;
            }

            if (subtotal == 0)
            {
                return new OperationResult(false, "No se pudo generar el CDP: los productos seleccionados no tienen stock disponible.");
            }

            var client = ReadString(form, "cliente", "Cliente venta rapida");
            var method = ReadOption(form, "metodoPago", "Efectivo", "Efectivo", "Tarjeta", "Yape", "Transferencia");
            var document = ReadOption(form, "tipoCdp", "Boleta", "Boleta", "Factura").Equals("Factura", StringComparison.OrdinalIgnoreCase)
                ? $"F001-{receiptSequence:000000}"
                : $"B001-{receiptSequence:000000}";

            receiptSequence++;
            payments.Insert(0, new PaymentState(document, client, DateTime.Today, method, "Pagado", CalculateTotal(subtotal)));

            var message = adjustedQuantity
                ? $"CDP {document} generado. Las cantidades se ajustaron al stock disponible."
                : $"CDP {document} generado correctamente. Ventas, pagos y stock fueron actualizados.";
            return new OperationResult(true, message);
        }
    }

    public OperationResult RegisterProductEntry(IFormCollection form)
    {
        lock (syncRoot)
        {
            var receivedProducts = ReadProductQuantities(form, "received_");
            if (receivedProducts.Count == 0)
            {
                return new OperationResult(false, "Agregue al menos un producto recibido antes de registrar el ingreso.");
            }

            foreach (var (product, received) in receivedProducts)
            {
                product.Stock += received;
            }

            return new OperationResult(true, "Ingreso registrado correctamente. El stock disponible fue actualizado.");
        }
    }

    public OperationResult RegisterPurchaseRequest(IFormCollection form, string userName)
    {
        lock (syncRoot)
        {
            var requestedProducts = ReadProductQuantities(form, "request_");
            if (requestedProducts.Count == 0)
            {
                return new OperationResult(false, "Agregue al menos un producto antes de guardar la solicitud de compra.");
            }

            var supplier = ReadString(form, "proveedor", suppliers.First().BusinessName);
            var estimatedTotal = requestedProducts.Sum(item => item.Product.Price * item.Quantity);
            purchaseRequests.Insert(0, new PurchaseRequestState($"SC-{DateTime.Today.Year}-{purchaseRequestSequence:0000}", supplier, DateTime.Today, "Pendiente", userName, estimatedTotal));
            purchaseRequestSequence++;
            return new OperationResult(true, "Solicitud de compra registrada y agregada al seguimiento.");
        }
    }

    public OperationResult RegisterCustomerClaim(IFormCollection form)
    {
        lock (syncRoot)
        {
            if (string.IsNullOrWhiteSpace(form["descripcion"]))
            {
                return new OperationResult(false, "Ingrese una descripcion para registrar el reclamo.");
            }

            openClaims++;
            return new OperationResult(true, "Reclamo registrado y agregado a la bandeja de seguimiento.");
        }
    }

    public OperationResult RegisterQuotationRequest(IFormCollection form, string userName)
    {
        lock (syncRoot)
        {
            var requestedProducts = ReadProductQuantities(form, "request_");
            if (requestedProducts.Count == 0)
            {
                return new OperationResult(false, "Agregue al menos un producto antes de enviar la solicitud de cotizacion.");
            }

            var selectedSuppliers = form["proveedor"]
                .Where(supplier => !string.IsNullOrWhiteSpace(supplier))
                .Select(supplier => supplier!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (selectedSuppliers.Count == 0)
            {
                return new OperationResult(false, "Seleccione al menos un proveedor antes de enviar la solicitud de cotizacion.");
            }

            foreach (var supplier in selectedSuppliers)
            {
                var requestNumber = $"SC-{DateTime.Today.Year}-{quotationRequestSequence:0000}";
                quotationRequests.Insert(0, new QuotationRequestState(requestNumber, supplier, DateTime.Today, userName, requestedProducts.Count));
                quotationRequestSequence++;
            }

            return new OperationResult(true, $"Se enviaron {selectedSuppliers.Count} solicitud(es) de cotizacion para {requestedProducts.Count} producto(s).");
        }
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

    private static QuotationRequestRowViewModel ToQuotationRequestRow(QuotationRequestState request)
    {
        return new QuotationRequestRowViewModel(
            request.Number,
            request.Supplier,
            request.CreatedAt.ToString("dd/MM/yyyy"),
            request.RequestedBy,
            request.ProductCount);
    }

    private static int ReadInt(IFormCollection form, string key, int fallback)
    {
        return int.TryParse(form[key], out var value) ? value : fallback;
    }

    private static string ReadString(IFormCollection form, string key, string fallback)
    {
        return string.IsNullOrWhiteSpace(form[key]) ? fallback : form[key].ToString();
    }

    private List<(ProductState Product, int Quantity)> ReadProductQuantities(IFormCollection form, string prefix)
    {
        return form.Keys
            .Where(key => key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .Select(key => new
            {
                Product = products.FirstOrDefault(product => product.Code.Equals(key[prefix.Length..], StringComparison.OrdinalIgnoreCase)),
                Quantity = ReadInt(form, key, 0)
            })
            .Where(item => item.Product is not null && item.Quantity > 0)
            .Select(item => (item.Product!, Math.Min(item.Quantity, MaximumOperationQuantity)))
            .ToList();
    }

    private static string ReadOption(IFormCollection form, string key, string fallback, params string[] allowedValues)
    {
        var value = ReadString(form, key, fallback);
        return allowedValues.FirstOrDefault(option => option.Equals(value, StringComparison.OrdinalIgnoreCase)) ?? fallback;
    }

    private static decimal CalculateTotal(decimal subtotal) => subtotal * (1 + IgvRate);

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
    private sealed record QuotationRequestState(string Number, string Supplier, DateTime CreatedAt, string RequestedBy, int ProductCount);
    private sealed record PaymentState(string Document, string Client, DateTime Date, string Method, string Status, decimal Total);
}
