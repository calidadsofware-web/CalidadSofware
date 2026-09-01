using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Pagina_Web.Data;
using Pagina_Web.Models.ViewModels;

namespace Pagina_Web.Services;

public class DatabaseHealthService(
    DataCellDbContext context,
    IConfiguration configuration,
    ILogger<DatabaseHealthService> logger) : IDatabaseHealthService
{
    public async Task<DatabaseConnectionStatusViewModel> CheckAsync(CancellationToken cancellationToken = default)
    {
        var connectionString = configuration.GetConnectionString("DataCell");
        var status = BuildInitialStatus(connectionString);

        if (!status.IsConfigured)
        {
            status.ErrorMessage ??= "No existe la cadena de conexion ConnectionStrings:DataCell.";
            return status;
        }

        try
        {
            await context.Database.OpenConnectionAsync(cancellationToken);

            status.CanConnect = true;
            status.ProviderName = context.Database.ProviderName;
            status.ServerVersion = await GetServerVersionAsync(cancellationToken);
            status.TableCounts = await GetTableCountsAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudo conectar con la base de datos DataCell.");
            status.ErrorMessage = ex.GetBaseException().Message;
        }
        finally
        {
            if (context.Database.GetDbConnection().State != ConnectionState.Closed)
            {
                await context.Database.CloseConnectionAsync();
            }
        }

        return status;
    }

    private static DatabaseConnectionStatusViewModel BuildInitialStatus(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return new DatabaseConnectionStatusViewModel();
        }

        if (connectionString.Contains("TU_CLAVE", StringComparison.OrdinalIgnoreCase))
        {
            return new DatabaseConnectionStatusViewModel
            {
                ErrorMessage = "Configure una clave real en ConnectionStrings:DataCell antes de validar la conexion."
            };
        }

        try
        {
            var builder = new DbConnectionStringBuilder { ConnectionString = connectionString };
            return new DatabaseConnectionStatusViewModel
            {
                IsConfigured = true,
                Server = TryGetConnectionValue(builder, "server"),
                Port = TryGetConnectionValue(builder, "port"),
                DatabaseName = TryGetConnectionValue(builder, "database")
            };
        }
        catch (ArgumentException)
        {
            return new DatabaseConnectionStatusViewModel
            {
                ErrorMessage = "La cadena de conexion DataCell no tiene un formato valido."
            };
        }
    }

    private static string? TryGetConnectionValue(DbConnectionStringBuilder builder, string key)
    {
        return builder.TryGetValue(key, out var value) ? value?.ToString() : null;
    }

    private async Task<string?> GetServerVersionAsync(CancellationToken cancellationToken)
    {
        var connection = context.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT VERSION();";

        var version = await command.ExecuteScalarAsync(cancellationToken);
        return version?.ToString();
    }

    private async Task<IReadOnlyList<TableCountViewModel>> GetTableCountsAsync(CancellationToken cancellationToken)
    {
        return
        [
            new("Roles", await context.Roles.CountAsync(cancellationToken)),
            new("Usuarios", await context.Usuarios.CountAsync(cancellationToken)),
            new("Clientes", await context.Clientes.CountAsync(cancellationToken)),
            new("Proveedores", await context.Proveedores.CountAsync(cancellationToken)),
            new("Categorias", await context.Categorias.CountAsync(cancellationToken)),
            new("Marcas", await context.Marcas.CountAsync(cancellationToken)),
            new("Productos", await context.Productos.CountAsync(cancellationToken)),
            new("Ventas", await context.Ventas.CountAsync(cancellationToken)),
            new("Reclamos de cliente", await context.ReclamosCliente.CountAsync(cancellationToken)),
            new("Compras", await context.Compras.CountAsync(cancellationToken)),
            new("Solicitudes de cotizacion", await context.SolicitudesCotizacion.CountAsync(cancellationToken)),
            new("Solicitudes de compra", await context.SolicitudesCompra.CountAsync(cancellationToken)),
            new("Recepciones", await context.Recepciones.CountAsync(cancellationToken)),
            new("Movimientos de inventario", await context.MovimientosInventario.CountAsync(cancellationToken))
        ];
    }
}
