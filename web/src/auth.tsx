import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentSession, signIn as requestSignIn, signOut as requestSignOut } from "./api";
import type { AppUser } from "./types";

interface AuthValue {
  identityUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identityUser, setIdentityUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCurrentSession().then((user) => {
      if (active) {
        setIdentityUser(user);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthValue>(() => ({
    identityUser,
    loading,
    signIn: async (email, password) => {
      setIdentityUser(await requestSignIn(email, password));
    },
    signOut: async () => {
      await requestSignOut();
      setIdentityUser(null);
    },
  }), [identityUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  return value;
}
