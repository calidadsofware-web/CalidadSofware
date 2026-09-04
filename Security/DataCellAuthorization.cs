namespace Pagina_Web.Security;

public static class AppRoles
{
    public const string Administrator = "ADMINISTRADOR";
    public const string Cashier = "CAJERO";
    public const string Warehouse = "ALMACEN";
    public const string PurchasingAssistant = "ASISTENTE_COMPRAS";

    public static IReadOnlyCollection<string> All { get; } =
    [
        Administrator,
        Cashier,
        Warehouse,
        PurchasingAssistant
    ];

    public static string GetDisplayName(string role) => role switch
    {
        Administrator => "Administrador",
        Cashier => "Cajero",
        Warehouse => "Almacén",
        PurchasingAssistant => "Asistente de compras",
        _ => "Usuario"
    };
}

public static class AppPolicies
{
    public const string Administration = nameof(Administration);
    public const string Sales = nameof(Sales);
    public const string Warehouse = nameof(Warehouse);
    public const string Procurement = nameof(Procurement);
    public const string Quotations = nameof(Quotations);
}
