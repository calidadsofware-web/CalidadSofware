# Base heredada

`DataCellDB.sql` es la fuente MySQL recibida y se conserva para auditoria y comparacion. Ya no es el esquema que ejecuta la aplicacion.

La version corregida y normalizada para PostgreSQL/Supabase se encuentra en la secuencia de `../supabase/migrations/`. Cualquier dato real que exista solamente en una instancia MySQL debe exportarse de forma controlada y validarse antes de importarlo; las migraciones versionadas contienen los datos demo disponibles en este repositorio y dejan el modelo final en `public`.
