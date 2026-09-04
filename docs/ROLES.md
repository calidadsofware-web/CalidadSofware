# Roles y permisos

Los identificadores de roles y las politicas de autorizacion se centralizan en `Security/DataCellAuthorization.cs`. Los controladores aplican politicas; las vistas solo usan los mismos roles para ocultar opciones que el usuario no puede ejecutar. La validacion definitiva siempre ocurre en el servidor.

| Capacidad | Administrador | Cajero | Almacen | Asistente de compras |
|---|:---:|:---:|:---:|:---:|
| Panel y consulta de productos/clientes | Si | Si | Si | Si |
| Emitir comprobantes y consultar pagos | Si | Si | No | No |
| Registrar reclamos | Si | Si | No | No |
| Registrar ingreso de productos | Si | No | Si | No |
| Solicitudes y seguimiento de compra | Si | No | Si | Si |
| Cotizaciones a proveedores | Si | No | No | Si |
| Directorio de proveedores | Si | No | Si | Si |
| Diagnostico tecnico de base de datos | Si | No | No | No |

## Politicas

- `Administration`: tareas tecnicas reservadas al administrador.
- `Sales`: venta, comprobantes, pagos y atencion posventa.
- `Warehouse`: recepcion fisica y actualizacion de inventario.
- `Procurement`: solicitudes, seguimiento y proveedores.
- `Quotations`: comparacion de ofertas previa a la compra.

Para crear un rol nuevo se debe definir primero su responsabilidad, agregarlo al catalogo y asignarlo solamente a las politicas necesarias. No se deben introducir nombres de rol directamente en controladores o vistas.
