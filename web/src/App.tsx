import { FullScreenMessage } from "./components/FullScreenMessage";
import { useAuth } from "./hooks/useAuth";
import { DataCellShell } from "./layouts/DataCellShell";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const { identityUser, loading } = useAuth();

  if (loading) {
    return <FullScreenMessage title="Preparando DataCell" text="Validando la sesión segura..." />;
  }

  return identityUser ? <DataCellShell /> : <LoginPage />;
}
