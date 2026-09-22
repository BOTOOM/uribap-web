"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { toast } from "@/lib/toast";

export type LotOption = {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
};

export function InventoryAdjustmentForm({ lots }: { lots: LotOption[] }) {
  const router = useRouter();
  const [lotId, setLotId] = useState(lots[0]?.id ?? "");
  const [delta, setDelta] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = lots.find((item) => item.id === lotId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const payload: components["schemas"]["InventoryAdjustment"] = {
      lot_id: lotId,
      delta,
      unit: selected?.unit ?? "unit",
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
      toast("Ajuste registrado en el ledger");
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
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="adj-lot">
          Lote
        </label>
        <select
          className="select"
          id="adj-lot"
          required
          value={lotId}
          onChange={(event) => setLotId(event.target.value)}
        >
          {lots.length === 0 ? <option value="">Sin lotes disponibles</option> : null}
          {lots.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {lot.ingredientName} · {lot.quantity} {lot.unit}
            </option>
          ))}
        </select>
        {lots.length === 0 ? (
          <span className="helper">Registra un lote antes de ajustar saldo.</span>
        ) : null}
      </div>
      <div className="field">
        <label className="field-label" htmlFor="adj-delta">
          Cambio firmado{selected ? ` (${selected.unit})` : ""}
        </label>
        <input
          className="input"
          id="adj-delta"
          inputMode="decimal"
          placeholder="-0.5 para restar"
          required
          value={delta}
          onChange={(event) => setDelta(event.target.value)}
        />
        <span className="helper">Negativo descuenta, positivo suma al saldo real.</span>
      </div>
      <div>
        <button className="btn btn-secondary" disabled={pending || lots.length === 0} type="submit">
          {pending ? "Guardando…" : "Registrar ajuste"}
        </button>
      </div>
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
