import Link from "next/link";
import type { Route } from "next";

export default function AuthErrorPage() {
  return (
    <main className="auth-shell">
      <section aria-labelledby="auth-error-title" className="card auth-card">
        <p className="eyebrow">Uribap · acceso</p>
        <h1 id="auth-error-title">No pudimos completar el acceso.</h1>
        <p className="muted">
          El intento no cambió ningún dato del hogar. Vuelve a intentarlo sin compartir
          códigos ni credenciales.
        </p>
        <div style={{ marginTop: 18 }}>
          <Link className="btn btn-primary" href={"/login" as Route}>
            Intentar de nuevo
          </Link>
        </div>
      </section>
    </main>
  );
}
