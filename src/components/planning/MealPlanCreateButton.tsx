"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { toast } from "@/lib/toast";

export function MealPlanCreateButton({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    setMessage(null);
    const payload: components["schemas"]["MealPlanCreate"] = { week_start_date: weekStart };
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear el plan.");
      toast("Plan de la semana creado");
      setMessage("Plan creado.");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el plan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="planner-empty-actions">
      <button className="btn btn-primary" disabled={pending} onClick={create} type="button">
        {pending ? "Creando…" : "Crear plan de la semana"}
      </button>
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
