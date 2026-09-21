# DataCell

Aplicación web de gestión comercial, compras e inventario. Está construida con React, Vite, Netlify Functions y PostgreSQL en Supabase. La autenticación se realiza exclusivamente contra `public.usuarios`.

## Ejecutar localmente

```powershell
cd web
npm install
npm run dev:local
```

Abre `http://127.0.0.1:5173`. Este modo usa las funciones y consultas reales sobre una base PostgreSQL embebida para desarrollo (PGlite), inicializada desde el esquema existente. **No usa credenciales de producción ni se conecta a Supabase o Netlify.** Las modificaciones se conservan en `web/.local-data/`, excluida de Git. Los puertos 5173 y 55432 se exponen únicamente en `127.0.0.1`.

Accesos exclusivos del entorno local: `admin@local.test`, `caja@local.test`, `almacen@local.test` y `compras@local.test`. Contraseña de demostración: `Local-demo-2026!`. Estas cuentas son solo para pruebas; no se agregan a producción. Al reiniciar el servidor se debe iniciar sesión nuevamente.

Para comprobar el proyecto: `npm run quality` ejecuta tipos, lint, pruebas, formato y compilación. `npm run coverage` genera el informe de cobertura local. Las pruebas de integración crean una base desechable en memoria; no usan datos de producción.

El modo conectado existente continúa disponible con `npx netlify dev` desde la raíz, tras configurar `web/.env` a partir de `web/.env.example`. **No lo utilices para pruebas aisladas si esas variables apuntan a producción.**

## Flujos de trabajo

- **Venta:** seleccionar o crear cliente, buscar y agregar productos, revisar cantidades e IGV, verificar efectivo/vuelto o referencia del pago y confirmar. Ventas e inventario se registran en una transacción. El historial muestra el detalle del comprobante interno.
- **Clientes, productos y proveedores:** alta y edición con identificación, contacto, precios, clasificación y estado. Buscadores, filtros, ordenación y paginación. Inactivar conserva el historial; no hay eliminación de operaciones comerciales.
- **Inventario:** recepción contra saldo de orden, entregas parciales y ajustes justificados con responsable. La ficha del producto no modifica directamente el stock existente.
- **Compras:** solicitud con necesidad, prioridad, fecha y productos; el administrador aprueba o rechaza. La aprobación crea la orden; la recepción completa actualiza la solicitud a atendida.
- **Cotizaciones:** solicitudes a proveedores identificados individualmente, productos, condiciones, fecha límite y cancelación justificada. El envío se coordina fuera del sistema.
- **Reclamos:** cliente y comprobante relacionado, motivo, canal y seguimiento: registrado → en revisión → atendido → cerrado.
- **Equipo y permisos:** el administrador crea y edita cuentas operativas, asigna rol y las inactiva. No puede crear otros administradores ni modificar su propia cuenta desde esta pantalla. La autorización se verifica también en el servidor.

| Rol | Operaciones principales |
| --- | --- |
| Administrador | Todos los módulos; aprobación de compras y administración de cuentas operativas |
| Cajero | Ventas, clientes, pagos y reclamos; consulta de productos sin costos de compra |
| Almacén | Catálogo, ajustes, recepciones y solicitudes de abastecimiento; consulta de proveedores |
| Asistente de compras | Proveedores, solicitudes y cotizaciones; no aprueba compras ni modifica stock |

El inicio presenta acciones y pendientes, sin tarjetas KPI. La navegación agrupa comercial, abastecimiento y administración. Los módulos y componentes compartidos están separados en `web/src/features/`, `web/src/components/` y `web/src/layouts/`; los comandos de negocio están en `web/netlify/functions/_shared/commands/`.

## Límites funcionales

Los pagos son registros internos: no se cobran tarjetas ni se integran pasarelas. Los comprobantes no se emiten ante SUNAT. No se envían correos automáticamente. El catálogo y las tablas se paginan en el navegador; un volumen grande de datos requerirá paginación de servidor. Esta ampliación no cambia el esquema de producción ni despliega automáticamente los cambios.

## Usuarios iniciales

| Usuario | Correo | Rol |
| --- | --- | --- |
| Gerardo Favian Palacios Bazan | gerardofavianpalaciosbazan@gmail.com | Administrador |
| Joel Alexander Diaz Gutierrez | joelalexanderdiazgutierrez@gmail.com | Asistente de compras |
| Luis Fabricio Durand Durand | luisfabricioduranddurand@gmail.com | Almacén |
| Marlon Mario Piscoya Jayme | marlonmariopiscoyajayme@gmail.com | Cajero |
| Roberto Jim Marlo Garcia Esquen | robertojimmarlogarciaesquen@gmail.com | Administrador |

Las contraseñas se guardan únicamente como hashes `scrypt` con sal individual; no se guardan ni se publican como texto plano. Deben cambiarse antes de usar el sistema en operación real.

## Base de datos

El único esquema fuente vigente está en [supabase/schema.sql](supabase/schema.sql). Todas las tablas están en `public`, tienen RLS habilitado y no conceden acceso directo a `anon` ni `authenticated`; las operaciones de negocio, incluida la autenticación, se realizan mediante funciones de Netlify con secretos de servidor.
