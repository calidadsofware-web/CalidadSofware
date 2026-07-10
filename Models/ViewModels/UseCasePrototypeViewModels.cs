namespace Pagina_Web.Models.ViewModels;

public class UseCasePageViewModel
{
    public string Eyebrow { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public IReadOnlyList<SummaryMetricViewModel> Metrics { get; set; } = [];
    public IReadOnlyList<ProductRowViewModel> Products { get; set; } = [];
    public IReadOnlyList<ClientRowViewModel> Clients { get; set; } = [];
    public IReadOnlyList<SupplierRowViewModel> Suppliers { get; set; } = [];
    public IReadOnlyList<PurchaseRequestRowViewModel> PurchaseRequests { get; set; } = [];
    public IReadOnlyList<PaymentReportRowViewModel> Payments { get; set; } = [];
}

public record SummaryMetricViewModel(string Label, string Value, string Hint);

public class DashboardViewModel
{
    public IReadOnlyList<SummaryMetricViewModel> Metrics { get; set; } = [];
    public IReadOnlyList<ProductRowViewModel> LowStockProducts { get; set; } = [];
    public IReadOnlyList<PurchaseRequestRowViewModel> PurchaseRequests { get; set; } = [];
    public IReadOnlyList<PaymentReportRowViewModel> Payments { get; set; } = [];
}

public class LoginViewModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? ReturnUrl { get; set; }
    public string? ErrorMessage { get; set; }
}

public record ProductRowViewModel(
    string Code,
    string Name,
    string Description,
    string Category,
    string Brand,
    int Stock,
    int MinStock,
    decimal Price);

public record ClientRowViewModel(
    string Document,
    string FullName,
    string Phone,
    string Email,
    string LastPurchase,
    string Status);

public record SupplierRowViewModel(
    string Ruc,
    string BusinessName,
    string Contact,
    string Phone,
    string Email,
    string Status);

public record PurchaseRequestRowViewModel(
    string Number,
    string Supplier,
    string CreatedAt,
    string Status,
    string RequestedBy,
    decimal EstimatedTotal);

public record PaymentReportRowViewModel(
    string Document,
    string Client,
    string Date,
    string Method,
    string Status,
    decimal Total);

public record AuthenticatedUserViewModel(
    string Email,
    string FullName,
    string Role,
    string RoleDisplayName);
