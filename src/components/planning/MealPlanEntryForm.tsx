"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type PublishedVersion = components["schemas"]["PublishedRecipeVersionResponse"];
type MealType = components["schemas"]["RecipeMealType"];

const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: "breakfast", label: "Desayuno" },
  { value: "lunch", label: "Almuerzo" },
  { value: "dinner", label: "Cena" },
  { value: "snack", label: "Snack" },
];

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MealPlanEntryForm({
  planId,
  weekStart,
  version,
  versions,
}: {
  planId: string;
  weekStart: string;
  version: number;
  versions: PublishedVersion[];
}) {
  const router = useRouter();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(`${weekStart}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
  const [recipeVersionId, setRecipeVersionId] = useState(versions[0]?.recipe_version_id ?? "");
  const [plannedDate, setPlannedDate] = useState(weekStart);
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [servings, setServings] = useState("2");
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
    };
    try {
      const response = await fetch(`/api/plans/${planId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (response.status === 409) {
        setConflict(true);
        throw new Error(body?.detail ?? "El plan cambió desde que se cargó.");
      }
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo añadir la comida.");
      setMessage("Comida añadida al plan.");
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir la comida.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="foundation-actions" onSubmit={submit}>
      <label>
        Receta
        <select required value={recipeVersionId} onChange={(event) => setRecipeVersionId(event.target.value)}>
          {versions.length === 0 ? <option value="">Sin versiones publicadas</option> : null}
          {versions.map((versionItem) => (
            <option key={versionItem.recipe_version_id} value={versionItem.recipe_version_id}>
              {versionItem.recipe_name} · v{versionItem.version_number}
            </option>
          ))}
        </select>
      </label>
      <label>
        Día
        <select required value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)}>
          {weekDays.map((day, index) => (
            <option key={day} value={day}>
              {DAY_LABELS[index]} {day}
            </option>
          ))}
        </select>
      </label>
      <label>
        Comida
        <select required value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}>
          {MEAL_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Raciones
        <input required inputMode="numeric" min={1} type="number" value={servings} onChange={(event) => setServings(event.target.value)} />
      </label>
      <button className="status status-ready" disabled={pending || versions.length === 0} type="submit">
        {pending ? "Guardando…" : "Añadir al plan"}
      </button>
      {message ? <p role="status">{message}</p> : null}
      {conflict ? (
        <button type="button" onClick={() => router.refresh()}>
          Recargar plan actualizado
        </button>
      ) : null}
    </form>
  );
}
