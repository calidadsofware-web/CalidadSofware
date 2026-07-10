using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public interface IAppStateService
{
    DashboardViewModel GetDashboard();
    UseCasePageViewModel BuildPage(string section, string title, string eyebrow, string description);
    void RegisterCdp(IFormCollection form, string userName);
    void RegisterProductEntry(IFormCollection form, string userName);
    void RegisterPurchaseRequest(IFormCollection form, string userName);
    void RegisterCustomerClaim(IFormCollection form, string userName);
    void RegisterQuotationRequest(IFormCollection form, string userName);
}
