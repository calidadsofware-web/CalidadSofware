using System.Data;
using Microsoft.EntityFrameworkCore;
using Pagina_Web.Data;
using Pagina_Web.Data.Entities;
using Pagina_Web.Models.Requests;

namespace Pagina_Web.Services;

public sealed class DataCellCommandService(
    DataCellDbContext context,
    TimeProvider timeProvider,
    ILogger<DataCellCommandService> logger) : IDataCellCommandService
{
    private const decimal IgvRate = 0.18m;

    public async Task<OperationResult> RegisterCdpAsync(
        GenerateCdpRequest request,
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
        {
            return OperationResult.Failure("Agregue al menos un producto antes de generar el CDP.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            var products = await LoadProductsAsync(request.Items, cancellationToken);
            var user = await GetUserAsync(userEmail, cancellationToken);
            var client = await GetOrCreateClientAsync(request.ClientName, request.ClientDocument, cancellationToken);
            var sale = new Venta
            {
                Fecha = timeProvider.GetUtcNow(),
                Cliente = client,
                Usuario = user,
                TipoComprobante = request.ReceiptType,
                Serie = request.ReceiptType == "FACTURA" ? "F001" : "B001"
            };
            sale.Numero = await NextDocumentNumberAsync(
                context.Ventas.Where(item => item.Serie == sale.Serie).Select(item => item.Numero),
                string.Empty,
                8,
                cancellationToken);

            var adjustedQuantity = false;
            foreach (var item in request.Items)
            {
                if (!products.TryGetValue(item.ProductCode, out var product))
                {
                    continue;
                }

                var quantity = Math.Min(item.Quantity, product.Stock);
                adjustedQuantity |= quantity != item.Quantity;
                if (quantity == 0)
                {
                    continue;
                }

                var previousStock = product.Stock;
                product.Stock -= quantity;
                sale.Detalles.Add(new DetalleVenta
                {
                    Producto = product,
                    Cantidad = quantity,
                    PrecioUnitario = product.PrecioVenta
                });
                context.MovimientosInventario.Add(new MovimientoInventario
                {
                    Fecha = sale.Fecha,
                    Producto = product,
                    Venta = sale,
                    Usuario = user,
                    TipoMovimiento = "VENTA",
                    Cantidad = quantity,
                    StockAnterior = previousStock,
                    StockNuevo = product.Stock
                });
            }

            if (sale.Detalles.Count == 0)
            {
                return OperationResult.Failure("Los productos seleccionados no tienen stock disponible.");
            }

            sale.Subtotal = sale.Detalles.Sum(detail => detail.PrecioUnitario * detail.Cantidad);
            sale.Igv = decimal.Round(sale.Subtotal * IgvRate, 2, MidpointRounding.AwayFromZero);
            sale.Total = sale.Subtotal + sale.Igv;
            sale.Pagos.Add(new Pago
            {
                Fecha = sale.Fecha,
                Metodo = request.PaymentMethod,
                Estado = "PAGADO",
                Monto = sale.Total
            });

            context.Ventas.Add(sale);
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var document = $"{sale.Serie}-{sale.Numero}";
            return OperationResult.Success(adjustedQuantity
                ? $"CDP {document} generado; las cantidades se ajustaron al stock disponible."
                : $"CDP {document} generado correctamente. Venta, pago, inventario y trazabilidad fueron actualizados.");
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(exception, "Error al registrar un CDP para {UserEmail}.", userEmail);
            return OperationResult.Failure("No se pudo registrar el CDP. Revise los datos e intente nuevamente.");
        }
    }

    public async Task<OperationResult> RegisterProductEntryAsync(
        RegisterProductEntryRequest request,
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
        {
            return OperationResult.Failure("Agregue al menos un producto recibido antes de registrar el ingreso.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            var purchase = await context.Compras
                .AsSplitQuery()
                .Include(item => item.Detalles)
                .Include(item => item.Recepciones)
                    .ThenInclude(receipt => receipt.Detalles)
                .SingleOrDefaultAsync(item => item.Numero == request.PurchaseNumber, cancellationToken);

            if (purchase is null)
            {
                return OperationResult.Failure("La orden de compra indicada no existe.");
            }

            var products = await LoadProductsAsync(request.Items, cancellationToken);
            var user = await GetUserAsync(userEmail, cancellationToken);
            var receipt = new Recepcion
            {
                Fecha = request.EntryDate.HasValue
                    ? ToDateTimeOffset(request.EntryDate.Value)
                    : timeProvider.GetUtcNow(),
                Compra = purchase,
                Usuario = user,
                Guia = request.Guide,
                Observacion = request.Notes
            };
            var receiptPrefix = $"REC-{receipt.Fecha.Year}-";
            receipt.Numero = await NextDocumentNumberAsync(
                context.Recepciones.Select(item => item.Numero),
                receiptPrefix,
                4,
                cancellationToken);

            foreach (var item in request.Items)
            {
                if (!products.TryGetValue(item.ProductCode, out var product))
                {
                    continue;
                }

                var ordered = purchase.Detalles.SingleOrDefault(detail => detail.IdProducto == product.IdProducto)?.Cantidad ?? 0;
                var alreadyReceived = purchase.Recepciones.SelectMany(current => current.Detalles)
                    .Where(detail => detail.IdProducto == product.IdProducto)
                    .Sum(detail => detail.Cantidad);
                if (item.Quantity > ordered - alreadyReceived)
                {
                    return OperationResult.Failure($"La cantidad de {product.Nombre} supera el saldo pendiente de la compra.");
                }

                var previousStock = product.Stock;
                product.Stock += item.Quantity;
                receipt.Detalles.Add(new DetalleRecepcion
                {
                    Producto = product,
                    Cantidad = item.Quantity
                });
                receipt.Movimientos.Add(new MovimientoInventario
                {
                    Fecha = receipt.Fecha,
                    Producto = product,
                    Usuario = user,
                    TipoMovimiento = "COMPRA",
                    Cantidad = item.Quantity,
                    StockAnterior = previousStock,
                    StockNuevo = product.Stock
                });
            }

            if (receipt.Detalles.Count == 0)
            {
                return OperationResult.Failure("Ningún producto recibido pertenece a la orden de compra.");
            }

            context.Recepciones.Add(receipt);
            await context.SaveChangesAsync(cancellationToken);

            // EF agrega la nueva recepcion a la navegacion de Compra mediante relationship fixup.
            // No se vuelve a anexar: hacerlo duplicaria sus cantidades al determinar el estado.
            var receivedWithCurrent = purchase.Recepciones
                .SelectMany(current => current.Detalles)
                .GroupBy(detail => detail.IdProducto)
                .ToDictionary(group => group.Key, group => group.Sum(detail => detail.Cantidad));
            purchase.Estado = purchase.Detalles.All(detail =>
                receivedWithCurrent.GetValueOrDefault(detail.IdProducto) >= detail.Cantidad)
                ? "RECIBIDA"
                : "PARCIAL";

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return OperationResult.Success($"Ingreso {receipt.Numero} registrado. Stock y trazabilidad fueron actualizados.");
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(exception, "Error al registrar ingreso de productos para {UserEmail}.", userEmail);
            return OperationResult.Failure("No se pudo registrar el ingreso de productos.");
        }
    }

    public async Task<OperationResult> RegisterPurchaseRequestAsync(
        RegisterPurchaseRequest request,
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
        {
            return OperationResult.Failure("Agregue al menos un producto antes de guardar la solicitud.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            var products = await LoadProductsAsync(request.Items, cancellationToken);
            var user = await GetUserAsync(userEmail, cancellationToken);
            var supplier = string.IsNullOrWhiteSpace(request.SupplierName)
                ? null
                : await context.Proveedores.SingleOrDefaultAsync(item => item.RazonSocial == request.SupplierName, cancellationToken);
            var purchaseRequest = new SolicitudCompra
            {
                Fecha = timeProvider.GetUtcNow(),
                FechaRequerida = request.RequiredDate,
                Proveedor = supplier,
                Usuario = user,
                Prioridad = request.Priority,
                Observacion = request.Justification
            };
            var requestPrefix = $"SC-{purchaseRequest.Fecha.Year}-";
            purchaseRequest.Numero = await NextDocumentNumberAsync(
                context.SolicitudesCompra.Select(item => item.Numero),
                requestPrefix,
                4,
                cancellationToken);

            foreach (var item in request.Items)
            {
                if (products.TryGetValue(item.ProductCode, out var product))
                {
                    purchaseRequest.Detalles.Add(new DetalleSolicitudCompra
                    {
                        Producto = product,
                        Cantidad = item.Quantity
                    });
                    purchaseRequest.TotalEstimado += product.PrecioCompra * item.Quantity;
                }
            }

            if (purchaseRequest.Detalles.Count == 0)
            {
                return OperationResult.Failure("No se encontraron productos válidos para la solicitud.");
            }

            context.SolicitudesCompra.Add(purchaseRequest);
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return OperationResult.Success($"Solicitud {purchaseRequest.Numero} registrada y agregada al seguimiento.");
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(exception, "Error al registrar solicitud de compra para {UserEmail}.", userEmail);
            return OperationResult.Failure("No se pudo registrar la solicitud de compra.");
        }
    }

    public async Task<OperationResult> RegisterQuotationRequestAsync(
        RegisterQuotationRequest request,
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0 || request.SupplierNames.Count == 0)
        {
            return OperationResult.Failure("Seleccione al menos un producto y un proveedor.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            var products = await LoadProductsAsync(request.Items, cancellationToken);
            var suppliers = await context.Proveedores
                .Where(item => request.SupplierNames.Contains(item.RazonSocial))
                .ToListAsync(cancellationToken);
            var user = await GetUserAsync(userEmail, cancellationToken);
            if (suppliers.Count == 0)
            {
                return OperationResult.Failure("No se encontraron proveedores válidos.");
            }

            var quotation = new SolicitudCotizacion
            {
                Fecha = timeProvider.GetUtcNow(),
                FechaLimite = request.Deadline,
                Usuario = user,
                Observacion = request.Notes
            };
            var quotationPrefix = $"COT-{quotation.Fecha.Year}-";
            quotation.Numero = await NextDocumentNumberAsync(
                context.SolicitudesCotizacion.Select(item => item.Numero),
                quotationPrefix,
                4,
                cancellationToken);
            foreach (var supplier in suppliers)
            {
                quotation.Proveedores.Add(new SolicitudCotizacionProveedor { Proveedor = supplier });
            }
            foreach (var item in request.Items)
            {
                if (products.TryGetValue(item.ProductCode, out var product))
                {
                    quotation.Detalles.Add(new DetalleSolicitudCotizacion
                    {
                        Producto = product,
                        Cantidad = item.Quantity
                    });
                }
            }

            if (quotation.Detalles.Count == 0)
            {
                return OperationResult.Failure("No se encontraron productos válidos para cotizar.");
            }

            context.SolicitudesCotizacion.Add(quotation);
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return OperationResult.Success($"Solicitud {quotation.Numero} enviada a {suppliers.Count} proveedor(es).");
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(exception, "Error al registrar cotización para {UserEmail}.", userEmail);
            return OperationResult.Failure("No se pudo registrar la solicitud de cotización.");
        }
    }

    public async Task<OperationResult> RegisterCustomerClaimAsync(
        RegisterCustomerClaimRequest request,
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ClientName) || string.IsNullOrWhiteSpace(request.Description))
        {
            return OperationResult.Failure("Ingrese el cliente y la descripción del reclamo.");
        }

        try
        {
            var client = await context.Clientes.FirstOrDefaultAsync(
                item => item.Nombres + " " + (item.Apellidos ?? string.Empty) == request.ClientName,
                cancellationToken);
            if (client is null)
            {
                return OperationResult.Failure("El cliente indicado no existe.");
            }

            Venta? sale = null;
            if (!string.IsNullOrWhiteSpace(request.ReceiptNumber))
            {
                sale = await context.Ventas.FirstOrDefaultAsync(
                    item => item.Serie + "-" + item.Numero == request.ReceiptNumber,
                    cancellationToken);
            }

            var user = await GetUserAsync(userEmail, cancellationToken);
            context.ReclamosCliente.Add(new ReclamoCliente
            {
                Fecha = timeProvider.GetUtcNow(),
                Cliente = client,
                Venta = sale,
                Usuario = user,
                Motivo = request.Reason,
                Descripcion = request.Description,
                Canal = request.Channel,
                Prioridad = request.Priority
            });
            await context.SaveChangesAsync(cancellationToken);
            return OperationResult.Success("Reclamo registrado y agregado a la bandeja de seguimiento.");
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error al registrar reclamo para {UserEmail}.", userEmail);
            return OperationResult.Failure("No se pudo registrar el reclamo.");
        }
    }

    private async Task<Dictionary<string, Producto>> LoadProductsAsync(
        IReadOnlyList<OperationItemRequest> items,
        CancellationToken cancellationToken)
    {
        var codes = items.Select(item => item.ProductCode).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        return await context.Productos
            .Where(product => product.Estado == "ACTIVO" && codes.Contains(product.Codigo))
            .ToDictionaryAsync(product => product.Codigo, StringComparer.OrdinalIgnoreCase, cancellationToken);
    }

    private async Task<Usuario> GetUserAsync(string email, CancellationToken cancellationToken) =>
        await context.Usuarios.FirstAsync(
            user => user.Estado == "ACTIVO" && user.Correo == email,
            cancellationToken);

    private async Task<Cliente> GetOrCreateClientAsync(string name, string? document, CancellationToken cancellationToken)
    {
        var client = await context.Clientes.FirstOrDefaultAsync(
            item => (document != null && item.Documento == document)
                || item.Nombres + " " + (item.Apellidos ?? string.Empty) == name,
            cancellationToken);
        if (client is not null)
        {
            return client;
        }

        var parts = name.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        client = new Cliente
        {
            Nombres = parts.ElementAtOrDefault(0) ?? "Cliente",
            Apellidos = parts.ElementAtOrDefault(1),
            Documento = document,
            FechaRegistro = timeProvider.GetUtcNow()
        };
        context.Clientes.Add(client);
        return client;
    }

    private static async Task<string> NextDocumentNumberAsync(
        IQueryable<string?> numbers,
        string prefix,
        int width,
        CancellationToken cancellationToken)
    {
        var candidates = numbers.Where(number => number != null);
        if (prefix.Length > 0)
        {
            candidates = candidates.Where(number => number!.StartsWith(prefix));
        }

        var lastNumber = await candidates
            .OrderByDescending(number => number)
            .FirstOrDefaultAsync(cancellationToken);
        var suffix = lastNumber?[prefix.Length..];
        var nextValue = int.TryParse(suffix, out var currentValue) ? currentValue + 1 : 1;
        return $"{prefix}{nextValue.ToString($"D{width}")}";
    }

    private static DateTimeOffset ToDateTimeOffset(DateOnly date) =>
        new DateTimeOffset(
            date.ToDateTime(TimeOnly.MinValue),
            TimeZoneInfo.Local.GetUtcOffset(date.ToDateTime(TimeOnly.MinValue)))
        .ToUniversalTime();
}
