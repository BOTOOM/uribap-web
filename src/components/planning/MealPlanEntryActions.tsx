"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MealPlanEntryActions({
  planId,
  entryId,
  version,
  editable,
}: {
  planId: string;
  entryId: string;
  version: number;
  editable: boolean;
}) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!editable) return null;

  async function remove() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/plans/${planId}/entries/${entryId}?expected_version=${version}`,
        { method: "DELETE", headers: { "Idempotency-Key": idempotencyKey } },
      );
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo quitar la comida.");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo quitar la comida.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span>
      <button type="button" disabled={pending} onClick={remove} aria-label="Quitar del plan">
        {pending ? "Quitando…" : "Quitar"}
      </button>
      {message ? <span role="status">{message}</span> : null}
    </span>
  );
}
