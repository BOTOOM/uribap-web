export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div aria-live="polite" className="card" role="status">
      <div className="empty">
        <span aria-hidden="true" className="skeleton" style={{ width: 44, height: 44, borderRadius: 14 }} />
        <strong>{label}</strong>
      </div>
    </div>
  );
}
