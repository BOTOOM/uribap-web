"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type ShoppingItem = components["schemas"]["ShoppingItemResponse"];
type Location = components["schemas"]["InventoryLocation"];

const LOCATION_LABELS: Record<Location, string> = {
  pantry: "Despensa",
  refrigerator: "Refrigerador",
  freezer: "Congelador",
};

export function ShoppingItemActions({
  listId,
  item,
  version,
  mutable,
}: {
  listId: string;
  item: ShoppingItem;
  version: number;
  mutable: boolean;
}) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [quantity, setQuantity] = useState(item.needed_amount);
  const [location, setLocation] = useState<Location>("pantry");
  const [expiration, setExpiration] = useState("");
  const [notes, setNotes] = useState("");

  if (!mutable || item.status === "purchased") return null;

  async function send(action: string, body: Record<string, unknown>) {
    setPending(true);
    setMessage(null);
    setConflict(false);
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${item.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (response.status === 409) {
        setConflict(true);
        throw new Error(payload?.detail ?? "La lista cambió desde que se cargó.");
      }
      if (!response.ok) throw new Error(payload?.detail ?? "No se pudo actualizar el ítem.");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el ítem.");
    } finally {
      setPending(false);
    }
  }

  async function submitPurchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: components["schemas"]["ShoppingPurchase"] = {
      expected_version: version,
      quantity,
      unit: item.unit,
      location,
      expiration_date: expiration || null,
      notes: notes.trim() ? notes.trim() : null,
    };
    await send("purchase", payload);
  }

  async function transition(action: "skip" | "restore") {
    await send(action, { expected_version: version });
  }

  return (
    <span className="shopping-item-actions">
      {item.status === "pending" ? (
        <>
          <button type="button" disabled={pending} onClick={() => setShowPurchase((v) => !v)}>
            {showPurchase ? "Cancelar" : "Comprar"}
          </button>
          <button type="button" disabled={pending} onClick={() => transition("skip")}>
            Omitir
          </button>
        </>
      ) : null}
      {item.status === "skipped" ? (
        <button type="button" disabled={pending} onClick={() => transition("restore")}>
          Restaurar
        </button>
      ) : null}
      {showPurchase && item.status === "pending" ? (
        <form aria-label={`Comprar ${item.ingredient_name}`} onSubmit={submitPurchase}>
          <label htmlFor={`qty-${item.id}`}>Cantidad ({item.unit})</label>
          <input
            id={`qty-${item.id}`}
            type="number"
            min="0.000001"
            step="any"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <label htmlFor={`loc-${item.id}`}>Ubicación</label>
          <select
            id={`loc-${item.id}`}
            value={location}
            onChange={(event) => setLocation(event.target.value as Location)}
          >
            {Object.entries(LOCATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label htmlFor={`exp-${item.id}`}>Caducidad (opcional)</label>
          <input
            id={`exp-${item.id}`}
            type="date"
            value={expiration}
            onChange={(event) => setExpiration(event.target.value)}
          />
          <label htmlFor={`notes-${item.id}`}>Notas (opcional)</label>
          <input
            id={`notes-${item.id}`}
            type="text"
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <button type="submit" className="status status-ready" disabled={pending}>
            {pending ? "Registrando…" : "Registrar compra"}
          </button>
        </form>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
      {conflict ? (
        <button type="button" onClick={() => router.refresh()}>
          Recargar lista actualizada
        </button>
      ) : null}
    </span>
  );
}
