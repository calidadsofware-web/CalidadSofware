using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pagina_Web.Services;

namespace Pagina_Web.Controllers;

[Authorize]
public class CasosUsoController(IAppStateService appStateService) : Controller
{
    [Authorize(Roles = "ADMINISTRADOR,CAJERO")]
    public IActionResult GenerarCdp()
    {
        return View(BuildPage(
            "Ventas",
            "Generar CDP",
            "Comprobante de pago",
            "Registra el cliente, valida productos, descuenta stock y actualiza ventas del dia."));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "ADMINISTRADOR,CAJERO")]
    public IActionResult GenerarCdp(IFormCollection form)
    {
        return RedirectWithMessage(appStateService.RegisterCdp(form), nameof(GenerarCdp));
    }

    [Authorize(Roles = "ADMINISTRADOR,ALMACEN")]
    public IActionResult RegistrarIngresoProductos()
    {
        return View(BuildPage(
            "Inventario",
            "Registrar ingreso de productos",
            "Recepcion de mercaderia",
            "Registra el ingreso fisico desde una compra aprobada y actualiza el stock."));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "ADMINISTRADOR,ALMACEN")]
    public IActionResult RegistrarIngresoProductos(IFormCollection form)
    {
        return RedirectWithMessage(appStateService.RegisterProductEntry(form), nameof(RegistrarIngresoProductos));
    }

    [Authorize(Roles = "ADMINISTRADOR,ASISTENTE_COMPRAS,ALMACEN")]
    public IActionResult RegistrarSolicitudCompra()
    {
        return View(BuildPage(
            "Compras",
            "Registrar solicitud de compra",
            "Reposicion de stock",
            "Crea una solicitud de compra a partir de productos con stock bajo o necesidad operativa."));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "ADMINISTRADOR,ASISTENTE_COMPRAS,ALMACEN")]
    public IActionResult RegistrarSolicitudCompra(IFormCollection form)
    {
        return RedirectWithMessage(appStateService.RegisterPurchaseRequest(form, CurrentUserName), nameof(RegistrarSolicitudCompra));
    }

    [Authorize(Roles = "ADMINISTRADOR,CAJERO")]
    public IActionResult RegistrarReclamoCliente()
    {
        return View(BuildPage(
            "Clientes",
            "Registrar reclamo de cliente",
            "Atencion postventa",
            "Relaciona el reclamo con cliente, CDP y producto para dar seguimiento formal."));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "ADMINISTRADOR,CAJERO")]
    public IActionResult RegistrarReclamoCliente(IFormCollection form)
    {
        return RedirectWithMessage(appStateService.RegisterCustomerClaim(form), nameof(RegistrarReclamoCliente));
    }

    [Authorize(Roles = "ADMINISTRADOR,ASISTENTE_COMPRAS")]
    public IActionResult RegistrarSolicitudCotizacion()
    {
        return View(BuildPage(
            "Cotizaciones",
            "Registrar solicitud de cotizacion",
            "Abastecimiento",
            "Selecciona productos y proveedores para solicitar precios antes de comprar."));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "ADMINISTRADOR,ASISTENTE_COMPRAS")]
    public IActionResult RegistrarSolicitudCotizacion(IFormCollection form)
    {
        return RedirectWithMessage(appStateService.RegisterQuotationRequest(form, CurrentUserName), nameof(RegistrarSolicitudCotizacion));
    }

    [Authorize(Roles = "ADMINISTRADOR,CAJERO")]
    public IActionResult GenerarReportePago()
    {
        return View(BuildPage(
            "Reportes",
            "Generar reporte de pago",
            "Control financiero",
            "Consulta pagos por fecha, metodo y estado para sustentar cierres de caja."));
    }

    public IActionResult BuscarProducto()
    {
        return View(BuildPage(
            "Productos",
            "Buscar producto",
            "Consulta de catalogo",
            "Ubica accesorios por codigo, descripcion, marca, categoria y disponibilidad."));
    }

    [Authorize(Roles = "ADMINISTRADOR,ASISTENTE_COMPRAS,ALMACEN")]
    public IActionResult BuscarSolicitudCompra()
    {
        return View(BuildPage(
            "Compras",
            "Buscar solicitud de compra",
            "Seguimiento de solicitudes",
            "Filtra solicitudes por numero, proveedor, estado y rango de fechas."));
    }

    public IActionResult BuscarCliente()
    {
        return View(BuildPage(
            "Clientes",
            "Buscar cliente",
            "Consulta comercial",
            "Encuentra clientes para ventas, reclamos e historial de atencion."));
    }

    [Authorize(Roles = "ADMINISTRADOR,ASISTENTE_COMPRAS,ALMACEN")]
    public IActionResult BuscarProveedor()
    {
        return View(BuildPage(
            "Proveedores",
            "Buscar proveedor",
            "Directorio de abastecimiento",
            "Consulta proveedores para cotizaciones, compras y recepcion de mercaderia."));
    }

    private string CurrentUserName => User.Identity?.Name ?? "Usuario DataCell";

    private IActionResult RedirectWithMessage(OperationResult result, string action)
    {
        TempData[result.Succeeded ? "SuccessMessage" : "ErrorMessage"] = result.Message;
        return RedirectToAction(action);
    }

    private Models.ViewModels.UseCasePageViewModel BuildPage(string section, string title, string eyebrow, string description)
    {
        return appStateService.BuildPage(section, title, eyebrow, description);
    }
}
