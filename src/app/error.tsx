"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="auth-shell" role="alert">
      <section className="card auth-card">
        <p className="eyebrow">Uribap</p>
        <h1>No pudimos abrir el hogar.</h1>
        <p className="muted">Vuelve a intentarlo; tus datos no se modificaron.</p>
        <div style={{ marginTop: 18 }}>
          <button className="btn btn-primary" onClick={reset} type="button">
            Intentar de nuevo
          </button>
        </div>
      </section>
    </main>
  );
}
