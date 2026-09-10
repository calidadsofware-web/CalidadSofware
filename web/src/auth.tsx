import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentSession, signIn as requestSignIn, signOut as requestSignOut } from "./api";
import { AuthContext, type AuthValue } from "./auth-context";
import type { AppUser } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identityUser, setIdentityUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCurrentSession()
      .catch(() => null)
      .then((user) => {
        if (active) {
          setIdentityUser(user);
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
      loading,
      signIn: async (email, password) => {
        setIdentityUser(await requestSignIn(email, password));
      },
      signOut: async () => {
        await requestSignOut();
        setIdentityUser(null);
      },
    }),
    [identityUser, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
