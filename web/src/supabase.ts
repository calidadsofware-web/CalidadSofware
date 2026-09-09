import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigurationError = !url || !publishableKey
  ? "Falta configurar Supabase Auth para DataCell."
  : null;

// The fallback is never used for authentication: AuthProvider stops before a
// request when configuration is missing. It keeps a deployment misconfiguration
// from crashing React before it can display a helpful message.
export const supabase = createClient(url ?? "https://invalid.supabase.co", publishableKey ?? "not-configured", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
