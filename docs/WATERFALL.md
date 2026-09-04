# Evidencia de metodologia cascada

Este documento organiza la modernizacion como fases secuenciales con entregables verificables. La cascada no cambia la arquitectura MVC; describe como se planifica, construye y aprueba el producto.

## 1. Requisitos

Requisitos funcionales: autenticar por roles; consultar productos, clientes, proveedores y solicitudes; emitir CDP y pago; registrar ingresos e inventario; crear solicitudes de compra y cotizacion; registrar reclamos; visualizar salud de la base.

Requisitos no funcionales: MVC, persistencia PostgreSQL en Supabase, integridad referencial, secretos fuera de Git, operaciones asincronas, transacciones, compilacion sin advertencias y ejecucion local reproducible.

Entregable: alcance anterior y criterios de aceptacion por caso de uso.

## 2. Analisis y diseno

Se reemplazo el singleton en memoria por servicios de consulta/comando y EF Core. Se normalizo el modelo, se definieron cardinalidades, restricciones, indices, limites de seguridad y estrategia de conexion. Los diagramas estan en `ARCHITECTURE.md` y `DATABASE-MODEL.md`.

Entregable: arquitectura, modelo ER y migracion PostgreSQL revisables.

## 3. Implementacion

Se separaron entidades/configuraciones, se tiparon entradas, se trasladaron reglas a servicios, se agrego persistencia transaccional y se configuro Npgsql. SQLite conserva la posibilidad de demostracion sin secretos externos.

Entregable: codigo compilable y migracion versionada.

## 4. Verificacion

Criterios de salida:

- `dotnet restore` finaliza correctamente.
- `dotnet build --no-restore` produce cero advertencias y cero errores.
- El analisis de paquetes no reporta vulnerabilidades conocidas.
- Login y todas las rutas operativas responden HTTP 200.
- Los cinco comandos principales muestran confirmacion y persisten cambios.
- La migracion se aplica solo al proyecto autorizado de Supabase.
- Los asesores de seguridad y rendimiento de Supabase no presentan errores criticos atribuibles al esquema.

Entregable: registro de comprobaciones y aplicacion levantada.

## 5. Despliegue y mantenimiento

Se configura la cadena mediante secretos, se aplica cada migracion en orden, se valida `/Database` y se supervisan logs. Cada cambio posterior debe iniciar una nueva iteracion formal: requisito, analisis de impacto, diseno, implementacion, prueba, aprobacion y migracion nueva.

## Matriz de trazabilidad

| Requisito | Diseno/implementacion | Verificacion |
|---|---|---|
| Autenticacion y roles | `UserAccessService`, cookies y politicas MVC | login y acceso autorizado |
| Ventas y pagos | `RegisterCdpAsync`, tablas `ventas`, `detalles_venta`, `pagos` | POST de CDP y reporte |
| Recepcion e inventario | transaccion de ingreso y movimientos | POST de ingreso y stock actualizado |
| Compras y cotizaciones | solicitudes, detalles y union M:N | POST de ambos formularios |
| Reclamos | relacion con cliente, venta, producto y usuario | POST y bandeja de seguimiento |
| Supabase seguro | esquema privado, RLS, secretos externos | migracion y asesores |
