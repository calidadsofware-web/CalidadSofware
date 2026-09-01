using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public interface IAppStateService
{
    DashboardViewModel GetDashboard();
    UseCasePageViewModel BuildPage(string section, string title, string eyebrow, string description);
    OperationResult RegisterCdp(IFormCollection form);
    OperationResult RegisterProductEntry(IFormCollection form);
    OperationResult RegisterPurchaseRequest(IFormCollection form, string userName);
    OperationResult RegisterCustomerClaim(IFormCollection form);
    OperationResult RegisterQuotationRequest(IFormCollection form, string userName);
}

public sealed record OperationResult(bool Succeeded, string Message);
