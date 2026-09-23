"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { QuickRecipeForm } from "@/components/planning/QuickRecipeForm";
import { Icon } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";
import { formatDayLong } from "@/lib/format";
import type { CatalogIngredient } from "@/lib/ingredients";
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
  ingredients,
  initialDate,
  onDone,
}: {
  planId: string;
  weekStart: string;
  version: number;
  versions: PublishedVersion[];
  ingredients: CatalogIngredient[];
  initialDate?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(`${weekStart}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
  const [createdVersions, setCreatedVersions] = useState<PublishedVersion[]>([]);
  const [recipeVersionId, setRecipeVersionId] = useState(
    versions[0]?.recipe_version_id ?? "",
  );
  const [mode, setMode] = useState<"picker" | "recipe">("picker");
  const [recipeSeed, setRecipeSeed] = useState("");
  const [query, setQuery] = useState("");
  const [plannedDate, setPlannedDate] = useState(initialDate ?? weekStart);
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [servings, setServings] = useState("2");
  const [notes, setNotes] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);

  const versionList = useMemo(() => {
    const known = new Set(versions.map((item) => item.recipe_version_id));
    return [
      ...createdVersions.filter((item) => !known.has(item.recipe_version_id)),
      ...versions,
    ];
  }, [createdVersions, versions]);

  const filteredVersions = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return versionList;
    return versionList.filter((versionItem) =>
      versionItem.recipe_name.toLocaleLowerCase("es").includes(term),
    );
  }, [query, versionList]);

  const selected = versionList.find(
    (versionItem) => versionItem.recipe_version_id === recipeVersionId,
  );

  function openRecipeCreator(seed = "") {
    setRecipeSeed(seed);
    setMode("recipe");
  }

  function handleRecipeCreated(versionItem: PublishedVersion) {
    setCreatedVersions((current) => [
      versionItem,
      ...current.filter(
        (item) => item.recipe_version_id !== versionItem.recipe_version_id,
      ),
    ]);
    setRecipeVersionId(versionItem.recipe_version_id);
    setQuery("");
    setMode("picker");
  }

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

  if (mode === "recipe") {
    return (
      <QuickRecipeForm
        initialName={recipeSeed}
        ingredients={ingredients}
        onBack={() => setMode("picker")}
        onCreated={handleRecipeCreated}
      />
    );
  }

  const trimmedQuery = query.trim();
  const createLabel = trimmedQuery
    ? `Crear “${trimmedQuery}”`
    : "Crear una receta";

  return (
    <form className="form" onSubmit={submit}>
      <div className="search-wrap meal-dialog-search">
        <Icon name="search" size={19} />
        <label className="sr-only" htmlFor="entry-recipe-search">
          Buscar una receta para el plan
        </label>
        <input
          autoComplete="off"
          className="search"
          id="entry-recipe-search"
          name="recipeSearch"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre…"
          type="search"
          value={query}
        />
      </div>
      {versionList.length === 0 || filteredVersions.length === 0 ? (
        <div className="meal-search-empty" role="status">
          <strong>
            {versionList.length === 0
              ? "Todavía no hay recetas"
              : `“${trimmedQuery}” aún no está en tus recetas`}
          </strong>
          <p>
            Créala aquí y añádela sin salir del plan; podrás completarla después
            desde Recetas.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => openRecipeCreator(trimmedQuery)}
            type="button"
          >
            <Icon name="plus" size={15} />
            {versionList.length === 0 ? "Crear tu primera receta" : createLabel}
          </button>
        </div>
      ) : (
        <div
          aria-label="Recetas disponibles"
          className="meal-options"
          role="listbox"
        >
          {filteredVersions.map((versionItem) => {
            const isSelected = versionItem.recipe_version_id === recipeVersionId;
            return (
              <button
                aria-selected={isSelected}
                className={`option${isSelected ? " selected" : ""}`}
                key={versionItem.recipe_version_id}
                onClick={() => setRecipeVersionId(versionItem.recipe_version_id)}
                role="option"
                type="button"
              >
                <span className="recipe-glyph" style={{ margin: 0 }}>
                  <Icon name="clock" size={19} />
                </span>
                <div>
                  <strong>{versionItem.recipe_name}</strong>
                  <div className="muted">
                    {versionItem.prep_minutes} min · {versionItem.base_servings}{" "}
                    raciones base
                  </div>
                </div>
                <span className="status pending" style={{ marginLeft: "auto" }}>
                  v{versionItem.version_number}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {filteredVersions.length > 0 ? (
        <button
          className="btn btn-ghost meal-create-link"
          onClick={() => openRecipeCreator(trimmedQuery)}
          type="button"
        >
          <Icon name="plus" size={14} />
          {createLabel}
        </button>
      ) : null}
      {selected ? (
        <div className="callout dialog-impact" role="status">
          <strong>Se añadirá {selected.recipe_name}</strong>
          <p className="muted" style={{ margin: 0 }}>
            Su demanda de ingredientes se proyecta en la previsión; inventario,
            compra y preparación se recalculan al guardar.
          </p>
        </div>
      ) : null}
      <div className="form-row" style={{ marginTop: 14 }}>
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
          disabled={pending || !recipeVersionId}
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
