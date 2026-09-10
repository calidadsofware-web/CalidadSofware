import { useContext } from "react";
import { AuthContext, type AuthValue } from "../auth-context";

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  return value;
}
