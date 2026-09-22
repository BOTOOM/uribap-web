"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ShoppingListCreateForm({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setConflict(false);
    try {
      const response = await fetch("/api/shopping-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_date: fromDate, to_date: toDate }),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (response.status === 409) {
        setConflict(true);
        throw new Error(body?.detail ?? "Ya existe una lista activa para esa ventana.");
      }
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear la lista.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la lista.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form aria-label="Crear lista de compra" className="form" onSubmit={submit}>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="shopping-from">
            Desde
          </label>
          <input
            className="input"
            id="shopping-from"
            required
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="shopping-to">
            Hasta
          </label>
          <input
            className="input"
            id="shopping-to"
            required
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </div>
      <div>
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Generando…" : "Generar lista"}
        </button>
      </div>
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
      {conflict ? (
        <button className="btn btn-secondary" type="button" onClick={() => router.refresh()}>
          Recargar lista activa
        </button>
      ) : null}
    </form>
  );
}
