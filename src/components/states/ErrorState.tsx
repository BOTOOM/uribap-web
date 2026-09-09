import Link from "next/link";
import type { Route } from "next";

export function ErrorState({ title, description, actionHref = "/", actionLabel = "Volver al resumen" }: { title: string; description: string; actionHref?: Route; actionLabel?: string }) {
  return (
    <section className="ui-state ui-state-error" role="alert" aria-labelledby="error-state-title">
      <h2 id="error-state-title">{title}</h2>
      <p>{description}</p>
      <Link className="status status-ready" href={actionHref}>{actionLabel}</Link>
    </section>
  );
}
