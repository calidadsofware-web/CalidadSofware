import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

interface AuthValue {
  identityUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identityUser, setIdentityUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIdentityUser(session?.user ?? null);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setIdentityUser(data.session?.user ?? null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(() => ({
    identityUser,
    loading,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) throw error ?? new Error("No fue posible iniciar sesión.");
      setIdentityUser(data.user);
    },
    signOut: async () => {
      await supabase.auth.signOut();
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
