"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { formatQuantity } from "@/lib/format";
import { toast } from "@/lib/toast";

type ShoppingItem = components["schemas"]["ShoppingItemResponse"];
type Location = components["schemas"]["InventoryLocation"];

const LOCATION_LABELS: Record<Location, string> = {
  pantry: "Despensa",
  refrigerator: "Refrigerador",
  freezer: "Congelador",
};

export function ShoppingItemRow({
  listId,
  item,
  version,
  mutable,
  onHand,
  shortfall,
}: {
  listId: string;
  item: ShoppingItem;
  version: number;
  mutable: boolean;
  onHand: string | null;
  shortfall: string | null;
}) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [quantity, setQuantity] = useState(shortfall ?? item.needed_amount);
  const [location, setLocation] = useState<Location>("pantry");
  const [expiration, setExpiration] = useState("");
  const [notes, setNotes] = useState("");

  async function send(action: string, body: Record<string, unknown>, done?: string) {
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
      if (done) toast(done);
      setIdempotencyKey(crypto.randomUUID());
      setShowPurchase(false);
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
    await send("purchase", payload, "Compra registrada — lote añadido al inventario");
  }

  if (item.status !== "pending") {
    return (
      <div className={`shopping-item${item.status === "purchased" ? " purchased" : ""}`}>
        <span
          aria-hidden="true"
          className={`check${item.status === "purchased" ? " checked" : ""}`}
        />
        <div>
          <div className="meal-name">{item.ingredient_name}</div>
          <div className="reason">
            {item.status === "purchased"
              ? `Comprado${item.purchased_at ? ` — el lote ya está en el inventario` : ""}.`
              : "Omitido: no se comprará en esta ventana."}
          </div>
        </div>
        <div className="quantity">
          <span className="meta">{item.status === "purchased" ? "Comprados" : "Necesarios"}</span>
          <strong className="num" style={{ display: "block" }}>
            {formatQuantity(
              item.status === "purchased" && item.purchased_amount
                ? item.purchased_amount
                : item.needed_amount,
              item.unit,
            )}
          </strong>
        </div>
        <div className="hide-mid" />
        <div className="hide-mid" />
        <div className="shopping-item-actions">
          {item.status === "skipped" && mutable ? (
            <button
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => void send("restore", { expected_version: version })}
              type="button"
            >
              Restaurar
            </button>
          ) : null}
          {message ? (
            <p className="form-status" role="status">
              {message}
            </p>
          ) : null}
          {conflict ? (
            <button className="btn btn-secondary" onClick={() => router.refresh()} type="button">
              Recargar lista actualizada
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const reason = item.notes?.trim()
    ? item.notes
    : onHand !== null && Number(onHand) > 0
      ? `En casa quedan ${formatQuantity(onHand, item.unit)}; el plan necesita más.`
      : "El plan aprobado lo necesita y no hay existencias en casa.";

  return (
    <div className="shopping-item">
      <button
        aria-expanded={showPurchase}
        aria-label={`Registrar compra de ${item.ingredient_name}`}
        className="check"
        disabled={!mutable}
        onClick={() => setShowPurchase((v) => !v)}
        style={mutable ? undefined : { opacity: 0.4, cursor: "default" }}
        type="button"
      />
      <div>
        <div className="meal-name">{item.ingredient_name}</div>
        <div className="reason">{reason}</div>
      </div>
      <div className="quantity">
        <span className="meta">Necesarios</span>
        <strong className="num" style={{ display: "block" }}>
          {formatQuantity(item.needed_amount, item.unit)}
        </strong>
      </div>
      <div className="hide-mid">
        <span className="meta">En casa</span>
        <strong className="num" style={{ display: "block" }}>
          {onHand === null ? "—" : formatQuantity(onHand, item.unit)}
        </strong>
      </div>
      <div className="hide-mid">
        <span className="meta">Faltan</span>
        <strong className="num" style={{ display: "block" }}>
          {shortfall === null ? "—" : formatQuantity(shortfall, item.unit)}
        </strong>
      </div>
      <div className="shopping-item-actions">
        {mutable ? (
          <>
            <button
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => setShowPurchase((v) => !v)}
              type="button"
            >
              {showPurchase ? "Cancelar" : `Comprar ${formatQuantity(item.needed_amount, item.unit)}`}
            </button>
            <button
              aria-label={`Omitir ${item.ingredient_name}`}
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => void send("skip", { expected_version: version })}
              type="button"
            >
              Omitir
            </button>
          </>
        ) : null}
        {message ? (
          <p className="form-status" role="status">
            {message}
          </p>
        ) : null}
        {conflict ? (
          <button className="btn btn-secondary" onClick={() => router.refresh()} type="button">
            Recargar lista actualizada
          </button>
        ) : null}
      </div>
      {showPurchase && mutable ? (
        <form
          aria-label={`Comprar ${item.ingredient_name}`}
          className="shopping-purchase-form"
          onSubmit={submitPurchase}
        >
          <div className="field" style={{ maxWidth: 140 }}>
            <label className="field-label" htmlFor={`qty-${item.id}`}>
              Cantidad ({item.unit})
            </label>
            <input
              className="input"
              id={`qty-${item.id}`}
              min="0.000001"
              required
              step="any"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="field" style={{ maxWidth: 150 }}>
            <label className="field-label" htmlFor={`loc-${item.id}`}>
              Ubicación
            </label>
            <select
              className="select"
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
          </div>
          <div className="field" style={{ maxWidth: 160 }}>
            <label className="field-label" htmlFor={`exp-${item.id}`}>
              Caducidad <span className="helper">(opcional)</span>
            </label>
            <input
              className="input"
              id={`exp-${item.id}`}
              type="date"
              value={expiration}
              onChange={(event) => setExpiration(event.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 140, flex: 1 }}>
            <label className="field-label" htmlFor={`notes-${item.id}`}>
              Notas <span className="helper">(opcional)</span>
            </label>
            <input
              className="input"
              id={`notes-${item.id}`}
              maxLength={280}
              placeholder="Marca, formato…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending ? "Registrando…" : "Registrar compra"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
