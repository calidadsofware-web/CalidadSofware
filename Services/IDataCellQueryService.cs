using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

[Flags]
public enum UseCaseData
{
    None = 0,
    Products = 1,
    Clients = 2,
    Suppliers = 4,
    PurchaseRequests = 8,
    QuotationRequests = 16,
    Payments = 32
}

public interface IDataCellQueryService
{
    Task<DashboardViewModel> GetDashboardAsync(CancellationToken cancellationToken = default);

    Task<UseCasePageViewModel> BuildPageAsync(
        string section,
        string title,
        string eyebrow,
        string description,
        UseCaseData requiredData,
        CancellationToken cancellationToken = default);
}
