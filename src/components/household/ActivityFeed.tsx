"use client";

import { useState } from "react";

type ActivityEntry = {
  id: string;
  kind: string;
  occurredAt: string;
  aggregateType: string;
  aggregateId: string | null;
  actorUserId: string | null;
  payload: Record<string, unknown>;
};

type OutboxSummary = {
  pending: number;
  sent: number;
  failed: number;
  suppressed: number;
};

type FeedPage = {
  entries: ActivityEntry[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const KIND_LABELS: Record<string, string> = {
  "household.member_added": "Miembro añadido",
  "household.member_removed": "Miembro eliminado",
  "invitation.created": "Invitación creada",
  "invitation.accepted": "Invitación aceptada",
  "invitation.revoked": "Invitación revocada",
  "plan.approved": "Plan aprobado",
  "plan.reopened": "Plan reabierto",
  "shopping.purchased": "Compra registrada",
  "preparation.task_completed": "Tarea de preparación completada",
  "preparation.task_cancelled": "Tarea de preparación cancelada",
  "meal.completed": "Comida completada",
  "meal.reopened": "Comida reabierta",
  "meal.line_corrected": "Línea de comida corregida",
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ActivityFeed({ initialFeed, outbox }: {
  initialFeed: FeedPage;
  outbox: OutboxSummary;
}) {
  const [entries, setEntries] = useState(initialFeed.entries);
  const [page, setPage] = useState(initialFeed.page);
  const [hasMore, setHasMore] = useState(initialFeed.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/households/activity?page=${page + 1}&page_size=${initialFeed.pageSize}`,
      );
      const result = (await response.json().catch(() => null)) as
        | (FeedPage & { detail?: string })
        | null;
      if (!response.ok || !result) {
        throw new Error(result?.detail ?? "No se pudo cargar más actividad.");
      }
      setEntries((current) => [...current, ...result.entries]);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar más actividad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <dl
        aria-label="Resumen de correo"
        className="grid grid-4"
        role="group"
        style={{ marginBottom: 14 }}
      >
        <div className="quantity-box">
          <span>Pendiente</span>
          <strong>{outbox.pending}</strong>
        </div>
        <div className="quantity-box">
          <span>Enviado</span>
          <strong>{outbox.sent}</strong>
        </div>
        <div className="quantity-box">
          <span>Fallido</span>
          <strong>{outbox.failed}</strong>
        </div>
        <div className="quantity-box">
          <span>Suprimido</span>
          <strong>{outbox.suppressed}</strong>
        </div>
      </dl>
      <p className="helper">
        El envío de email está deshabilitado: los avisos suprimidos se registran sin enviarse.
      </p>
      {entries.length === 0 ? (
        <p className="muted" role="status">
          Todavía no hay actividad registrada en este hogar.
        </p>
      ) : (
        <div className="detail-list">
          {entries.map((entry) => (
            <div className="detail-row" key={entry.id}>
              <div>
                <span className="meal-name">{KIND_LABELS[entry.kind] ?? entry.kind}</span>
                <span className="meta" style={{ display: "block" }}>
                  <time dateTime={entry.occurredAt}>{formatTimestamp(entry.occurredAt)}</time>
                </span>
              </div>
              <span className="meta">{entry.aggregateType}</span>
              <span />
            </div>
          ))}
        </div>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {hasMore ? (
        <button
          aria-busy={loading}
          className="btn btn-secondary"
          disabled={loading}
          onClick={loadMore}
          style={{ marginTop: 14 }}
          type="button"
        >
          {loading ? "Cargando…" : "Cargar más"}
        </button>
      ) : null}
    </div>
  );
}
