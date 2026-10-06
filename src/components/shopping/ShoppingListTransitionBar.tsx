"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type ListState = components["schemas"]["ShoppingListState"];

const ACTIONS_BY_STATE: Record<ListState, Array<{ action: string; label: string }>> = {
  open: [
    { action: "complete", label: "Completar" },
    { action: "archive", label: "Archivar" },
  ],
  completed: [
    { action: "reopen", label: "Reabrir" },
    { action: "archive", label: "Archivar" },
  ],
  archived: [],
};

export function ShoppingListTransitionBar({
  listId,
  state,
  version,
}: {
  listId: string;
  state: ListState;
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
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ expected_version: version }),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (response.status === 409) {
        setConflict(true);
        throw new Error(body?.detail ?? "La lista cambió desde que se cargó.");
      }
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo actualizar la lista.");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la lista.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div aria-label="Acciones de la lista" className="planner-actions" role="group" style={{ marginLeft: 0 }}>
      {ACTIONS_BY_STATE[state].map(({ action, label }, index) => (
        <button
          className={index === 0 ? "btn btn-secondary" : "btn btn-ghost"}
          disabled={pending !== null}
          key={action}
          onClick={() => transition(action)}
          type="button"
        >
          {pending === action ? "Aplicando…" : label}
        </button>
      ))}
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
      {conflict ? (
        <button className="btn btn-secondary" type="button" onClick={() => router.refresh()}>
          Recargar lista actualizada
        </button>
      ) : null}
    </div>
  );
}
