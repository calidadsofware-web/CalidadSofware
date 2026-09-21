import { useState } from "react";
import { hasAccess } from "../../access";
import { CollectionTable } from "../../components/CollectionTable";
import { PageHeader } from "../../components/PageHeader";
import type { AppCommand, AppData, Client } from "../../types";
import { ClientEditor } from "./ClientEditor";

export function ClientsPage({ data, command }: { data: AppData; command: AppCommand }) {
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const allowed = hasAccess(data.user.role, "sales");
  return (
    <>
      <PageHeader
        title="Clientes"
        description="Datos de contacto e identificación para tus ventas."
        action={
          allowed && (
            <button type="button" className="primary" onClick={() => setEditing("new")}>
              Nuevo cliente
            </button>
          )
        }
      />
      <CollectionTable
        title="Directorio de clientes"
        rows={data.clients}
        placeholder="Nombre, documento, teléfono o correo"
        filters={[["status", "Estado"]]}
        columns={[
          ["fullName", "Cliente"],
          ["document", "Documento"],
          ["phone", "Teléfono"],
          ["email", "Correo"],
          ["lastPurchase", "Última compra"],
          ["status", "Estado"],
        ]}
        actions={
          allowed
            ? (row) => (
                <button
                  type="button"
                  className="quiet"
                  onClick={() => setEditing(row as unknown as Client)}
                  aria-label={`Editar ${row.fullName}`}
                >
                  Editar
                </button>
              )
            : undefined
        }
      />
      {editing && (
        <ClientEditor
          client={editing === "new" ? undefined : editing}
          command={command}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
