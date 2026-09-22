"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { formatDayLong } from "@/lib/format";
import { toast } from "@/lib/toast";

type PublishedVersion = components["schemas"]["PublishedRecipeVersionResponse"];
type MealType = components["schemas"]["RecipeMealType"];

const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: "breakfast", label: "Desayuno" },
  { value: "lunch", label: "Almuerzo" },
  { value: "dinner", label: "Cena" },
  { value: "snack", label: "Snack" },
];

export function MealPlanEntryForm({
  planId,
  weekStart,
  version,
  versions,
  initialDate,
  onDone,
}: {
  planId: string;
  weekStart: string;
  version: number;
  versions: PublishedVersion[];
  initialDate?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(`${weekStart}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
  const [recipeVersionId, setRecipeVersionId] = useState(
    versions[0]?.recipe_version_id ?? "",
  );
  const [plannedDate, setPlannedDate] = useState(initialDate ?? weekStart);
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [servings, setServings] = useState("2");
  const [notes, setNotes] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setConflict(false);
    const payload: components["schemas"]["MealPlanEntryCreate"] = {
      expected_version: version,
      planned_date: plannedDate,
      meal_type: mealType,
      recipe_version_id: recipeVersionId,
      servings: Number(servings),
      position: 0,
      notes: notes.trim() || undefined,
    };
    try {
      const response = await fetch(`/api/plans/${planId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;
      if (response.status === 409) {
        setConflict(true);
        throw new Error(body?.detail ?? "El plan cambió desde que se cargó.");
      }
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo añadir la comida.");
      toast("Comida añadida al plan");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
      onDone?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir la comida.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="entry-recipe">
          Receta
        </label>
        <select
          className="select"
          id="entry-recipe"
          required
          value={recipeVersionId}
          onChange={(event) => setRecipeVersionId(event.target.value)}
        >
          {versions.length === 0 ? <option value="">Sin versiones publicadas</option> : null}
          {versions.map((versionItem) => (
            <option key={versionItem.recipe_version_id} value={versionItem.recipe_version_id}>
              {versionItem.recipe_name} · v{versionItem.version_number}
            </option>
          ))}
        </select>
        {versions.length === 0 ? (
          <span className="helper">Publica una receta antes de planificar comidas.</span>
        ) : null}
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="entry-day">
            Día
          </label>
          <select
            className="select"
            id="entry-day"
            required
            value={plannedDate}
            onChange={(event) => setPlannedDate(event.target.value)}
          >
            {weekDays.map((day) => (
              <option key={day} value={day}>
                {formatDayLong(day)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="entry-meal">
            Comida
          </label>
          <select
            className="select"
            id="entry-meal"
            required
            value={mealType}
            onChange={(event) => setMealType(event.target.value as MealType)}
          >
            {MEAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="entry-servings">
            Raciones
          </label>
          <input
            className="input"
            id="entry-servings"
            inputMode="numeric"
            min={1}
            required
            type="number"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="entry-notes">
            Nota <span className="helper">(opcional)</span>
          </label>
          <input
            className="input"
            id="entry-notes"
            maxLength={280}
            placeholder="Para llevar, sin picante…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>
      <div className="dialog-foot" style={{ padding: "4px 0 0", borderTop: 0 }}>
        <button
          className="btn btn-primary"
          disabled={pending || versions.length === 0}
          type="submit"
        >
          {pending ? "Guardando…" : "Añadir al plan"}
        </button>
      </div>
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
      {conflict ? (
        <button className="btn btn-secondary" type="button" onClick={() => router.refresh()}>
          Recargar plan actualizado
        </button>
      ) : null}
    </form>
  );
}
