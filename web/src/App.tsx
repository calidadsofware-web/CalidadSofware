import { useAuth } from "./hooks/useAuth";
import { DataCellShell } from "./layouts/DataCellShell";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const { identityUser, initialData, loading } = useAuth();

  if (identityUser) return <DataCellShell initialData={initialData} />;
  return <LoginPage checkingSession={loading} />;
}
