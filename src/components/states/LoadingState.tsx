export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return <div className="ui-state ui-state-loading" role="status" aria-live="polite">{label}</div>;
}
