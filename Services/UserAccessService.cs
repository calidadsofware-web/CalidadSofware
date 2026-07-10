using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public class UserAccessService : IUserAccessService
{
    private readonly IReadOnlyList<DemoUser> users =
    [
        new("daniel@datacell.local", "Daniel123!", "Aguirre Espinoza, Daniel Francisco", "ADMINISTRADOR", "Administrador"),
        new("joel@datacell.local", "Joel123!", "Diaz Gutierrez, Joel Alexander", "ASISTENTE_COMPRAS", "Asistente de Compras"),
        new("luis@datacell.local", "Luis123!", "Durand Durand, Luis Fabricio", "ALMACEN", "Almacen"),
        new("stefano@datacell.local", "Stefano123!", "Gomez Medina, Stefano Jose", "CAJERO", "Cajero"),
        new("gerardo@datacell.local", "Gerardo123!", "Palacios Bazan, Gerardo Favian", "ADMINISTRADOR", "Administrador")
    ];

    public AuthenticatedUserViewModel? Validate(string email, string password)
    {
        var user = users.FirstOrDefault(candidate =>
            candidate.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
            && candidate.Password == password);

        return user is null
            ? null
            : new AuthenticatedUserViewModel(user.Email, user.FullName, user.Role, user.RoleDisplayName);
    }

    private sealed record DemoUser(string Email, string Password, string FullName, string Role, string RoleDisplayName);
}
