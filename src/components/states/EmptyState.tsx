import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section aria-labelledby="empty-state-title" className="card">
      <div className="empty">
        <strong id="empty-state-title">{title}</strong>
        <p>{description}</p>
        {action}
      </div>
    </section>
  );
}
