import { useRef, useState, type FormEvent } from "react";
import { CollectionTable } from "../../components/CollectionTable";
import { PageHeader } from "../../components/PageHeader";
import { Modal } from "../../components/Modal";
import type { AppCommand, AppData, AppRole, ManagedUser } from "../../types";
import { isActive } from "../../utils/format";

const roleHelp: Record<AppRole, string> = {
  ADMINISTRADOR: "Control administrativo completo.",
  CAJERO: "Registra ventas y clientes. Consulta pagos y gestiona reclamos.",
  ALMACEN: "Mantiene productos, ajusta inventario, recibe compras y solicita abastecimiento.",
  ASISTENTE_COMPRAS: "Mantiene proveedores y gestiona solicitudes y cotizaciones. No aprueba compras.",
};
export function UsersPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [editing, setEditing] = useState<ManagedUser | "new" | null>(null),
    [role, setRole] = useState<AppRole>("CAJERO");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [showPassword, setShowPassword] = useState(false);
  const lock = useRef(false);
  const user = editing === "new" ? undefined : editing;
  function open(value: ManagedUser | "new") {
    setEditing(value);
    setRole(value === "new" ? "CAJERO" : value.role);
    setError("");
    setShowPassword(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    if (!user && fields.password !== fields.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await command("save-user", {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        password: fields.password,
        role,
        status: fields.status,
        id: user?.id,
      });
      setEditing(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el usuario.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Equipo y permisos"
        description="Crea cuentas operativas y asigna responsabilidades."
        action={
          <button className="primary" type="button" onClick={() => open("new")}>
            Nuevo usuario
          </button>
        }
      />
      <CollectionTable
        title="Usuarios del sistema"
        rows={data.users ?? []}
        placeholder="Nombre o correo del usuario"
        filters={[
          ["roleDisplay", "Rol"],
          ["status", "Estado"],
        ]}
        columns={[
          ["fullName", "Nombre"],
          ["email", "Correo de acceso"],
          ["roleDisplay", "Rol"],
          ["status", "Estado"],
          ["createdAt", "Registro"],
        ]}
        actions={(row) =>
          row.role === "ADMINISTRADOR" ? (
            <span className="field-hint">Cuenta administradora</span>
          ) : (
            <button
              type="button"
              className="quiet"
              onClick={() => open(row as unknown as ManagedUser)}
              aria-label={`Editar ${row.fullName}`}
            >
              Editar
            </button>
          )
        }
      />
      {editing && (
        <Modal
          title={user ? "Editar usuario" : "Nuevo usuario"}
          onClose={() => setEditing(null)}
          busy={busy}
          warnOnClose
        >
          <form onSubmit={submit} className="form-layout">
            <fieldset disabled={busy}>
              <legend>Datos del colaborador</legend>
              <div className="form-grid">
                <label>
                  Nombres
                  <input
                    name="firstName"
                    required
                    maxLength={80}
                    defaultValue={user?.firstName}
                    autoComplete="off"
                  />
                </label>
                <label>
                  Apellidos
                  <input
                    name="lastName"
                    required
                    maxLength={80}
                    defaultValue={user?.lastName}
                    autoComplete="off"
                  />
                </label>
                <label className="span-2">
                  Correo de acceso
                  <input
                    name="email"
                    required
                    type="email"
                    maxLength={120}
                    defaultValue={user?.email}
                    autoComplete="off"
                    placeholder="colaborador@empresa.com"
                  />
                </label>
                <label>
                  Rol
                  <select value={role} onChange={(event) => setRole(event.target.value as AppRole)}>
                    <option value="CAJERO">Cajero</option>
                    <option value="ALMACEN">Almacén</option>
                    <option value="ASISTENTE_COMPRAS">Asistente de compras</option>
                  </select>
                </label>
                <label>
                  Estado
                  <select name="status" defaultValue={isActive(user?.status) ? "ACTIVO" : "INACTIVO"}>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </label>
              </div>
              <p className="permission-note">{roleHelp[role]}</p>
            </fieldset>
            {!user && (
              <fieldset disabled={busy}>
                <legend>Acceso inicial</legend>
                <div className="form-grid">
                  <label>
                    Contraseña inicial
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    Confirmar contraseña
                    <input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                </div>
                <button type="button" className="quiet" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                </button>
                <p className="field-hint">
                  Usa una frase de al menos 12 caracteres. Entrega el acceso directamente al colaborador; no
                  se envía por correo.
                </p>
              </fieldset>
            )}
            {user && (
              <p className="field-hint">
                Inactivar impide el acceso y conserva el historial. No se pueden crear ni modificar
                administradores desde este módulo.
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Guardando..." : "Guardar usuario"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
