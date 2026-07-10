# DataCell - ASP.NET MVC + MySQL

Proyecto MVC para la gestion comercial e inventario de DataCell.

## Arquitectura actual

- `Controllers`: entrada MVC para las vistas.
- `Views`: pantallas Razor.
- `Data/Entities`: entidades que reflejan las tablas de MySQL.
- `Data/DataCellDbContext.cs`: contexto EF Core conectado a `DataCellDB`.
- `Services`: autenticacion demo, estado operativo del sistema, reglas de actualizacion y diagnostico de BD.
- `Database/DataCellDB.sql`: script MySQL corregido para crear la base y datos demo.
- `wwwroot/img/datacell-logo.png`: imagen usada como favicon y logo del sidebar.

## Preparar MySQL

El script `Database/DataCellDB.sql` reinicia la base `DataCellDB`.

Opcion con MySQL Workbench:

1. Abre MySQL Workbench.
2. Conectate al servidor local `localhost:3306`.
3. Abre `Database/DataCellDB.sql`.
4. Ejecuta todo el script.

Opcion con terminal:

```powershell
& "C:\Program Files\MySQL\MySQL Server 9.3\bin\mysql.exe" -h localhost -P 3306 -u root -p
```

Dentro de MySQL:

```sql
source C:/Users/joela/Desktop/Pagina_Web/Database/DataCellDB.sql
```

## Configurar la conexion

Edita `appsettings.json` si tu usuario o password son distintos:

```json
"ConnectionStrings": {
  "DataCell": "server=localhost;port=3306;database=DataCellDB;user=root;password=TU_CLAVE;SslMode=Disabled;"
}
```

## Ejecutar y probar

```powershell
dotnet build
dotnet run --urls http://localhost:5008
```

Abre:

- `http://localhost:5008/`

El sistema solicita login antes de entrar al panel operativo. La pantalla `/Database` valida la conexion y muestra conteos de las tablas principales; solo el rol administrador puede verla.

## Usuarios y roles de prueba (solo README)

Estos usuarios son para iniciar sesion durante la evaluacion del prototipo; por seguridad se documentan solo en este README y no se muestran en la pantalla de login.

- Aguirre Espinoza, Daniel Francisco: `daniel@datacell.local` / `Daniel123!` / Administrador
- Diaz Gutierrez, Joel Alexander: `joel@datacell.local` / `Joel123!` / Asistente de Compras
- Durand Durand, Luis Fabricio: `luis@datacell.local` / `Luis123!` / Almacen
- Gomez Medina, Stefano Jose: `stefano@datacell.local` / `Stefano123!` / Cajero
- Palacios Bazan, Gerardo Favian: `gerardo@datacell.local` / `Gerardo123!` / Administrador

Permisos principales:

- Administrador: acceso completo.
- Cajero: genera CDP, reportes de pago, clientes y reclamos.
- Almacen: ingreso de productos, catalogo, solicitudes y proveedores.
- Asistente de Compras: solicitudes de compra, cotizaciones y proveedores.

## Prototipos GUI implementados

Los prototipos respetan el sidebar y la paleta azul de DataCell, y estan organizados por modulos reales del sistema:

- `http://localhost:5008/CasosUso/GenerarCdp`
- `http://localhost:5008/CasosUso/RegistrarIngresoProductos`
- `http://localhost:5008/CasosUso/RegistrarSolicitudCompra`
- `http://localhost:5008/CasosUso/RegistrarReclamoCliente`
- `http://localhost:5008/CasosUso/RegistrarSolicitudCotizacion`
- `http://localhost:5008/CasosUso/GenerarReportePago`
- `http://localhost:5008/CasosUso/BuscarProducto`
- `http://localhost:5008/CasosUso/BuscarSolicitudCompra`
- `http://localhost:5008/CasosUso/BuscarCliente`
- `http://localhost:5008/CasosUso/BuscarProveedor`

La pantalla de inicio ahora funciona como panel operativo: muestra ventas del dia, solicitudes pendientes, stock bajo, reclamos y pagos recientes.

Los datos se actualizan durante la ejecucion de la app. Por ejemplo, al generar un CDP se agrega el pago al reporte, aumenta la venta del dia y disminuye el stock de los productos seleccionados. Para persistencia definitiva en MySQL se debe completar la siguiente fase de repositorios/servicios contra `DataCellDbContext`.

## Interacciones GUI

- Los botones de buscar/limpiar filtran las tablas visibles.
- Los modales de producto permiten seleccionar y agregar productos a CDP, solicitudes e ingresos.
- Las filas agregadas pueden retirarse con `Quitar`.
- Las cantidades recalculan subtotal, IGV y total en CDP.
- `Vista previa` abre un resumen de la operacion.
- `Crear cliente`, `Crear proveedor` y `Crear producto` agregan registros rapidos al prototipo.
- `Exportar PDF` y `Exportar Excel` generan archivos descargables de la tabla del reporte.
