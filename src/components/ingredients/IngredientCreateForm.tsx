"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import {
  DIMENSION_LABELS,
  UNITS_BY_DIMENSION,
  type IngredientDimension,
  type IngredientResponse,
} from "@/lib/ingredients";
import { toast } from "@/lib/toast";

export function IngredientCreateForm({
  autoFocusName = false,
  initialName = "",
  onCancel,
  onCreated,
  onSuccess,
  submitLabel = "Añadir ingrediente",
}: {
  autoFocusName?: boolean;
  initialName?: string;
  onCancel?: () => void;
  onCreated?: (ingredient: IngredientResponse) => void;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState("");
  const [dimension, setDimension] = useState<IngredientDimension>("mass");
  const [baseUnit, setBaseUnit] = useState("g");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const payload: components["schemas"]["IngredientCreate"] = {
      name: name.trim(),
      category: category.trim() || null,
      dimension,
      base_unit: baseUnit,
    };
    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as
        | (Partial<IngredientResponse> & { detail?: string })
        | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear el ingrediente.");
      if (body?.id) onCreated?.(body as IngredientResponse);
      toast("Ingrediente añadido a la despensa");
      setName("");
      setCategory("");
      onSuccess?.();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el ingrediente.");
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
      <div className="quick-recipe-actions">
        {onCancel ? (
          <button className="btn btn-ghost" onClick={onCancel} type="button">
            Cancelar
          </button>
        ) : null}
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Guardando…" : submitLabel}
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
