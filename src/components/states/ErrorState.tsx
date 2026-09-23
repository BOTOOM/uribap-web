import Link from "next/link";
import type { Route } from "next";

import { Icon } from "@/components/ui/Icon";

export function ErrorState({
  title,
  description,
  actionHref = "/",
  actionLabel = "Volver al resumen",
}: {
  title: string;
  description: string;
  actionHref?: Route;
  actionLabel?: string;
}) {
  return (
    <section aria-labelledby="error-state-title" className="card" role="alert">
      <div className="empty">
        <span
          aria-hidden="true"
          className="task-icon tone-warning"
          style={{ marginBottom: 12 }}
        >
          <Icon name="close" size={18} />
        </span>
        <strong id="error-state-title">{title}</strong>
        <p>{description}</p>
        <Link className="btn btn-secondary" href={actionHref}>
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
