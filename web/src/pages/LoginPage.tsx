import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

interface LoginPageProps {
  checkingSession?: boolean;
}

export function LoginPage({ checkingSession = false }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-overlay" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <img
          className="login-logo"
          src="/media/brand-mark-v1.png"
          width="54"
          height="54"
          alt="DataCell"
          decoding="async"
        />
        <p className="eyebrow">Intranet comercial</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="muted" role={checkingSession ? "status" : undefined}>
          {checkingSession
            ? "Comprobando si ya existe una sesión segura..."
            : "Ingresa con las credenciales asignadas por el administrador."}
        </p>
        <form
          onSubmit={submit}
          aria-busy={checkingSession || submitting}
          aria-describedby={error ? "login-error" : undefined}
        >
          <label htmlFor="login-email">
            Correo electrónico
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              disabled={checkingSession}
              required
            />
          </label>
          <label htmlFor="login-password">
            Contraseña
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={checkingSession}
              required
            />
          </label>
          {error && (
            <p id="login-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary full" type="submit" disabled={checkingSession || submitting}>
            {(checkingSession || submitting) && <span className="button-spinner" aria-hidden="true" />}
            {checkingSession ? "Comprobando sesión..." : submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
