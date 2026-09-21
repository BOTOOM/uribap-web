"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CompleteMealButton({
  planId,
  entryId,
}: {
  planId: string;
  entryId: string;
}) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);

  async function complete() {
    setPending(true);
    setMessage(null);
    setConflict(false);
    try {
      const response = await fetch(`/api/plans/${planId}/entries/${entryId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({}),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        if (response.status === 409) setConflict(true);
        throw new Error(body?.detail ?? "No se pudo completar la comida.");
      }
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la comida.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span>
      <button type="button" disabled={pending} onClick={complete}>
        {pending ? "Completando…" : "Completar comida"}
      </button>
      {message ? <span role="status">{message}</span> : null}
      {conflict ? (
        <button type="button" onClick={() => router.refresh()}>
          Recargar
        </button>
      ) : null}
    </span>
  );
}
