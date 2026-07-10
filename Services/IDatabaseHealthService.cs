using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public interface IDatabaseHealthService
{
    Task<DatabaseConnectionStatusViewModel> CheckAsync(CancellationToken cancellationToken = default);
}
