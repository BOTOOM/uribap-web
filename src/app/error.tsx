'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="foundation-shell" role="alert">
      <p className="eyebrow">Uribap</p>
      <h1>No pudimos abrir el hogar.</h1>
      <p className="lede">Vuelve a intentarlo; tus datos no se modificaron.</p>
      <button className="status status-ready" type="button" onClick={reset}>
        Intentar de nuevo
      </button>
    </main>
  );
}
