"use client";

import { useState } from "react";

import { IngredientCreateForm } from "@/components/ingredients/IngredientCreateForm";
import { Icon } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";
import { formatQuantity } from "@/lib/format";
import type { CatalogIngredient } from "@/lib/ingredients";
import { toast } from "@/lib/toast";

type PublishedVersion = components["schemas"]["PublishedRecipeVersionResponse"];
type RecipeResponse = components["schemas"]["RecipeResponse"];

type DraftLine = {
  ingredient_id: string;
  amount: string;
  unit: string;
  optional: boolean;
};

async function readDetail(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as { detail?: string } | null;
  throw new Error(body?.detail ?? "El servicio no pudo completar la solicitud.");
}

export function QuickRecipeForm({
  initialName,
  ingredients: initialIngredients,
  onBack,
  onCreated,
}: {
  initialName: string;
  ingredients: CatalogIngredient[];
  onBack: () => void;
  onCreated: (version: PublishedVersion) => void;
}) {
  const [name, setName] = useState(initialName);
  const [baseServings, setBaseServings] = useState("2");
  const [prepMinutes, setPrepMinutes] = useState("25");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [ingredientId, setIngredientId] = useState(initialIngredients[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [optional, setOptional] = useState(false);
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = ingredients.find((item) => item.id === ingredientId);

  function addLine() {
    if (!selected) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage("La cantidad debe ser mayor que cero.");
      return;
    }
    setMessage(null);
    setLines((current) => [
      ...current,
      {
        ingredient_id: selected.id,
        amount: String(parsed),
        unit: selected.base_unit,
        optional,
      },
    ]);
    setAmount("");
    setOptional(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Escribe un nombre para la receta.");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const recipeResponse = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          base_servings: Math.max(1, Number(baseServings) || 1),
          prep_minutes: Math.max(0, Number(prepMinutes) || 0),
        } satisfies components["schemas"]["RecipeCreate"]),
      });
      if (!recipeResponse.ok) await readDetail(recipeResponse);
      const recipe = (await recipeResponse.json()) as RecipeResponse;

      if (lines.length > 0) {
        const linesResponse = await fetch(
          `/api/recipes/${recipe.id}/versions/1/ingredients`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: lines.map((line) => ({
                ingredient_id: line.ingredient_id,
                amount: line.amount,
                unit: line.unit,
                optional: line.optional,
              })),
            } satisfies components["schemas"]["RecipeVersionIngredientsPut"]),
          },
        );
        if (!linesResponse.ok) await readDetail(linesResponse);
      }

      const publishResponse = await fetch(
        `/api/recipes/${recipe.id}/versions/1/publish`,
        { method: "POST" },
      );
      if (!publishResponse.ok) await readDetail(publishResponse);

      const listResponse = await fetch("/api/recipes/published-versions");
      if (!listResponse.ok) await readDetail(listResponse);
      const list = (await listResponse.json()) as { items?: PublishedVersion[] };
      const published = (list.items ?? [])
        .filter((item) => item.recipe_id === recipe.id)
        .sort((a, b) => b.version_number - a.version_number)[0];
      if (!published) {
        throw new Error("La receta se publicó pero no aparece en el catálogo.");
      }

      toast(`${trimmed} se creó y está lista para el plan.`);
      onCreated(published);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo crear la receta.",
      );
    } finally {
      setPending(false);
    }
  }

  if (creatingIngredient) {
    return (
      <div className="quick-recipe">
        <div className="quick-recipe-head">
          <div>
            <h3>Nuevo ingrediente</h3>
            <span className="helper">
              Se guarda en tu despensa y se selecciona en la receta.
            </span>
          </div>
          <button
            aria-label="Volver a la receta"
            className="icon-btn"
            onClick={() => setCreatingIngredient(false)}
            type="button"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <IngredientCreateForm
          autoFocusName
          onCancel={() => setCreatingIngredient(false)}
          onCreated={(ingredient) => {
            setIngredients((current) => [...current, ingredient]);
            setIngredientId(ingredient.id);
            setCreatingIngredient(false);
          }}
          submitLabel="Crear ingrediente"
        />
      </div>
    );
  }

  return (
    <form className="quick-recipe" onSubmit={submit}>
      <div className="quick-recipe-head">
        <div>
          <h3>Nueva receta rápida</h3>
          <span className="helper">
            Se publica al crearla; podrás completar instrucciones desde Recetas.
          </span>
        </div>
        <button
          aria-label="Volver a resultados"
          className="icon-btn"
          onClick={onBack}
          type="button"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="quick-recipe-name">
          Nombre de la receta
        </label>
        <input
          autoFocus
          className="input"
          id="quick-recipe-name"
          maxLength={160}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="quick-recipe-grid" style={{ marginTop: 12 }}>
        <div className="field">
          <label className="field-label" htmlFor="quick-recipe-servings">
            Raciones base
          </label>
          <input
            className="input"
            id="quick-recipe-servings"
            inputMode="numeric"
            min={1}
            required
            type="number"
            value={baseServings}
            onChange={(event) => setBaseServings(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="quick-recipe-minutes">
            Tiempo estimado <span className="helper">(min)</span>
          </label>
          <input
            className="input"
            id="quick-recipe-minutes"
            inputMode="numeric"
            min={0}
            required
            type="number"
            value={prepMinutes}
            onChange={(event) => setPrepMinutes(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="quick-lines">
        <legend className="field-label">Ingredientes de la receta</legend>
        {lines.length === 0 ? (
          <p className="helper" style={{ margin: "0 0 10px" }}>
            Opcional, pero necesario para que la previsión y la compra calculen
            faltantes.
          </p>
        ) : (
          <ul className="detail-list" aria-label="Ingredientes de la receta">
            {lines.map((line, index) => {
              const ingredient = ingredients.find(
                (item) => item.id === line.ingredient_id,
              );
              return (
                <li className="detail-row" key={`${line.ingredient_id}-${index}`}>
                  <span className="meal-name">
                    {ingredient?.name ?? "Ingrediente"} ·{" "}
                    {formatQuantity(line.amount, line.unit)}
                    {line.optional ? " (opcional)" : ""}
                  </span>
                  <button
                    aria-label={`Quitar ${ingredient?.name ?? "ingrediente"}`}
                    className="btn btn-ghost"
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    type="button"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="quick-line-row">
          <div className="field">
            <label className="field-label" htmlFor="quick-line-ingredient">
              Ingrediente
            </label>
            <select
              className="select"
              disabled={ingredients.length === 0}
              id="quick-line-ingredient"
              value={ingredientId}
              onChange={(event) => setIngredientId(event.target.value)}
            >
              {ingredients.length === 0 ? (
                <option value="">Sin ingredientes todavía</option>
              ) : (
                ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.base_unit})
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="quick-line-amount">
              Cantidad{selected ? ` (${selected.base_unit})` : ""}
            </label>
            <input
              className="input"
              id="quick-line-amount"
              inputMode="decimal"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLine();
                }
              }}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="field quick-line-optional">
            <label className="helper" htmlFor="quick-line-optional">
              Opcional
            </label>
            <input
              checked={optional}
              id="quick-line-optional"
              onChange={(event) => setOptional(event.target.checked)}
              type="checkbox"
            />
          </div>
          <button
            className="btn btn-ghost"
            disabled={!selected || amount.trim() === ""}
            onClick={addLine}
            type="button"
          >
            <Icon name="plus" size={15} />
            Añadir
          </button>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => setCreatingIngredient(true)}
          type="button"
        >
          <Icon name="plus" size={15} />
          Crear ingrediente nuevo
        </button>
      </fieldset>

      <div className="quick-recipe-actions">
        <button className="btn btn-ghost" onClick={onBack} type="button">
          Cancelar
        </button>
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Creando…" : "Crear y seleccionar"}
        </button>
      </div>
      {message ? (
        <p className="form-status" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
