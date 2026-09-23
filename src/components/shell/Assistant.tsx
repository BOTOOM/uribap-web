"use client";

import { useEffect, useRef, useState } from "react";

import { Bloub } from "@/components/ui/Bloub";

type Summary = {
  nextTask: { id: string; title: string; due_at: string } | null;
  pendingShopping: number;
  expiringSoon: number;
};

function formatDue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    }
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !fabRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  async function load() {
    if (summary || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/summary");
      const body = (await response.json().catch(() => null)) as
        | (Summary & { detail?: string })
        | null;
      if (!response.ok || !body) {
        throw new Error(body?.detail ?? "No se pudo cargar el resumen.");
      }
      setSummary(body);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    setOpen((value) => {
      const next = !value;
      if (next) void load();
      return next;
    });
  }

  const hasAlerts =
    summary !== null && (summary.nextTask !== null || summary.pendingShopping > 0 || summary.expiringSoon > 0);

  return (
    <>
      <button
        aria-controls="assistant-panel"
        aria-expanded={open}
        aria-label="Abrir resumen del hogar"
        className={`assistant-fab${hasAlerts ? " warning" : ""}`}
        onClick={toggle}
        ref={fabRef}
        type="button"
      >
        <Bloub expression={hasAlerts ? "curious" : "attentive"} />
      </button>
      <aside
        aria-hidden={!open}
        aria-label="Resumen del hogar"
        className={`assistant-panel card${open ? " open" : ""}`}
        id="assistant-panel"
        inert={!open}
        ref={panelRef}
      >
        <div aria-live="polite" className="assistant-message">
          <span className="assistant-avatar">
            <Bloub expression={hasAlerts ? "curious" : "happy"} size={34} />
          </span>
          <div>
            <strong>Uribap</strong>
            {loading ? <p className="muted">Mirando el estado de la casa…</p> : null}
            {error ? <p className="muted">{error}</p> : null}
            {summary ? (
              <>
                <p className="muted">
                  {hasAlerts
                    ? "Esto es lo que pide atención ahora mismo."
                    : "Todo en orden. Nada urgente por ahora."}
                </p>
                <ul className="assistant-list">
                  {summary.nextTask ? (
                    <li>
                      <span className="meta">PREP</span>
                      <span>
                        {summary.nextTask.title} · {formatDue(summary.nextTask.due_at)}
                      </span>
                    </li>
                  ) : null}
                  {summary.pendingShopping > 0 ? (
                    <li>
                      <span className="meta">COMPRA</span>
                      <span>{summary.pendingShopping} pendientes en la lista</span>
                    </li>
                  ) : null}
                  {summary.expiringSoon > 0 ? (
                    <li>
                      <span className="meta">CADUCA</span>
                      <span>
                        {summary.expiringSoon === 1
                          ? "1 lote vence en 48 h"
                          : `${summary.expiringSoon} lotes vencen en 48 h`}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
