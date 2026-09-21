"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type PlanState = components["schemas"]["MealPlanState"];

const ACTIONS_BY_STATE: Record<PlanState, Array<{ action: string; label: string }>> = {
  draft: [
    { action: "propose", label: "Proponer" },
    { action: "archive", label: "Archivar" },
  ],
  proposed: [
    { action: "approve", label: "Aprobar" },
    { action: "reopen", label: "Devolver a borrador" },
    { action: "archive", label: "Archivar" },
  ],
  approved: [
    { action: "reopen", label: "Reabrir" },
    { action: "archive", label: "Archivar" },
  ],
  archived: [],
};

export function MealPlanTransitionBar({
  planId,
  state,
  version,
}: {
  planId: string;
  state: PlanState;
  version: number;
}) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function transition(action: string) {
    setPending(action);
    setMessage(null);
    setConflict(false);
    const note =
      action === "reopen" && state === "approved"
        ? window.prompt("Motivo para reabrir el plan aprobado") ?? null
        : null;
    if (action === "reopen" && state === "approved" && !note) {
      setPending(null);
      return;
    }
    const payload: components["schemas"]["MealPlanTransition"] = {
      expected_version: version,
      note,
    };
    try {
      const response = await fetch(`/api/plans/${planId}/transitions/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (response.status === 409) {
        setConflict(true);
        throw new Error(body?.detail ?? "El plan cambió desde que se cargó.");
      }
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo actualizar el plan.");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el plan.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="foundation-actions" role="group" aria-label="Acciones del plan">
      {ACTIONS_BY_STATE[state].map(({ action, label }) => (
        <button
          key={action}
          className="status status-ready"
          disabled={pending !== null}
          onClick={() => transition(action)}
          type="button"
        >
          {pending === action ? "Aplicando…" : label}
        </button>
      ))}
      {message ? <p role="status">{message}</p> : null}
      {conflict ? (
        <button type="button" onClick={() => router.refresh()}>
          Recargar plan actualizado
        </button>
      ) : null}
    </div>
  );
}
