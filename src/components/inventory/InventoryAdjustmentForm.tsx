"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

export function InventoryAdjustmentForm() {
  const router = useRouter();
  const [lotId, setLotId] = useState("");
  const [delta, setDelta] = useState("");
  const [unit, setUnit] = useState("unit");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const payload: components["schemas"]["InventoryAdjustment"] = {
      lot_id: lotId,
      delta,
      unit,
      movement_type: "manual_adjustment",
    };
    try {
      const response = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo ajustar el inventario.");
      setMessage("Ajuste registrado en el ledger.");
      setDelta("");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo ajustar el inventario.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="foundation-actions" onSubmit={submit}>
      <label>ID del lote<input required value={lotId} onChange={(event) => setLotId(event.target.value)} /></label>
      <label>Cambio firmado<input required inputMode="decimal" value={delta} onChange={(event) => setDelta(event.target.value)} /></label>
      <label>Unidad<input required value={unit} onChange={(event) => setUnit(event.target.value)} /></label>
      <button className="status status-ready" disabled={pending} type="submit">{pending ? "Guardando…" : "Registrar ajuste"}</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
