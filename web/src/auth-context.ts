import { createContext } from "react";
import type { AppData, AppUser } from "./types";

export interface AuthValue {
  identityUser: AppUser | null;
  initialData: AppData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);
