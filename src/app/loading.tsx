export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" className="auth-shell">
      <section className="card auth-card">
        <span
          aria-hidden="true"
          className="skeleton"
          style={{ width: 44, height: 44, borderRadius: 14 }}
        />
        <p className="muted">Cargando el espacio del hogar…</p>
      </section>
    </main>
  );
}
