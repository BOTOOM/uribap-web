"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import {
  DIMENSION_LABELS,
  UNITS_BY_DIMENSION,
  type IngredientDimension,
  type IngredientResponse,
} from "@/lib/ingredients";
import { toast } from "@/lib/toast";

type EditableIngredient = Pick<
  IngredientResponse,
  "id" | "name" | "category" | "pantry_staple"
>;

export function IngredientForm({
  autoFocusName = false,
  initialName = "",
  ingredient,
  onCancel,
  onCreated,
  onSuccess,
  submitLabel,
}: {
  autoFocusName?: boolean;
  ingredient?: EditableIngredient;
  initialName?: string;
  onCancel?: () => void;
  onCreated?: (ingredient: IngredientResponse) => void;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const editing = ingredient !== undefined;
  const [name, setName] = useState(ingredient?.name ?? initialName);
  const [category, setCategory] = useState(ingredient?.category ?? "");
  const [dimension, setDimension] = useState<IngredientDimension>("mass");
  const [baseUnit, setBaseUnit] = useState("g");
  const [pantryStaple, setPantryStaple] = useState(ingredient?.pantry_staple ?? false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const actionLabel = submitLabel ?? (editing ? "Guardar cambios" : "Añadir ingrediente");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    const nextCategory = category.trim() || null;
    const payload:
      | components["schemas"]["IngredientCreate"]
      | components["schemas"]["IngredientUpdate"] = editing
      ? {
          ...(nextName !== ingredient.name ? { name: nextName } : {}),
          ...(nextCategory !== (ingredient.category ?? null) ? { category: nextCategory } : {}),
          ...(pantryStaple !== ingredient.pantry_staple ? { pantry_staple: pantryStaple } : {}),
        }
      : {
          name: nextName,
          category: nextCategory,
          dimension,
          base_unit: baseUnit,
          pantry_staple: pantryStaple,
        };
    if (editing && Object.keys(payload).length === 0) {
      onSuccess?.();
      return;
    }
    setPending(true);
    setMessage(null);
    const fallbackMessage = editing
      ? "No se pudo actualizar el ingrediente."
      : "No se pudo crear el ingrediente.";
    try {
      const response = await fetch(
        editing ? `/api/ingredients/${ingredient.id}` : "/api/ingredients",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | (Partial<IngredientResponse> & { detail?: string })
        | null;
      if (!response.ok) throw new Error(body?.detail ?? fallbackMessage);
      if (!editing && body?.id) onCreated?.(body as IngredientResponse);
      toast(editing ? "Ingrediente actualizado" : "Ingrediente añadido a la despensa");
      if (!editing) {
        setName("");
        setCategory("");
        setPantryStaple(false);
      }
      onSuccess?.();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="ing-name">
            Nombre
          </label>
          <input
            autoFocus={autoFocusName}
            className="input"
            id="ing-name"
            maxLength={160}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ing-category">
            Categoría <span className="helper">(opcional)</span>
          </label>
          <input
            className="input"
            id="ing-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>
      </div>
      {!editing ? (
        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="ing-dimension">
              Dimensión
            </label>
            <select
              className="select"
              id="ing-dimension"
              value={dimension}
              onChange={(event) => {
                const next = event.target.value as IngredientDimension;
                setDimension(next);
                setBaseUnit(UNITS_BY_DIMENSION[next][0]);
              }}
            >
              {Object.entries(DIMENSION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="ing-unit">
              Unidad base
            </label>
            <select
              className="select"
              id="ing-unit"
              value={baseUnit}
              onChange={(event) => setBaseUnit(event.target.value)}
            >
              {UNITS_BY_DIMENSION[dimension].map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      <div className="ingredient-staple-field">
        <input
          aria-describedby="ing-pantry-staple-help"
          checked={pantryStaple}
          id="ing-pantry-staple"
          onChange={(event) => setPantryStaple(event.target.checked)}
          type="checkbox"
        />
        <div className="ingredient-staple-copy">
          <label htmlFor="ing-pantry-staple">Básico de despensa</label>
          <p className="ingredient-staple-help" id="ing-pantry-staple-help">
            No se descuenta al cocinar. Aparece en compras solo cuando se acaba.
          </p>
        </div>
      </div>
      <div className="quick-recipe-actions">
        {onCancel ? (
          <button className="btn btn-ghost" onClick={onCancel} type="button">
            Cancelar
          </button>
        ) : null}
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Guardando…" : actionLabel}
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
