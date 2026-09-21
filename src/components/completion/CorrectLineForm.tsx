"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CorrectLineForm({
  completionId,
  lineId,
  version,
  currentAmount,
  unit,
}: {
  completionId: string;
  lineId: string;
  version: number;
  currentAmount: string;
  unit: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(currentAmount);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setConflict(false);
    try {
      const response = await fetch(
        `/api/meal-completions/${completionId}/lines/${lineId}/correct`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            expected_version: version,
            actual_amount: amount,
            unit,
          }),
        },
      );
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        if (response.status === 409) setConflict(true);
        throw new Error(body?.detail ?? "No se pudo corregir la línea.");
      }
      setIdempotencyKey(crypto.randomUUID());
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo corregir la línea.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        Corregir
      </button>
    );
  }

  return (
    <form onSubmit={submit}>
      <label>
        Cantidad real ({unit})
        <input
          type="number"
          min="0.000001"
          step="0.000001"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <button type="button" disabled={pending} onClick={() => setOpen(false)}>
        Cancelar
      </button>
      {message ? <span role="status">{message}</span> : null}
      {conflict ? (
        <button type="button" onClick={() => router.refresh()}>
          Recargar
        </button>
      ) : null}
    </form>
  );
}
