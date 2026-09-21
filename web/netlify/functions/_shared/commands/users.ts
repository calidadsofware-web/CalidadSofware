import { hashPassword, POLICIES, requireRole, type AppUser } from "../auth.js";
import { withTransaction } from "../db.js";
import { HttpError } from "../http.js";
import { emailField, numberField, optionField, textField, type Fields } from "./fields.js";

export async function saveUser(input: Fields, user: AppUser): Promise<string> {
  requireRole(user, POLICIES.administration);
  const role = optionField(input.role, ["CAJERO", "ALMACEN", "ASISTENTE_COMPRAS"], "Rol");
  const firstName = textField(input.firstName, "Nombres", 80, true);
  const lastName = textField(input.lastName, "Apellidos", 80, true);
  const email = emailField(input.email, true);
  const status = optionField(input.status ?? "ACTIVO", ["ACTIVO", "INACTIVO"], "Estado");
  let hash: string | null = null;
  if (!input.id) {
    const password = typeof input.password === "string" ? input.password : "";
    if (password.length < 12 || password.length > 128)
      throw new HttpError(400, "La contraseña debe tener entre 12 y 128 caracteres.");
    hash = await hashPassword(password);
  }
  return withTransaction(async (client) => {
    if (input.id) {
      const id = numberField(input.id, "Usuario", 1, true);
      if (id === user.id)
        throw new HttpError(403, "No puedes modificar tu propia cuenta desde esta pantalla.");
      const result = await client.query(
        "update public.usuarios set nombres=$1,apellidos=$2,correo=$3,id_rol=(select id_rol from public.roles where nombre=$4),estado=$5 where id_usuario=$6 and id_rol in (select id_rol from public.roles where nombre <> 'ADMINISTRADOR') returning id_usuario",
        [firstName, lastName, email, role, status, id],
      );
      if (!result.rowCount)
        throw new HttpError(403, "Solo puedes administrar cuentas de cajeros, almacén y compras.");
    } else
      await client.query(
        "insert into public.usuarios(nombres,apellidos,correo,id_rol,estado,password_hash) values($1,$2,$3,(select id_rol from public.roles where nombre=$4),$5,$6)",
        [firstName, lastName, email, role, status, hash],
      );
    return input.id
      ? "Usuario actualizado. Los permisos se verifican en cada operación."
      : "Usuario creado. Ya puede iniciar sesión con el rol asignado.";
  });
}
