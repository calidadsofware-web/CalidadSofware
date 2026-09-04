namespace Pagina_Web.Data.Entities;

public sealed class Rol
{
    public int IdRol { get; set; }
    public string NombreRol { get; set; } = string.Empty;
    public ICollection<Usuario> Usuarios { get; set; } = [];
}

public sealed class Usuario
{
    public int IdUsuario { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Estado { get; set; } = "ACTIVO";
    public DateTimeOffset FechaRegistro { get; set; }
    public int IdRol { get; set; }
    public Rol Rol { get; set; } = null!;
}
