import { useAuth } from "./hooks/useAuth";
import { DataCellShell } from "./layouts/DataCellShell";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const { identityUser, loading } = useAuth();

  if (identityUser) return <DataCellShell />;
  return <LoginPage checkingSession={loading} />;
}
