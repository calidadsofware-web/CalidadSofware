using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pagina_Web.Data;
using Pagina_Web.Data.Entities;
using Pagina_Web.Models.ViewModels;
using Pagina_Web.Security;

namespace Pagina_Web.Services;

public sealed class UserAccessService(
    DataCellDbContext context,
    IPasswordHasher<Usuario> passwordHasher) : IUserAccessService
{
    public async Task<AuthenticatedUserViewModel?> ValidateAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await context.Usuarios
            .AsNoTracking()
            .Include(item => item.Rol)
            .SingleOrDefaultAsync(
                item => item.Estado == "ACTIVO" && item.Correo == normalizedEmail,
                cancellationToken);

        if (user is null || passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password)
            == PasswordVerificationResult.Failed)
        {
            return null;
        }

        return new AuthenticatedUserViewModel(
            user.Correo,
            $"{user.Apellidos}, {user.Nombres}",
            user.Rol.NombreRol,
            AppRoles.GetDisplayName(user.Rol.NombreRol));
    }
}
