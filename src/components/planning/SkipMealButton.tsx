"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/lib/toast";

export function SkipMealButton({
  planId,
  entryId,
}: {
  planId: string;
  entryId: string;
}) {
  const router = useRouter();
  const reasonId = useId();
  const formId = `${reasonId}-form`;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setConflict(false);
    try {
      const trimmedReason = reason.trim();
      const response = await fetch(`/api/plans/${planId}/entries/${entryId}/skip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(trimmedReason ? { reason: trimmedReason } : {}),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        if (response.status === 409) setConflict(true);
        throw new Error(body?.detail ?? "No se pudo marcar la comida como no cocinada.");
      }
      toast("Comida marcada como no cocinada — inventario sin cambios");
      setIdempotencyKey(crypto.randomUUID());
      setReason("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo marcar la comida como no cocinada.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="skip-meal">
      <button
        aria-controls={open ? formId : undefined}
        aria-expanded={open}
        className="btn btn-secondary"
        onClick={() => {
          setOpen(true);
          setMessage(null);
          setConflict(false);
        }}
        type="button"
      >
        Pedimos domicilio
      </button>
      {open ? (
        <form
          aria-label="Marcar comida como domicilio"
          className="skip-meal-form"
          id={formId}
          onSubmit={submit}
        >
          <div className="field">
            <label className="field-label" htmlFor={reasonId}>
              ¿Qué pasó? (opcional)
            </label>
            <input
              className="input"
              id={reasonId}
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="skip-meal-actions">
            <button className="btn btn-primary" disabled={pending} type="submit">
              {pending ? "Guardando…" : "Confirmar"}
            </button>
            <button
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setMessage(null);
                setConflict(false);
              }}
              type="button"
            >
              Cancelar
            </button>
          </div>
          {message ? (
            <p className="form-status error" role="alert">
              {message}
            </p>
          ) : null}
          {conflict ? (
            <button className="btn btn-secondary" onClick={() => router.refresh()} type="button">
              Recargar
            </button>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
