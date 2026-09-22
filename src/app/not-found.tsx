import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <p className="eyebrow">Uribap · 404</p>
        <h1>Esta vista todavía no existe.</h1>
        <p className="muted">Regresa al espacio principal para continuar con tu hogar.</p>
        <div style={{ marginTop: 18 }}>
          <Link className="btn btn-secondary" href="/">
            Volver al resumen
          </Link>
        </div>
      </section>
    </main>
  );
}
