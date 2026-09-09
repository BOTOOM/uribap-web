import Link from "next/link";
import type { Route } from "next";

export function PermissionState({ forbidden = false }: { forbidden?: boolean }) {
  const titleId = forbidden ? "permission-state-title-forbidden" : "permission-state-title-login";

  return (
    <section className="ui-state" role="alert" aria-labelledby={titleId}>
      <h2 id={titleId}>{forbidden ? "Este hogar no está disponible" : "Necesitas entrar para continuar"}</h2>
      <p>{forbidden ? "Pide acceso a una persona administradora del hogar." : "Inicia sesión para ver datos privados del hogar."}</p>
      <Link className="status status-ready" href={"/" as Route}>Volver al resumen</Link>
    </section>
  );
}

export function StaleState({ retryHref = "/" as Route }: { retryHref?: Route }) {
  return (
    <section className="ui-state" role="status" aria-labelledby="stale-state-title">
      <h2 id="stale-state-title">Estos datos pueden estar desactualizados</h2>
      <p>Hay un cambio pendiente de confirmar con el servidor.</p>
      <Link className="status status-warning" href={retryHref}>Actualizar</Link>
    </section>
  );
}

export function UnavailableState() {
  return (
    <section className="ui-state ui-state-error" role="alert" aria-labelledby="unavailable-state-title">
      <h2 id="unavailable-state-title">El servicio no responde</h2>
      <p>El hogar no cambió. Comprueba tu conexión e inténtalo de nuevo.</p>
      <Link className="status status-ready" href="/">Volver al resumen</Link>
    </section>
  );
}
