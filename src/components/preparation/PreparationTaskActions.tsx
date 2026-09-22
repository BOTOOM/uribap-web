"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type PreparationTask = components["schemas"]["PreparationTaskResponse"];

export function PreparationTaskActions({ task }: { task: PreparationTask }) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);

  if (task.status !== "pending") return null;

  async function transition(action: "complete" | "cancel") {
    setPending(true);
    setMessage(null);
    setConflict(false);
    try {
      const payload: components["schemas"]["PreparationTaskMutation"] = {
        expected_version: task.version,
      };
      const response = await fetch(`/api/preparation-tasks/${task.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (response.status === 409) {
        setConflict(true);
        throw new Error(body?.detail ?? "La tarea cambió desde que se cargó.");
      }
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo actualizar la tarea.");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la tarea.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="planner-actions" style={{ marginLeft: 0 }}>
      <button
        className="btn btn-secondary"
        disabled={pending}
        onClick={() => transition("complete")}
        type="button"
      >
        Completar
      </button>
      <button
        className="btn btn-ghost"
        disabled={pending}
        onClick={() => transition("cancel")}
        type="button"
      >
        Cancelar
      </button>
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
      {conflict ? (
        <button className="btn btn-secondary" type="button" onClick={() => router.refresh()}>
          Recargar tareas actualizadas
        </button>
      ) : null}
    </span>
  );
}
