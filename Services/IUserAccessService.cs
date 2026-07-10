using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public interface IUserAccessService
{
    AuthenticatedUserViewModel? Validate(string email, string password);
}
