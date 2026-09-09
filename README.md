# DataCell

Aplicación web de gestión comercial, compras e inventario. Está construida con React, Vite, Netlify Functions, Supabase Auth y PostgreSQL en Supabase.

## Ejecutar localmente

```powershell
cd web
npm install
npm run build
```

Para ejecutar con funciones y variables de Netlify use `npx netlify dev` desde la raíz del proyecto.

## Usuarios iniciales

| Usuario | Correo | Rol | Contraseña inicial |
| --- | --- | --- | --- |
| Gerardo Favian Palacios Bazan | gerardofavianpalaciosbazan@gmail.com | Administrador | Gerardo123 |
| Joel Alexander Diaz Gutierrez | joelalexanderdiazgutierrez@gmail.com | Asistente de compras | Joel123 |
| Luis Fabricio Durand Durand | luisfabricioduranddurand@gmail.com | Almacén | Luis123 |
| Marlon Mario Piscoya Jayme | marlonmariopiscoyajayme@gmail.com | Cajero | Marlon123 |
| Roberto Jim Marlo Garcia Esquen | robertojimmarlogarciaesquen@gmail.com | Administrador | Roberto123 |

Las contraseñas iniciales deben cambiarse antes de usar el sistema en operación real.

## Base de datos

El único esquema fuente vigente está en [supabase/schema.sql](supabase/schema.sql). Todas las tablas están en `public`, tienen RLS habilitado y no conceden acceso directo a `anon` ni `authenticated`; las operaciones de negocio se realizan mediante funciones de Netlify con secretos de servidor.
