using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pagina_Web.Data.Entities;

namespace Pagina_Web.Data.Configurations;

internal sealed class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> entity)
    {
        entity.ToTable("clientes", table =>
            table.HasCheckConstraint("ck_clientes_estado", "\"estado\" IN ('ACTIVO','INACTIVO')"));
        entity.HasKey(x => x.IdCliente);
        entity.Property(x => x.IdCliente).HasColumnName("id_cliente");
        entity.Property(x => x.Nombres).HasColumnName("nombres").HasMaxLength(80).IsRequired();
        entity.Property(x => x.Apellidos).HasColumnName("apellidos").HasMaxLength(80);
        entity.Property(x => x.Documento).HasColumnName("documento").HasMaxLength(20);
        entity.Property(x => x.Direccion).HasColumnName("direccion").HasMaxLength(150);
        entity.Property(x => x.Telefono).HasColumnName("telefono").HasMaxLength(20);
        entity.Property(x => x.Correo).HasColumnName("correo").HasMaxLength(120);
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("ACTIVO");
        entity.Property(x => x.FechaRegistro).HasColumnName("fecha_registro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.HasIndex(x => x.Documento).IsUnique();
        entity.HasIndex(x => x.Correo).IsUnique();
        entity.HasIndex(x => x.Nombres);
    }
}

internal sealed class ProveedorConfiguration : IEntityTypeConfiguration<Proveedor>
{
    public void Configure(EntityTypeBuilder<Proveedor> entity)
    {
        entity.ToTable("proveedores", table =>
            table.HasCheckConstraint("ck_proveedores_estado", "\"estado\" IN ('ACTIVO','INACTIVO')"));
        entity.HasKey(x => x.IdProveedor);
        entity.Property(x => x.IdProveedor).HasColumnName("id_proveedor");
        entity.Property(x => x.Ruc).HasColumnName("ruc").HasMaxLength(11).IsRequired();
        entity.Property(x => x.RazonSocial).HasColumnName("razon_social").HasMaxLength(150).IsRequired();
        entity.Property(x => x.Direccion).HasColumnName("direccion").HasMaxLength(150);
        entity.Property(x => x.Contacto).HasColumnName("contacto").HasMaxLength(100);
        entity.Property(x => x.Telefono).HasColumnName("telefono").HasMaxLength(20);
        entity.Property(x => x.Correo).HasColumnName("correo").HasMaxLength(120);
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("ACTIVO");
        entity.HasIndex(x => x.Ruc).IsUnique();
        entity.HasIndex(x => x.Correo).IsUnique();
        entity.HasIndex(x => x.RazonSocial);
    }
}

internal sealed class CategoriaConfiguration : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> entity)
    {
        entity.ToTable("categorias");
        entity.HasKey(x => x.IdCategoria);
        entity.Property(x => x.IdCategoria).HasColumnName("id_categoria");
        entity.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(80).IsRequired();
        entity.HasIndex(x => x.Nombre).IsUnique();
    }
}

internal sealed class MarcaConfiguration : IEntityTypeConfiguration<Marca>
{
    public void Configure(EntityTypeBuilder<Marca> entity)
    {
        entity.ToTable("marcas");
        entity.HasKey(x => x.IdMarca);
        entity.Property(x => x.IdMarca).HasColumnName("id_marca");
        entity.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(80).IsRequired();
        entity.HasIndex(x => x.Nombre).IsUnique();
    }
}

internal sealed class ProductoConfiguration : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> entity)
    {
        entity.ToTable("productos", table =>
        {
            table.HasCheckConstraint("ck_productos_estado", "\"estado\" IN ('ACTIVO','INACTIVO')");
            table.HasCheckConstraint("ck_productos_precios", "\"precio_compra\" >= 0 AND \"precio_venta\" >= 0");
            table.HasCheckConstraint("ck_productos_stock", "\"stock\" >= 0 AND \"stock_minimo\" >= 0");
        });
        entity.HasKey(x => x.IdProducto);
        entity.Property(x => x.IdProducto).HasColumnName("id_producto");
        entity.Property(x => x.Codigo).HasColumnName("codigo").HasMaxLength(30).IsRequired();
        entity.Property(x => x.CodigoBarras).HasColumnName("codigo_barras").HasMaxLength(50);
        entity.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(120).IsRequired();
        entity.Property(x => x.Descripcion).HasColumnName("descripcion").HasMaxLength(250);
        entity.Property(x => x.PrecioCompra).HasColumnName("precio_compra").HasPrecision(12, 2);
        entity.Property(x => x.PrecioVenta).HasColumnName("precio_venta").HasPrecision(12, 2);
        entity.Property(x => x.Stock).HasColumnName("stock").HasDefaultValue(0);
        entity.Property(x => x.StockMinimo).HasColumnName("stock_minimo").HasDefaultValue(5);
        entity.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("ACTIVO");
        entity.Property(x => x.IdCategoria).HasColumnName("id_categoria");
        entity.Property(x => x.IdMarca).HasColumnName("id_marca");
        entity.HasIndex(x => x.Codigo).IsUnique();
        entity.HasIndex(x => x.CodigoBarras).IsUnique();
        entity.HasIndex(x => x.Nombre);
        entity.HasIndex(x => x.IdCategoria);
        entity.HasIndex(x => x.IdMarca);
        entity.HasOne(x => x.Categoria).WithMany(x => x.Productos).HasForeignKey(x => x.IdCategoria).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(x => x.Marca).WithMany(x => x.Productos).HasForeignKey(x => x.IdMarca).OnDelete(DeleteBehavior.Restrict);
    }
}
