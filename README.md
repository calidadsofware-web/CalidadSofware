# DataCell

Sistema web MVC para ventas, compras e inventario. La aplicacion usa ASP.NET Core MVC sobre .NET 10, Entity Framework Core y PostgreSQL de Supabase. En desarrollo puede iniciarse sin credenciales externas mediante una base SQLite local.

## Estado del proyecto

- Arquitectura MVC conservada y separada en presentacion, aplicacion y persistencia.
- Las operaciones ya se guardan en base de datos; se retiro el estado singleton en memoria.
- Modelo PostgreSQL normalizado en `public`, visible directamente en Table Editor, con claves foraneas, restricciones, indices, transacciones y RLS defensivo.
- Migraciones versionadas en `supabase/migrations/`: esquema inicial y reconciliacion de seguridad/roles.
- La fuente MySQL original queda solo como referencia historica en `Database/DataCellDB.sql`.
- Analizadores de .NET y advertencias como errores habilitados.

La arquitectura y el modelo se explican en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) y [docs/DATABASE-MODEL.md](docs/DATABASE-MODEL.md). Los permisos estan definidos en [docs/ROLES.md](docs/ROLES.md) y la evidencia de metodologia cascada esta en [docs/WATERFALL.md](docs/WATERFALL.md).

## Ejecutar localmente

Requisitos: SDK de .NET 10. No se necesita MySQL para el modo local.

```powershell
dotnet restore
dotnet build
dotnet run --urls http://localhost:5008
```

Abrir `http://localhost:5008`. Si `ConnectionStrings:DataCell` esta vacia, se crea automaticamente `Data/datacell-dev.db` con datos de demostracion.

Usuarios de prueba:

| Rol | Correo | Clave |
|---|---|---|
| Administrador | `daniel@datacell.local` | `Daniel123!` |
| Asistente de compras | `joel@datacell.local` | `Joel123!` |
| Almacen | `luis@datacell.local` | `Luis123!` |
| Cajero | `stefano@datacell.local` | `Stefano123!` |
| Administrador | `gerardo@datacell.local` | `Gerardo123!` |

Estas credenciales son datos demo y deben reemplazarse antes de produccion.

## Conectar Supabase

La aplicacion se conecta directamente a PostgreSQL desde el servidor; no expone la clave en JavaScript ni en archivos versionados. Configure la cadena mediante secretos de usuario:

```powershell
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DataCell" "Host=HOST_SUPABASE;Port=5432;Database=postgres;Username=postgres.PROJECT_REF;Password=CLAVE;SSL Mode=Require;Trust Server Certificate=true"
```

Use la cadena de **Supavisor session mode** si la red local no soporta IPv6; para un servidor con IPv6 se puede usar la conexion directa. Luego aplique la migracion versionada con la CLI de Supabase y reinicie la aplicacion.

La migracion remota se debe ejecutar exclusivamente en la organizacion de `calidadsofware@gmail.com`. No se deben usar ni modificar proyectos de `dashboard-comercial`. Las tablas quedan en `public` para aparecer directamente en la vista inicial de Table Editor, sin configuracion adicional.

## Verificacion

```powershell
dotnet restore
dotnet build --no-restore
dotnet list package --vulnerable --include-transitive
```

Tras iniciar sesion, `/Database` muestra el proveedor activo, la conectividad y los conteos principales. Las operaciones de venta, pago, ingreso, inventario, solicitud de compra, cotizacion y reclamo persisten mediante servicios asincronos y transacciones donde se modifican varias tablas.

## Estructura

```text
Controllers/              Adaptadores HTTP y controladores MVC
Controllers/Mapping/      Conversion y validacion de formularios
Models/Requests/          Comandos de entrada tipados
Models/ViewModels/        Modelos exclusivos de las vistas
Services/                 Casos de uso de lectura, escritura y acceso
Data/Entities/            Entidades del dominio persistente
Data/Configurations/      Mapeo EF Core, relaciones, indices y restricciones
Views/                    Interfaz Razor
supabase/migrations/      Esquema PostgreSQL versionado
Database/                 Fuente MySQL heredada y notas de migracion
docs/                     Arquitectura, modelo y proceso cascada
```
