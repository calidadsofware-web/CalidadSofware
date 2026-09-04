using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public interface IUserAccessService
{
    Task<AuthenticatedUserViewModel?> ValidateAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);
}
