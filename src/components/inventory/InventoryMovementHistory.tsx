"use client";

import { useState } from "react";

import type { components } from "@/lib/api/generated/schema";

type Movement = components["schemas"]["InventoryMovementResponse"];

export function InventoryMovementHistory({ lotId }: { lotId: string }) {
  const [items, setItems] = useState<Movement[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/inventory/lots/${lotId}/movements`);
      const body = (await response.json().catch(() => null)) as { items?: Movement[]; detail?: string } | null;
      if (!response.ok || !body?.items) throw new Error(body?.detail ?? "No se pudo cargar el historial.");
      setItems(body.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el historial.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="btn btn-ghost" disabled={pending} onClick={() => void load()} type="button">
        {pending ? "Cargando historial…" : items ? "Actualizar historial" : "Ver movimientos"}
      </button>
      {message ? <p role="alert">{message}</p> : null}
      {items ? (
        items.length === 0 ? (
          <p className="muted" role="status">
            Sin movimientos.
          </p>
        ) : (
          <ul
            aria-label="Historial de movimientos"
            className="meta"
            style={{ margin: "8px 0 0", paddingLeft: 16, listStyle: "disc" }}
          >
            {items.map((movement) => (
              <li key={movement.id}>
                {movement.delta} {movement.unit} · {movement.movement_type}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
