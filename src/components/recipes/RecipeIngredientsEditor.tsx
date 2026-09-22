"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/Icon";
import { formatQuantity } from "@/lib/format";
import { toast } from "@/lib/toast";

export type EditorIngredient = {
  id: string;
  name: string;
  dimension: string;
  base_unit: string;
};

export type VersionLine = {
  ingredient_id: string;
  amount: string;
  unit: string;
  optional: boolean;
};

export function RecipeIngredientsEditor({
  recipeId,
  versionNumber,
  initialLines,
  ingredients,
}: {
  recipeId: string;
  versionNumber: number;
  initialLines: VersionLine[];
  ingredients: EditorIngredient[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<VersionLine[]>(initialLines);
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [optional, setOptional] = useState(false);
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
        amount,
        unit: selected.base_unit,
        optional,
      },
    ]);
    setAmount("");
    setOptional(false);
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/recipes/${recipeId}/versions/${versionNumber}/ingredients`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: lines }),
        },
      );
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudieron guardar los ingredientes.");
      toast("Ingredientes de la versión guardados");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudieron guardar los ingredientes.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="form">
      {lines.length === 0 ? (
        <p className="helper">
          Esta versión todavía no tiene ingredientes. Añade las líneas para que el plan
          proyecte demanda y la compra sepa qué falta.
        </p>
      ) : (
        <ul className="detail-list" aria-label="Ingredientes de la versión">
          {lines.map((line, index) => {
            const ingredient = ingredients.find((item) => item.id === line.ingredient_id);
            return (
              <li className="detail-row" key={`${line.ingredient_id}-${index}`}>
                <span className="meal-name">
                  {ingredient?.name ?? "Ingrediente"} · {formatQuantity(line.amount, line.unit)}
                  {line.optional ? " (opcional)" : ""}
                </span>
                <button
                  aria-label={`Quitar ${ingredient?.name ?? "ingrediente"}`}
                  className="btn btn-ghost"
                  onClick={() => removeLine(index)}
                  type="button"
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {ingredients.length === 0 ? (
        <p className="helper">
          No hay ingredientes en el catálogo. Créalos desde la sección Ingredientes.
        </p>
      ) : (
        <div className="form-row" style={{ alignItems: "end" }}>
          <div className="field">
            <label className="field-label" htmlFor="line-ingredient">
              Ingrediente
            </label>
            <select
              className="select"
              id="line-ingredient"
              value={ingredientId}
              onChange={(event) => setIngredientId(event.target.value)}
            >
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} ({ingredient.base_unit})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="line-amount">
              Cantidad{selected ? ` (${selected.base_unit})` : ""}
            </label>
            <input
              className="input"
              id="line-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="line-optional">
              Opcional
            </label>
            <input
              id="line-optional"
              type="checkbox"
              checked={optional}
              onChange={(event) => setOptional(event.target.checked)}
            />
          </div>
          <button
            className="btn btn-ghost"
            disabled={!selected || amount.trim() === ""}
            onClick={addLine}
            type="button"
          >
            <Icon name="plus" size={15} />
            Añadir línea
          </button>
        </div>
      )}

      <div>
        <button
          className="btn btn-primary"
          disabled={pending || ingredients.length === 0}
          onClick={() => void save()}
          type="button"
        >
          {pending ? "Guardando…" : "Guardar ingredientes"}
        </button>
      </div>
      {message ? (
        <p className="form-status" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
