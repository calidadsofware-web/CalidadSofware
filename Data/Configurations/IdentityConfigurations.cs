using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pagina_Web.Data.Entities;

namespace Pagina_Web.Data.Configurations;

internal sealed class RolConfiguration : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> entity)
    {
        entity.ToTable("roles", table =>
            table.HasCheckConstraint(
                "ck_roles_nombre",
                "\"nombre\" IN ('ADMINISTRADOR','CAJERO','ALMACEN','ASISTENTE_COMPRAS')"));
        entity.HasKey(x => x.IdRol);
        entity.Property(x => x.IdRol).HasColumnName("id_rol");
        entity.Property(x => x.NombreRol).HasColumnName("nombre").HasMaxLength(50).IsRequired();
        entity.HasIndex(x => x.NombreRol).IsUnique();
        entity.HasMany(x => x.Usuarios).WithOne(x => x.Rol).HasForeignKey(x => x.IdRol).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> entity)
    {
        entity.ToTable("usuarios", table =>
            table.HasCheckConstraint("ck_usuarios_estado", "\"estado\" IN ('ACTIVO','INACTIVO')"));
        entity.HasKey(x => x.IdUsuario);
        entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        entity.Property(x => x.Nombres).HasColumnName("nombres").HasMaxLength(80).IsRequired();
        entity.Property(x => x.Apellidos).HasColumnName("apellidos").HasMaxLength(80).IsRequired();
        entity.Property(x => x.Correo).HasColumnName("correo").HasMaxLength(120).IsRequired();
        entity.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("ACTIVO");
        entity.Property(x => x.FechaRegistro).HasColumnName("fecha_registro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(x => x.IdRol).HasColumnName("id_rol");
        entity.HasIndex(x => x.Correo).IsUnique();
    }
}
