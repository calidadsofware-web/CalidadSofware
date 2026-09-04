using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pagina_Web.Controllers.Mapping;
using Pagina_Web.Security;
using Pagina_Web.Services;

namespace Pagina_Web.Controllers;

[Authorize]
public sealed class CasosUsoController(
    IDataCellQueryService queryService,
    IDataCellCommandService commandService) : Controller
{
    [Authorize(Policy = AppPolicies.Sales)]
    public Task<IActionResult> GenerarCdp(CancellationToken cancellationToken) =>
        PageAsync("Ventas", "Generar comprobante de pago", "Venta y cobranza",
            "Confirma al cliente y los productos; el sistema calcula el total, registra el pago y descuenta el inventario.",
            UseCaseData.Products | UseCaseData.Clients, cancellationToken);

    [HttpPost, ValidateAntiForgeryToken, Authorize(Policy = AppPolicies.Sales)]
    public async Task<IActionResult> GenerarCdp(IFormCollection form, CancellationToken cancellationToken) =>
        RedirectWithMessage(
            await commandService.RegisterCdpAsync(UseCaseRequestMapper.ToSale(form), CurrentUserEmail, cancellationToken),
            nameof(GenerarCdp));

    [Authorize(Policy = AppPolicies.Warehouse)]
    public Task<IActionResult> RegistrarIngresoProductos(CancellationToken cancellationToken) =>
        PageAsync("Inventario", "Registrar ingreso de productos", "Recepción de mercadería",
            "Verifica la orden y las cantidades recibidas antes de actualizar el stock y su trazabilidad.",
            UseCaseData.Products, cancellationToken);

    [HttpPost, ValidateAntiForgeryToken, Authorize(Policy = AppPolicies.Warehouse)]
    public async Task<IActionResult> RegistrarIngresoProductos(IFormCollection form, CancellationToken cancellationToken) =>
        RedirectWithMessage(
            await commandService.RegisterProductEntryAsync(UseCaseRequestMapper.ToProductEntry(form), CurrentUserEmail, cancellationToken),
            nameof(RegistrarIngresoProductos));

    [Authorize(Policy = AppPolicies.Procurement)]
    public Task<IActionResult> RegistrarSolicitudCompra(CancellationToken cancellationToken) =>
        PageAsync("Compras", "Registrar solicitud de compra", "Reposición de stock",
            "Solicita los productos necesarios, define su prioridad y deja la compra lista para revisión.",
            UseCaseData.Products | UseCaseData.Suppliers, cancellationToken);

    [HttpPost, ValidateAntiForgeryToken, Authorize(Policy = AppPolicies.Procurement)]
    public async Task<IActionResult> RegistrarSolicitudCompra(IFormCollection form, CancellationToken cancellationToken) =>
        RedirectWithMessage(
            await commandService.RegisterPurchaseRequestAsync(UseCaseRequestMapper.ToPurchaseRequest(form), CurrentUserEmail, cancellationToken),
            nameof(RegistrarSolicitudCompra));

    [Authorize(Policy = AppPolicies.Sales)]
    public Task<IActionResult> RegistrarReclamoCliente(CancellationToken cancellationToken) =>
        PageAsync("Clientes", "Registrar reclamo de cliente", "Atención posventa",
            "Documenta lo ocurrido y vincúlalo con el cliente y su comprobante para facilitar el seguimiento.",
            UseCaseData.Clients, cancellationToken);

    [HttpPost, ValidateAntiForgeryToken, Authorize(Policy = AppPolicies.Sales)]
    public async Task<IActionResult> RegistrarReclamoCliente(IFormCollection form, CancellationToken cancellationToken) =>
        RedirectWithMessage(
            await commandService.RegisterCustomerClaimAsync(UseCaseRequestMapper.ToCustomerClaim(form), CurrentUserEmail, cancellationToken),
            nameof(RegistrarReclamoCliente));

    [Authorize(Policy = AppPolicies.Quotations)]
    public Task<IActionResult> RegistrarSolicitudCotizacion(CancellationToken cancellationToken) =>
        PageAsync("Cotizaciones", "Registrar solicitud de cotización", "Abastecimiento",
            "Compara alternativas enviando una misma lista de productos a uno o varios proveedores.",
            UseCaseData.Products | UseCaseData.Suppliers | UseCaseData.QuotationRequests, cancellationToken);

    [HttpPost, ValidateAntiForgeryToken, Authorize(Policy = AppPolicies.Quotations)]
    public async Task<IActionResult> RegistrarSolicitudCotizacion(IFormCollection form, CancellationToken cancellationToken) =>
        RedirectWithMessage(
            await commandService.RegisterQuotationRequestAsync(UseCaseRequestMapper.ToQuotationRequest(form), CurrentUserEmail, cancellationToken),
            nameof(RegistrarSolicitudCotizacion));

    [Authorize(Policy = AppPolicies.Sales)]
    public Task<IActionResult> GenerarReportePago(CancellationToken cancellationToken) =>
        PageAsync("Reportes", "Generar reporte de pago", "Control financiero",
            "Revisa pagos por fecha, método y estado para agilizar el cierre y la conciliación de caja.",
            UseCaseData.Payments, cancellationToken);

    public Task<IActionResult> BuscarProducto(CancellationToken cancellationToken) =>
        PageAsync("Productos", "Buscar producto", "Consulta de catálogo",
            "Encuentra accesorios por código, descripción, marca o categoría y consulta su disponibilidad actual.",
            UseCaseData.Products, cancellationToken);

    [Authorize(Policy = AppPolicies.Procurement)]
    public Task<IActionResult> BuscarSolicitudCompra(CancellationToken cancellationToken) =>
        PageAsync("Compras", "Buscar solicitud de compra", "Seguimiento de solicitudes",
            "Localiza solicitudes por número, proveedor, estado o fecha para continuar su atención.",
            UseCaseData.PurchaseRequests, cancellationToken);

    public Task<IActionResult> BuscarCliente(CancellationToken cancellationToken) =>
        PageAsync("Clientes", "Buscar cliente", "Consulta comercial",
            "Encuentra clientes y consulta la información necesaria para ventas y atención posventa.",
            UseCaseData.Clients, cancellationToken);

    [Authorize(Policy = AppPolicies.Procurement)]
    public Task<IActionResult> BuscarProveedor(CancellationToken cancellationToken) =>
        PageAsync("Proveedores", "Buscar proveedor", "Directorio de abastecimiento",
            "Consulta contactos confiables para cotizaciones, órdenes de compra y recepción de mercadería.",
            UseCaseData.Suppliers, cancellationToken);

    private string CurrentUserEmail => User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

    private async Task<IActionResult> PageAsync(
        string section,
        string title,
        string eyebrow,
        string description,
        UseCaseData requiredData,
        CancellationToken cancellationToken) =>
        View(await queryService.BuildPageAsync(
            section, title, eyebrow, description, requiredData, cancellationToken));

    private IActionResult RedirectWithMessage(OperationResult result, string action)
    {
        TempData[result.Succeeded ? "SuccessMessage" : "ErrorMessage"] = result.Message;
        return RedirectToAction(action);
    }
}
