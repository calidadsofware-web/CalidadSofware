using Pagina_Web.Models.Requests;

namespace Pagina_Web.Controllers.Mapping;

internal static class UseCaseRequestMapper
{
    private const int MaximumOperationQuantity = 10_000;

    public static GenerateCdpRequest ToSale(IFormCollection form) => new(
        ReadOption(form, "tipoCdp", "BOLETA", "BOLETA", "FACTURA"),
        Read(form, "cliente", "Cliente venta rapida"),
        ReadOptional(form, "documento"),
        ReadOption(form, "metodoPago", "EFECTIVO", "EFECTIVO", "TARJETA", "YAPE", "TRANSFERENCIA"),
        ReadItems(form, "qty_"));

    public static RegisterProductEntryRequest ToProductEntry(IFormCollection form) => new(
        Read(form, "ordenCompra", string.Empty).Split(" - ", 2, StringSplitOptions.TrimEntries)[0],
        ReadOptional(form, "guia"),
        ReadDate(form, "fecha"),
        ReadOptional(form, "observaciones"),
        ReadItems(form, "received_"));

    public static RegisterPurchaseRequest ToPurchaseRequest(IFormCollection form) => new(
        ReadOptional(form, "proveedor"),
        ReadOption(form, "prioridad", "MEDIA", "BAJA", "MEDIA", "ALTA"),
        ReadDate(form, "fechaRequerida"),
        ReadOptional(form, "justificacion"),
        ReadItems(form, "request_"));

    public static RegisterQuotationRequest ToQuotationRequest(IFormCollection form) => new(
        ReadDate(form, "fechaLimite"),
        ReadOptional(form, "observaciones"),
        form["proveedor"]
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray(),
        ReadItems(form, "request_"));

    public static RegisterCustomerClaimRequest ToCustomerClaim(IFormCollection form) => new(
        Read(form, "cliente", string.Empty),
        ReadOptional(form, "cdp"),
        Read(form, "tipoReclamo", "RECLAMO"),
        Read(form, "canal", "PRESENCIAL").ToUpperInvariant(),
        ReadOption(form, "prioridad", "MEDIA", "BAJA", "MEDIA", "ALTA"),
        Read(form, "descripcion", string.Empty));

    private static IReadOnlyList<OperationItemRequest> ReadItems(IFormCollection form, string prefix) =>
        form.Keys
            .Where(key => key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .Select(key => new OperationItemRequest(
                key[prefix.Length..],
                int.TryParse(form[key], out var value) ? Math.Clamp(value, 0, MaximumOperationQuantity) : 0))
            .Where(item => item.Quantity > 0 && !string.IsNullOrWhiteSpace(item.ProductCode))
            .GroupBy(item => item.ProductCode, StringComparer.OrdinalIgnoreCase)
            .Select(group => new OperationItemRequest(group.Key, Math.Min(group.Sum(item => item.Quantity), MaximumOperationQuantity)))
            .ToArray();

    private static DateOnly? ReadDate(IFormCollection form, string key) =>
        DateOnly.TryParse(form[key], out var value) ? value : null;

    private static string Read(IFormCollection form, string key, string fallback) =>
        string.IsNullOrWhiteSpace(form[key]) ? fallback : form[key].ToString().Trim();

    private static string? ReadOptional(IFormCollection form, string key)
    {
        var value = Read(form, key, string.Empty);
        return value.Length == 0 ? null : value;
    }

    private static string ReadOption(IFormCollection form, string key, string fallback, params string[] allowed)
    {
        var value = Read(form, key, fallback).ToUpperInvariant();
        return allowed.Contains(value, StringComparer.Ordinal) ? value : fallback;
    }
}
