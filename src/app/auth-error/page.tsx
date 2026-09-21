import Link from "next/link";
import type { Route } from "next";

export default function AuthErrorPage() {
  return (
    <main className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="auth-error-title">
        <p className="eyebrow">Uribap · acceso</p>
        <h1 id="auth-error-title">No pudimos completar el acceso.</h1>
        <p className="lede">El intento no cambió ningún dato del hogar. Vuelve a intentarlo sin compartir códigos ni credenciales.</p>
        <Link className="status status-ready" href={"/login" as Route}>Intentar de nuevo</Link>
      </section>
    </main>
  );
}
