import Link from "next/link";
import type { Route } from "next";

export function PermissionState({ forbidden = false }: { forbidden?: boolean }) {
  const titleId = forbidden
    ? "permission-state-title-forbidden"
    : "permission-state-title-login";

  return (
    <section aria-labelledby={titleId} className="card" role="alert">
      <div className="empty">
        <strong id={titleId}>
          {forbidden ? "Este hogar no está disponible" : "Necesitas entrar para continuar"}
        </strong>
        <p>
          {forbidden
            ? "Pide acceso a una persona administradora del hogar."
            : "Inicia sesión para ver datos privados del hogar."}
        </p>
        <Link className="btn btn-secondary" href={"/" as Route}>
          Volver al resumen
        </Link>
      </div>
    </section>
  );
}

export function StaleState({ retryHref = "/" as Route }: { retryHref?: Route }) {
  return (
    <section aria-labelledby="stale-state-title" className="card" role="status">
      <div className="empty">
        <strong id="stale-state-title">Estos datos pueden estar desactualizados</strong>
        <p>Hay un cambio pendiente de confirmar con el servidor.</p>
        <Link className="btn btn-secondary" href={retryHref}>
          Actualizar
        </Link>
      </div>
    </section>
  );
}

export function UnavailableState() {
  return (
    <section aria-labelledby="unavailable-state-title" className="card" role="alert">
      <div className="empty">
        <strong id="unavailable-state-title">El servicio no responde</strong>
        <p>El hogar no cambió. Comprueba tu conexión e inténtalo de nuevo.</p>
        <Link className="btn btn-secondary" href="/">
          Volver al resumen
        </Link>
      </div>
    </section>
  );
}
