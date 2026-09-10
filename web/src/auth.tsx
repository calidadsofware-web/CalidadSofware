import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentSession, signIn as requestSignIn, signOut as requestSignOut } from "./api";
import { AuthContext, type AuthValue } from "./auth-context";
import type { AppData, AppUser } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identityUser, setIdentityUser] = useState<AppUser | null>(null);
  const [initialData, setInitialData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCurrentSession()
      .catch(() => ({ user: null, appData: null }))
      .then((session) => {
        if (active) {
          setIdentityUser(session.user);
          setInitialData(session.appData);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      identityUser,
      initialData,
      loading,
      signIn: async (email, password) => {
        setInitialData(null);
        setIdentityUser(await requestSignIn(email, password));
      },
      signOut: async () => {
        await requestSignOut();
        setInitialData(null);
        setIdentityUser(null);
      },
    }),
    [identityUser, initialData, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
