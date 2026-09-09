# DataCell

Aplicación web de gestión comercial, compras e inventario. Está construida con React, Vite, Netlify Functions y PostgreSQL en Supabase. La autenticación se realiza exclusivamente contra `public.usuarios`.

## Ejecutar localmente

```powershell
cd web
npm install
npm run build
```

Para ejecutar con funciones y variables de Netlify, copie `web/.env.example` como `web/.env`, complete sus valores y use `npx netlify dev` desde la raíz del proyecto.

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
